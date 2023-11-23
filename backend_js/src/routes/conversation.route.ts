import { Request, Response, Router } from 'express';
import { getCurrentUser } from '../helper/auth';
import { getTableClient } from '../helper/conversation-table';
import { ConversationModel, DdbConversationModel, MessageModel, ProposedTitle } from './../@types/schemas';
import { RecordNotFoundError } from '../helper/error-handler';
import { composeConversationId, decomposeConversationId } from './conversations.route';
import { entries, flow, get, reduce, replace, trim } from 'lodash/fp';
import { traceToRoot } from '../helper/messages';
import { getBufferString, invoke } from '../helper/bedrock';

const router = Router();

const findConversationById = async (userId: string, conversationId: string): Promise<ConversationModel> => {
  console.log("Finding conversation with ID:", conversationId);
  const table = await getTableClient(userId);

  const response = await table.query({
    IndexName: 'ConversationIdIndex',
    KeyConditionExpression: 'ConversationId = :conversationId',
    ExpressionAttributeValues: { ':conversationId': composeConversationId(userId, conversationId) },
  });

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
      }, {} as {[key: string]: MessageModel})
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

router.get('/:conversationId', async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  console.log(`GET /conversation/${conversationId}`);
  const currentUser = await getCurrentUser(req.headers);
  const conversation = await findConversationById(currentUser.sub, conversationId);
  console.log("Conversation:", conversation);
  res.status(200).json(conversation);
});

router.get('/:conversationId/proposed-title', async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  console.log(`GET /conversation/${conversationId}/proposed-title`);
  const currentUser = await getCurrentUser(req.headers);
  const title = await proposeConversationTitle(currentUser.sub, conversationId);
  console.log("Proposed title:", title);
  res.status(200).json(title);
});

export default router;
