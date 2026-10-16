import { Router } from 'express';
import { ResumeController } from './resume.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { aiLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', ResumeController.list);
router.post('/', ResumeController.create);
router.get('/:id', ResumeController.getOne);
router.put('/:id', ResumeController.update);
router.delete('/:id', ResumeController.remove);
router.post('/:id/duplicate', ResumeController.duplicate);
router.post('/generate-ai', aiLimiter, ResumeController.generateAI);

export const resumeRoutes = router;
