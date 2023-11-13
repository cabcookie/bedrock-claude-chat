import { Router } from 'express';
import health from './health.route';
import conversations from './conversations.route';

const router = Router();
router.use('/health', health);
router.use('/conversations', conversations);

export default router;
