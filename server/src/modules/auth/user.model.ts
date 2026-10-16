import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'USER' | 'ADMIN' | 'CONSULTANT';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  profile?: {
    bio?: string;
    headline?: string;
    avatarUrl?: string;
    skills?: string[];
    experienceYears?: number;
  };
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'CONSULTANT'],
      default: 'USER',
      index: true,
    },
    profile: {
      bio: { type: String, default: '' },
      headline: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
      skills: [{ type: String }],
      experienceYears: { type: Number, default: 0 },
    },
    refreshTokenHash: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete (ret as Record<string, unknown>).passwordHash;
        delete (ret as Record<string, unknown>).refreshTokenHash;
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
