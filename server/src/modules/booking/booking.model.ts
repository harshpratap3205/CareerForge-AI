import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED';

export interface IConsultant extends Document {
  name: string;
  email: string;
  specialty: string;
  hourlyRate: number;
  avatarUrl?: string;
  bio?: string;
  availableDays: string[];
  slots: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  consultantId: mongoose.Types.ObjectId;
  date: string;
  timeSlot: string;
  name: string;
  email: string;
  phone: string;
  meetingAgenda: string;
  status: BookingStatus;
  amount: number;
  paymentIntentId?: string;
  stripeSessionId?: string;
  calendarEventId?: string;
  meetingLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultantSchema = new Schema<IConsultant>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    specialty: { type: String, required: true },
    hourlyRate: { type: Number, required: true, default: 50 },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    availableDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    slots: { type: [String], default: ['09:00', '11:00', '14:00', '16:00'] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const BookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    consultantId: {
      type: Schema.Types.ObjectId,
      ref: 'Consultant',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    meetingAgenda: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'PAYMENT_FAILED'],
      default: 'PENDING_PAYMENT',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentIntentId: {
      type: String,
      index: true,
    },
    stripeSessionId: {
      type: String,
      index: true,
    },
    calendarEventId: {
      type: String,
    },
    meetingLink: {
      type: String,
    },
  },
  { timestamps: true }
);

BookingSchema.index({ consultantId: 1, date: 1, timeSlot: 1 });
BookingSchema.index({ userId: 1, createdAt: -1 });

export const Consultant = mongoose.model<IConsultant>('Consultant', ConsultantSchema);
export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
