import { Request, Response, Router } from 'express';
import { getCurrentUser } from '../helper/auth';
import { getTableClient } from '../helper/conversation-table';
import { ConversationModel, DdbConversationModel, MessageModel } from './../@types/schemas';
import { RecordNotFoundError } from '../helper/error-handler';
import { composeConversationId, decomposeConversationId } from './conversations.route';
import { entries, flow, get, reduce } from 'lodash/fp';

const router = Router();

const findUserById = async (userId: string, conversationId: string): Promise<ConversationModel | undefined> => {
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

router.get('/:conversationId', async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  console.log(`GET /conversation/${conversationId}`);
  const currentUser = await getCurrentUser(req.headers);
  const conversation = await findUserById(currentUser.sub, conversationId);
  console.log("Conversation:", conversation);
  res.status(200).json(conversation);
});

export default router;
