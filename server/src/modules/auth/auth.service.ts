import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from './user.model.js';
import { config } from '../../config/env.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(user: IUser): TokenPair {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as any,
    });

    return { accessToken, refreshToken };
  }

  static async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
  }): Promise<{ user: IUser; tokens: TokenPair }> {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      const err: any = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await this.hashPassword(data.password);
    const user = new User({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      role: data.role || 'USER',
    });

    const tokens = this.generateTokens(user);
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 8);
    await user.save();

    return { user, tokens };
  }

  static async login(
    email: string,
    pass: string
  ): Promise<{ user: IUser; tokens: TokenPair }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await this.comparePassword(pass, user.passwordHash);
    if (!isMatch) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const tokens = this.generateTokens(user);
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 8);
    await user.save();

    return { user, tokens };
  }

  static async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
        userId: string;
      };

      const user = await User.findById(decoded.userId);
      if (!user || !user.refreshTokenHash) {
        const err: any = new Error('Invalid token');
        err.statusCode = 401;
        throw err;
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isValid) {
        user.refreshTokenHash = undefined;
        await user.save();
        const err: any = new Error('Token reuse detected or revoked');
        err.statusCode = 403;
        throw err;
      }

      const tokens = this.generateTokens(user);
      user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 8);
      await user.save();

      return tokens;
    } catch (err: any) {
      const error: any = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }
  }

  static async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
  }
}
