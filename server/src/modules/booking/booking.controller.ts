import { Request, Response, NextFunction } from 'express';
import { BookingService } from './booking.service.js';

export class BookingController {
  static async getConsultants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultants = await BookingService.listConsultants();
      res.status(200).json({ success: true, data: { consultants } });
    } catch (error) {
      next(error);
    }
  }

  static async getConsultantById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultant = await BookingService.getConsultant(req.params.id);
      if (!consultant) {
        res.status(404).json({ success: false, message: 'Consultant not found' });
        return;
      }
      res.status(200).json({ success: true, data: { consultant } });
    } catch (error) {
      next(error);
    }
  }

  static async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await BookingService.createBooking(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  static async getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await BookingService.getPaginatedBookings(
        req.user!.userId,
        req.user!.role,
        req.user?.email,
        req.query
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMyConsultantProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultant = await BookingService.getConsultantByUserIdOrEmail(
        req.user!.userId,
        req.user?.email
      );
      if (!consultant) {
        res.status(404).json({ success: false, message: 'Consultant profile not found' });
        return;
      }
      res.status(200).json({ success: true, data: { consultant } });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyConsultantProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await BookingService.updateConsultantProfile(
        req.user!.userId,
        req.user!.email,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Consultant profile updated successfully',
        data: { consultant: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await BookingService.updateStatus(req.params.id, 'CANCELLED');
      res.status(200).json({ success: true, data: { booking } });
    } catch (error) {
      next(error);
    }
  }
}
