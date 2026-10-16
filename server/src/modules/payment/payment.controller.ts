import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service.js';

export class PaymentController {
  static async createCheckoutSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { bookingId } = req.body;
      const result = await PaymentService.createCheckoutSession(bookingId, req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        res.status(400).json({ success: false, message: 'Missing stripe signature' });
        return;
      }

      const result = await PaymentService.handleWebhook(req.body, signature);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async mockConfirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookingId } = req.body;
      const result = await PaymentService.mockConfirm(bookingId, req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
