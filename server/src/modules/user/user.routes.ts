import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

// Admin-only user management routes
router.get('/', authorize(['ADMIN']), UserController.getAllUsers);
router.patch('/:id/role', authorize(['ADMIN']), UserController.updateUserRole);

export const userRoutes = router;
