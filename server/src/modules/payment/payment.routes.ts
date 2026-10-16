import express, { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);

router.use(express.json());

router.post('/create-checkout-session', authenticate, PaymentController.createCheckoutSession);
router.post('/verify-session', authenticate, PaymentController.verifySession);
router.post('/mock-confirm', authenticate, PaymentController.mockConfirm);

export const paymentRoutes = router;
