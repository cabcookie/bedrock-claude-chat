import { Request, Response, Router } from 'express';
import { getCurrentUserFromRequestHeader } from '../helper/auth';
import { getTableClient } from '../helper/conversation-table';
import { ChatInput, ChatOutput, ConversationModel, DdbConversationModel, MessageMap, MessageModel, MessageOutput, ProposedTitle } from '../@types/schemas';
import { RecordNotFoundError } from '../helper/error-handler';
import { decomposeConversationId } from './conversations.route';
import { entries, flow, get, reduce, replace, trim } from 'lodash/fp';
import { traceToRoot } from '../helper/messages';
import { getBufferString, getModelId, invoke, modelInvokeBody } from '../helper/bedrock';
import { v4 as uuidv4 } from 'uuid';
import { InvokeModelWithResponseStreamCommandInput } from '@aws-sdk/client-bedrock-runtime';

const router = Router();

const findConversationById = async (userId: string, conversationId: string): Promise<ConversationModel> => {
  console.log("Finding conversation with ID:", conversationId);
  const table = await getTableClient(userId);
  const response = await table.getConversationById(userId, conversationId);

  if (!response.Items || response.Items.length == 0)
    throw new RecordNotFoundError(`No conversation found with id: ${conversationId}`);

  const item = response.Items[0] as DdbConversationModel;
  const conversation: ConversationModel = {
    id: decomposeConversationId(item.ConversationId),
    createTime: Number(item.CreateTime),
    title: item.Title,
    messageMap: flow(
      get('MessageMap'),
      JSON.parse,
      entries,
      reduce((acc, [k, v]) => {
        acc[k] = {
          role: v.role,
          content: {
            contentType: v.content.content_type,
            body: v.content.body,
          },
          model: v.model,
          children: v.children,
          parent: v.parent,
        };
        return acc;
      }, {} as MessageMap)
    )(item),
    lastMessageId: item.LastMessageId,
  };

  return conversation;
};

const proposeConversationTitle = async (userId: string, conversationId: string): Promise<ProposedTitle> => {
  const model = 'claude-instant-v1';
  const PROPMT = `Reading the conversation above, what is the appropriate title for the conversation? When answering the title, please follow the rules below:
  <rules>
  - Title must be in the same language as the conversation.
  - Title length must be from 15 to 20 characters.
  - Prefer more specific title than general. Your title should always be distinct from others.
  - Return the conversation title only. DO NOT include any strings other than the title.
  </rules>
  `;

  const {lastMessageId, messageMap} = await findConversationById(userId, conversationId);
  const messages = traceToRoot(lastMessageId, messageMap);
  const newMessage: MessageModel = {
    role: 'user',
    content: {
      contentType: 'text',
      body: PROPMT,
    },
    model,
    children: [],
    parent: lastMessageId,
    createTime: Date.now(),
  };
  messages.push(newMessage);

  const prompt = getBufferString(messages);
  console.log("Prompt:", prompt);
  const replyText = await invoke(prompt, model);
  return {
    title: flow(
      replace("\n", ""),
      trim,
    )(replyText),
  };
}

const changeConversationTitle = async (userId: string, conversationId: string, newTitle: string) => {
  console.log("Changing conversation title:", conversationId);
  console.log("New title:", newTitle);
  const table = await getTableClient(userId);
  const queryResponse = await table.getConversationById(userId, conversationId);

  if (!queryResponse.Items || queryResponse.Items.length == 0)
    throw new RecordNotFoundError(`No conversation found with id: ${conversationId}`);

  const updateResponse = await table.updateTitle(flow(
    get('Items'),
    get(0),
    get('UserId'),
  )(queryResponse), conversationId, newTitle);

  console.log("Update response:", updateResponse);
  return updateResponse;
};

const deleteConversationById = async (userId: string, conversationId: string) => {
  console.log("Deleting conversation:", conversationId);
  const table = await getTableClient(userId);
  const queryResponse = await table.getConversationById(userId, conversationId);

  if (!queryResponse.Items || queryResponse.Items.length == 0)
    throw new RecordNotFoundError(`No conversation found with id: ${conversationId}`);

  const deleteResponse = await table.deleteConversation(flow(
    get('Items'),
    get(0),
    get('UserId'),
  )(queryResponse), conversationId);

  console.log("Delete response:", deleteResponse);
  return deleteResponse;
};

