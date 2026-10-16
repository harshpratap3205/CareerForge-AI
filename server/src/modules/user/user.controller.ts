import { Request, Response, NextFunction } from 'express';
import { User } from '../auth/user.model.js';

export class UserController {
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, phone, profile } = req.body;
      const user = await User.findById(req.user?.userId);

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (name) user.name = name.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (profile) {
        user.profile = {
          ...(user.profile || {}),
          ...profile,
        };
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.user?.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }
}
