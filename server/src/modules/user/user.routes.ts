import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

export const userRoutes = router;
