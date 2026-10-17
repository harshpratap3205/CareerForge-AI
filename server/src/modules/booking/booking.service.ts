import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Booking, Consultant, BookingStatus, IBooking } from './booking.model.js';
import { User } from '../auth/user.model.js';
import { cacheDel } from '../../config/redis.js';

export class BookingService {
  static async seedConsultantsIfEmpty() {
    const defaultPassword = 'Consultant@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    let sarahUser = await User.findOne({ email: 'sarah.jenkins@careerforge.ai' });
    if (!sarahUser) {
      sarahUser = await User.create({
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@careerforge.ai',
        passwordHash,
        role: 'CONSULTANT',
      });
    }

    let sarah = await Consultant.findOne({ email: 'sarah.jenkins@careerforge.ai' });
    const sarahSlots = [
      '10:00 AM - 11:00 AM',
      '01:00 PM - 02:00 PM',
      '03:00 PM - 04:00 PM',
      '04:00 PM - 05:00 PM',
    ];
    if (!sarah) {
      await Consultant.create({
        userId: sarahUser._id,
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@careerforge.ai',
        specialty: 'FAANG Tech Lead & Resume Reviewer',
        hourlyRate: 75,
        bio: 'Former Google Staff Engineer with 10+ years interviewing candidates.',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        slots: sarahSlots,
        isActive: true,
      });
    } else {
      sarah.userId = sarahUser._id;
      sarah.slots = sarahSlots;
      await sarah.save();
    }

    let davidUser = await User.findOne({ email: 'david.chen@careerforge.ai' });
    if (!davidUser) {
      davidUser = await User.create({
        name: 'David Chen',
        email: 'david.chen@careerforge.ai',
        passwordHash,
        role: 'CONSULTANT',
      });
    }

    let david = await Consultant.findOne({ email: 'david.chen@careerforge.ai' });
    const davidSlots = [
      '09:00 AM - 10:00 AM',
      '11:00 AM - 12:00 PM',
      '02:00 PM - 03:00 PM',
      '03:00 PM - 04:00 PM',
    ];
    if (!david) {
      await Consultant.create({
        userId: davidUser._id,
        name: 'David Chen',
        email: 'david.chen@careerforge.ai',
        specialty: 'Executive Recruiter & Career Coach',
        hourlyRate: 60,
        bio: 'Head of Talent at Silicon Valley venture studio. Placed 250+ senior engineers.',
        availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
        slots: davidSlots,
        isActive: true,
      });
    } else {
      david.userId = davidUser._id;
      david.slots = davidSlots;
      await david.save();
    }
  }

  static async listConsultants() {
    await this.seedConsultantsIfEmpty();
    return Consultant.find({ isActive: true });
  }

  static async getConsultant(id: string) {
    return Consultant.findById(id);
  }

  static isSlotAvailable(requestedSlot: string, offeredSlots: string[]): boolean {
    const cleanReq = String(requestedSlot || '').trim();
    if (offeredSlots.includes(cleanReq)) return true;

    const parseMinutes = (tStr: string): number | null => {
      const isPM = /pm/i.test(tStr);
      const isAM = /am/i.test(tStr);
      const match = tStr.match(/(\d{1,2})(?::(\d{2}))?/);
      if (!match) return null;
      let hour = parseInt(match[1], 10);
      const min = match[2] ? parseInt(match[2], 10) : 0;
      if (isPM && hour < 12) hour += 12;
      if (isAM && hour === 12) hour = 0;
      return hour * 60 + min;
    };

    const reqPart = cleanReq.includes('-') ? cleanReq.split('-')[0].trim() : cleanReq.split('(')[0].trim();
    const reqMin = parseMinutes(reqPart);
    if (reqMin === null) return false;

    for (const slot of offeredSlots) {
      if (slot === cleanReq) return true;
      if (slot.includes('-')) {
        const [startStr, endStr] = slot.split('-');
        const sMin = parseMinutes(startStr);
        const eMin = parseMinutes(endStr);
        if (sMin !== null && eMin !== null) {
          if (reqMin >= sMin && reqMin < eMin) {
            return true;
          }
        }
      }
    }
    return false;
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

    if (!this.isSlotAvailable(data.timeSlot, consultant.slots)) {
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

  static async getConsultantByUserIdOrEmail(userId: string, email?: string) {
    let consultant = await Consultant.findOne({
      $or: [
        { userId: new mongoose.Types.ObjectId(userId) },
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
    });

    if (!consultant && (userId || email)) {
      const user = await User.findById(userId);
      if (user && user.role === 'CONSULTANT') {
        consultant = await Consultant.create({
          userId: user._id,
          name: user.name,
          email: user.email.toLowerCase(),
          specialty: 'Career Consultant & Technical Mentor',
          hourlyRate: 75,
          bio: 'Experienced mentor specializing in resume refinement, mock interviews, and career navigation.',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          slots: ['10:00', '13:00', '15:00', '17:00'],
          isActive: true,
        });
        await cacheDel('consultants:list');
      }
    } else if (consultant && !consultant.userId) {
      consultant.userId = new mongoose.Types.ObjectId(userId);
      await consultant.save();
    }
    return consultant;
  }

  static async updateConsultantProfile(
    userId: string,
    email: string,
    data: {
      hourlyRate?: number;
      specialty?: string;
      bio?: string;
      availableDays?: string[];
      slots?: string[];
      isActive?: boolean;
    }
  ) {
    let consultant = await this.getConsultantByUserIdOrEmail(userId, email);
    if (!consultant) {
      const err: any = new Error('Consultant profile not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.hourlyRate !== undefined && Number(data.hourlyRate) > 0) {
      consultant.hourlyRate = Number(data.hourlyRate);
    }
    if (data.specialty) consultant.specialty = data.specialty.trim();
    if (data.bio !== undefined) consultant.bio = data.bio.trim();
    if (Array.isArray(data.availableDays)) {
      consultant.availableDays = Array.from(new Set(data.availableDays.map((d: any) => String(d).trim()).filter(Boolean)));
    }
    if (Array.isArray(data.slots)) {
      consultant.slots = Array.from(new Set(data.slots.map((s: any) => String(s).trim()).filter(Boolean))).sort();
    }
    if (data.isActive !== undefined) consultant.isActive = Boolean(data.isActive);

    const updated = await consultant.save();
    await cacheDel('consultants:list');
    return updated;
  }

  static async getPaginatedBookings(
    userId: string,
    role: string,
    userEmail: string | undefined,
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
    if (role === 'ADMIN') {
      // no filter
    } else if (role === 'CONSULTANT') {
      const consultant = await this.getConsultantByUserIdOrEmail(userId, userEmail);
      if (consultant) {
        filter.consultantId = consultant._id;
      } else {
        return {
          items: [],
          pagination: { page, limit, total: 0, totalPages: 1 },
        };
      }
    } else {
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
