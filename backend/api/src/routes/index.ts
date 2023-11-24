import { Router } from 'express';
import health from './health.route';
import conversations from './conversations.route';
import conversation from './conversation.route';

const router = Router();
router.use('/health', health);
router.use('/conversations', conversations);
router.use('/conversation', conversation);

export default router;
