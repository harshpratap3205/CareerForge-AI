import mongoose from 'mongoose';
import { Booking, Consultant, BookingStatus, IBooking } from './booking.model.js';
import { cacheDel } from '../../config/redis.js';

export class BookingService {
  static async seedConsultantsIfEmpty() {
    const count = await Consultant.countDocuments();
    if (count === 0) {
      await Consultant.create([
        {
          name: 'Sarah Jenkins',
          email: 'sarah.jenkins@careerforge.ai',
          specialty: 'FAANG Tech Lead & Resume Reviewer',
          hourlyRate: 75,
          bio: 'Former Google Staff Engineer with 10+ years interviewing candidates.',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          slots: ['10:00', '13:00', '15:00', '17:00'],
          isActive: true,
        },
        {
          name: 'David Chen',
          email: 'david.chen@careerforge.ai',
          specialty: 'Executive Recruiter & Career Coach',
          hourlyRate: 60,
          bio: 'Head of Talent at Silicon Valley venture studio. Placed 250+ senior engineers.',
          availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
          slots: ['09:00', '11:00', '14:00', '16:00'],
          isActive: true,
        },
      ]);
    }
  }

  static async listConsultants() {
    await this.seedConsultantsIfEmpty();
    return Consultant.find({ isActive: true });
  }

  static async getConsultant(id: string) {
    return Consultant.findById(id);
  }

  static async createBooking(
    userId: string,
    data: {
      consultantId: string;
      date: string;
      timeSlot: string;
      name: string;
      email: string;
      phone: string;
      meetingAgenda: string;
    }
  ): Promise<IBooking> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(data.date);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      const err: any = new Error('Cannot book consultation dates in the past');
      err.statusCode = 400;
      throw err;
    }

    const consultant = await Consultant.findById(data.consultantId);
    if (!consultant || !consultant.isActive) {
      const err: any = new Error('Consultant not found or unavailable');
      err.statusCode = 404;
      throw err;
    }

    if (!consultant.slots.includes(data.timeSlot)) {
      const err: any = new Error('Requested time slot is not offered by this consultant');
      err.statusCode = 400;
      throw err;
    }

    const existingConflict = await Booking.findOne({
      consultantId: consultant._id,
      date: data.date,
      timeSlot: data.timeSlot,
      status: { $in: ['PENDING_PAYMENT', 'PAID', 'CONFIRMED'] },
    });

    if (existingConflict) {
      const err: any = new Error('This time slot is already reserved. Please select another slot.');
      err.statusCode = 409;
      throw err;
    }

    const booking = new Booking({
      userId: new mongoose.Types.ObjectId(userId),
      consultantId: consultant._id,
      date: data.date,
      timeSlot: data.timeSlot,
      name: data.name,
      email: data.email,
      phone: data.phone,
      meetingAgenda: data.meetingAgenda,
      status: 'PENDING_PAYMENT',
      amount: consultant.hourlyRate,
    });

    const saved = await booking.save();
    await cacheDel(`dashboard:${userId}`);
    return saved;
  }

  static async updateStatus(
    bookingId: string,
    nextStatus: BookingStatus,
    metadata?: { paymentIntentId?: string; calendarEventId?: string; meetingLink?: string }
  ) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err: any = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      PENDING_PAYMENT: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
      PAID: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
      PAYMENT_FAILED: ['PENDING_PAYMENT', 'CANCELLED'],
    };

    if (!allowedTransitions[booking.status].includes(nextStatus)) {
      const err: any = new Error(
        `Invalid status transition from ${booking.status} to ${nextStatus}`
      );
      err.statusCode = 400;
      throw err;
    }

    booking.status = nextStatus;
    if (metadata?.paymentIntentId) booking.paymentIntentId = metadata.paymentIntentId;
    if (metadata?.calendarEventId) booking.calendarEventId = metadata.calendarEventId;
    if (metadata?.meetingLink) booking.meetingLink = metadata.meetingLink;

    const saved = await booking.save();
    await cacheDel(`dashboard:${booking.userId.toString()}`);
    return saved;
  }

  static async getPaginatedBookings(
    userId: string,
    role: string,
    query: {
      page?: number;
      limit?: number;
      status?: BookingStatus;
      search?: string;
      sort?: string;
    }
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (role !== 'ADMIN') {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { meetingAgenda: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortField = query.sort || '-createdAt';

    const [items, total] = await Promise.all([
      Booking.find(filter)
        .populate('consultantId', 'name specialty hourlyRate avatarUrl email')
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
