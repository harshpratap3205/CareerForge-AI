import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', DashboardController.getDashboard);

export const dashboardRoutes = router;
