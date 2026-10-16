import { Router } from 'express';
import { ChatController } from './chat.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { aiLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/sessions', ChatController.createSession);
router.get('/sessions', ChatController.listSessions);
router.get('/sessions/:id', ChatController.getSession);
router.patch('/sessions/:id', ChatController.renameSession);
router.delete('/sessions/:id', ChatController.deleteSession);

router.post('/sessions/:id/messages', aiLimiter, ChatController.sendMessage);
router.post('/sessions/:id/stream', aiLimiter, ChatController.streamMessage);

export const chatRoutes = router;
