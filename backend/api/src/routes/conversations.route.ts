import { Request, Response, Router } from 'express';
import { getCurrentUser } from '../helper/auth';
import { getTableClient } from '../helper/conversation-table';
import { ConversationMeta } from '../@types/schemas';
import { RecordNotFoundError } from '../helper/error-handler';

const router = Router();

export const decomposeConversationId = (str: string) => str.split("_")[1] as string;

export const composeConversationId = (userId: string, conversationId: string) =>
  `${userId}_${conversationId}` as string;

const deleteConversationByUserId = async (userId: string): Promise<any> => {
  console.log("Deleting conversations for user:", userId);
  const conversations = await findConversationByUserId(userId);
  if (!conversations)
    throw new RecordNotFoundError(`No conversations found for user: ${userId}`);

  const table = await getTableClient(userId);
  const responses = [];
  for (let index = 0; index < conversations.length; index++) {
    const conversation = conversations[index];
    const response = await table.deleteConversation(userId, conversation.id);
    responses.push(response);
  }
  console.log("Delete responses:", responses);
  return responses;
};

const findConversationByUserId = async (userId: string): Promise<Array<ConversationMeta>> => {
  console.log("Finding conversations for user:", userId);

  const table = await getTableClient(userId);

  const response = await table.query({
    KeyConditionExpression: 'UserId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ScanIndexForward: false,
  });

  console.log("Response:", response);
  if (!response || !response.Items)
    throw new RecordNotFoundError('Conversations not found');

  return response.Items.map((item): ConversationMeta => ({
    id: decomposeConversationId(item.ConversationId),
    title: item.Title as string,
    createTime: Number(item.CreateTime),
    model: JSON.parse(item.MessageMap as string).system.model,
  }));
};

router.get('/', async (req: Request, res: Response) => {
  console.log("GET /conversations");
  const currentUser = await getCurrentUser(req.headers);
  const conversations = await findConversationByUserId(currentUser.sub);
  console.log("Conversations:", conversations);
  res.status(200).json(conversations);
});

router.delete('/', async (req: Request, res: Response) => {
  console.log("DELETE /conversations");
  const currentUser = await getCurrentUser(req.headers);
  const response = await deleteConversationByUserId(currentUser.sub);
  console.log("Delete response:", response);
  res.status(200).json(response);
});

export default router;
