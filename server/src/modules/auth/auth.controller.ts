import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { User } from './user.model.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await AuthService.register(req.body);
      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getCookieOptions());
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          tokens: {
            accessToken: tokens.accessToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, tokens } = await AuthService.login(email, password);
      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getCookieOptions());
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          tokens: {
            accessToken: tokens.accessToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ success: false, message: 'Refresh token missing' });
        return;
      }
      const tokens = await AuthService.refresh(refreshToken);
      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getCookieOptions());
      res.status(200).json({
        success: true,
        message: 'Tokens refreshed',
        data: {
          tokens: {
            accessToken: tokens.accessToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
      if (req.user?.userId) {
        await AuthService.logout(req.user.userId);
      }
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.user?.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.resetToken ? { resetToken: result.resetToken } : undefined,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      await AuthService.resetPassword(token, password);
      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You may now log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = (req.query.token as string) || req.body?.token;
      if (!token) {
        res.status(400).json({ success: false, message: 'Verification token is required' });
        return;
      }
      await AuthService.verifyEmail(token);
      res.status(200).json({
        success: true,
        message: 'Email verified successfully. Your account is active.',
      });
    } catch (error) {
      next(error);
    }
  }
}
