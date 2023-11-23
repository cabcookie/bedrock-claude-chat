import { Request, Response, Router } from 'express';
import { getCurrentUser } from '../helper/auth';
import { getTableClient } from '../helper/conversation-table';
import { ConversationMeta } from './../@types/schemas';
import { RecordNotFoundError } from '../helper/error-handler';

const router = Router();

export const decomposeConversationId = (str: string) => str.split("_")[1] as string;

export const composeConversationId = (userId: string, conversationId: string) =>
  `${userId}_${conversationId}` as string;

const findConversationByUserId = async (userId: string): Promise<Array<ConversationMeta> | undefined> => {
  console.log("Finding conversations for user:", userId);

  const table = await getTableClient(userId);

  const response = await table.query({
    KeyConditionExpression: 'UserId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ScanIndexForward: false,
  });

  console.log("Response:", response);
  if (!response)
    throw new RecordNotFoundError('Conversations not found');

  return response.Items?.map((item): ConversationMeta => ({
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

export default router;