export const prepareConversation = async (userId: string, chatInput: ChatInput) => {
  let conversation: ConversationModel;
  let parentId: string | null;

  try {
    conversation = await findConversationById(userId, chatInput.conversationId);
    console.log("Found conversation:", conversation);
    parentId = chatInput.message.parentMessageId;
  
  } catch (error) {
    if (!(error instanceof RecordNotFoundError))
      throw error;
    
    console.log(`No conversation found with id: ${chatInput.conversationId}. Creating new conversation.`);
    conversation = {
      id: chatInput.conversationId,
      title: 'New conversation',
      createTime: Date.now(),
      lastMessageId: '',
      messageMap: {
        system: {
          role: 'system',
          content: {
            contentType: 'text',
            body: '',
          },
          model: chatInput.message.model,
          children: [],
          parent: null,
          createTime: Date.now(),
        } as MessageModel,
      },
    } as ConversationModel;
    parentId = 'system';
  }

  const messageId = uuidv4();
  conversation.messageMap[messageId] = {
    role: chatInput.message.role,
    content: {
      contentType: chatInput.message.content.contentType,
      body: chatInput.message.content.body,
    },
    model: chatInput.message.model,
    children: [],
    parent: parentId,
    createTime: Date.now(),
  };

  if (chatInput.message.parentMessageId && conversation.messageMap[chatInput.message.parentMessageId]) {
    conversation.messageMap[chatInput.message.parentMessageId].children.push(messageId);
  }

  return {
    messageId,
    conversation,
  }
}

export const getInvokePayload = (conversation: ConversationModel, chatInput: ChatInput): InvokeModelWithResponseStreamCommandInput => {
  const messages = traceToRoot(
    chatInput.message.parentMessageId as string,
    conversation.messageMap
  );
  messages.push({
    ...chatInput.message,
    children: [],
    parent: null,
  });
  const prompt = getBufferString(messages);
  const modelId = getModelId(chatInput.message.model);
  return {
    modelId,
    body: JSON.stringify(modelInvokeBody(prompt)[modelId]),
    accept: 'application/json',
    contentType: 'application/json',
  };
};

export const storeConversation = async (userId: string, conversation: ConversationModel) => {
  console.log("Storing conversation:", conversation);
  const table = await getTableClient(userId);
  const response = await table.putItem(userId, conversation);
  console.log("Response:", response);
  return response;
}

const chat = async (userId: string, chatInput: ChatInput): Promise<ChatOutput> => {
  const { messageId, conversation} = await prepareConversation(userId, chatInput);
  const messages = traceToRoot(chatInput.message.parentMessageId as string, conversation.messageMap);
  messages.push({
    ...chatInput.message,
    children: [],
    parent: null,
  });

  const prompt = getBufferString(messages);
  const replyText = await invoke(prompt, chatInput.message.model);
  const assistantMsgId = uuidv4();
  const message = {
    role: 'assistant',
    content: {
      contentType: 'text',
      body: replyText,
    },
    model: chatInput.message.model,
    children: [],
    parent: messageId,
    createTime: Date.now(),
  } as MessageModel;
  conversation.messageMap[assistantMsgId] = message;

  conversation.messageMap[messageId].children.push(assistantMsgId);
  conversation.lastMessageId = assistantMsgId;

  await storeConversation(userId, conversation);

  const output: ChatOutput = {
    conversationId: conversation.id,
    createTime: conversation.createTime,
    message: {
      role: message.role,
      content: {
        contentType: message.content.contentType,
        body: message.content.body,
      },
      model: message.model,
      children: message.children,
      parent: message.parent,
    } as MessageOutput,
  };

  return output;
};

router.get('/:conversationId', async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  console.log(`GET /conversation/${conversationId}`);
  const currentUser = await getCurrentUserFromRequestHeader(req.headers);
  const conversation = await findConversationById(currentUser.sub, conversationId);
  console.log("Conversation:", conversation);
  res.status(200).json(conversation);
});

router.get('/:conversationId/proposed-title', async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  console.log(`GET /conversation/${conversationId}/proposed-title`);
  const currentUser = await getCurrentUserFromRequestHeader(req.headers);
  const title = await proposeConversationTitle(currentUser.sub, conversationId);
  console.log("Proposed title:", title);
  res.status(200).json(title);
});

router.patch('/:conversationId/title', async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { newTitle } = req.body;
  console.log(`PATCH /conversation/${conversationId}/title with '${newTitle}'`);
  const currentUser = await getCurrentUserFromRequestHeader(req.headers);
  const response = await changeConversationTitle(currentUser.sub, conversationId, newTitle);
  console.log("Update response:", response);
  res.status(200).json(response);
});

router.delete('/:conversationId', async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  console.log(`DELETE /conversation/${conversationId}`);
  const currentUser = await getCurrentUserFromRequestHeader(req.headers);
  const response = await deleteConversationById(currentUser.sub, conversationId);
  console.log("Delete response:", response);
  res.status(200).json(response);
});

router.post('/:conversationId', async (req: Request, res: Response) => {
  const { chatInput } = req.body;
  console.log(`POST /conversation with ${JSON.stringify(chatInput)}`);
  const currentUser = await getCurrentUserFromRequestHeader(req.headers);
  const output = await chat(currentUser.sub, chatInput);
  console.log("Output", output);
  res.status(200).json(output);
});

export default router;
