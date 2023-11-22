import { Request, Response, Router } from 'express';
import { getCurrentUser } from '../helper/auth';
import { getTableClient } from '../helper/conversation-table';
import { ConversationMeta } from './../@types/schemas';



const router = Router();

const findConversationByUserId = async (userId: string): Promise<Array<ConversationMeta> | undefined> => {
  console.log("Finding conversations for user:", userId);

  const table = await getTableClient(userId);

  const response = await table.query({
    KeyConditionExpression: 'UserId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ScanIndexForward: false,
  });

  console.log("Response:", response);

  return response.Items?.map((item): ConversationMeta => ({
    id: item.ConversationId.split("_")[1] as string,
    title: item.Title as string,
    createTime: Number(item.CreateTime),
    model: JSON.parse(item.MessageMap as string).system.model,
  }));
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const currentUser = await getCurrentUser(req.headers);
    console.log("Current user:", currentUser);

    const conversations = await findConversationByUserId(currentUser.sub);
    console.log("Conversations:", conversations);

    if (!conversations) {
      res.status(404).json({ message: 'Conversations not found' });
      return;
    }

    res.status(200).json(conversations);
  } catch (error) {
    console.error('An error ocurred:', error);
    res.status(500).json(error);
  }
});

export default router;
