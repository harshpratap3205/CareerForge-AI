import mongoose from 'mongoose';
import { Resume } from '../resume/resume.model.js';
import { ChatSession } from '../chat/chat.model.js';
import { Booking, Consultant } from '../booking/booking.model.js';
import { User } from '../auth/user.model.js';
import { cacheGet, cacheSet, cacheDel } from '../../config/redis.js';

export class DashboardService {
  static async invalidateDashboardCache(userId: string, consultantUserId?: string) {
    const keys = [
      `dashboard:${userId}`,
      `dashboard:USER:${userId}`,
      `dashboard:CONSULTANT:${userId}`,
      `dashboard:ADMIN:${userId}`,
    ];
    if (consultantUserId) {
      keys.push(
        `dashboard:${consultantUserId}`,
        `dashboard:CONSULTANT:${consultantUserId}`
      );
    }
    await Promise.all(keys.map((k) => cacheDel(k)));
  }

  static async getStats(userId: string, role = 'USER', email?: string) {
    const cacheKey = `dashboard:${role}:${userId}`;

    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      return { ...cached, source: 'cache' };
    }

    const uId = new mongoose.Types.ObjectId(userId);

    if (role === 'ADMIN') {
      const [
        totalUsers,
        totalConsultants,
        totalResumes,
        totalChats,
        totalBookings,
        revenueAgg,
        bookingStats,
      ] = await Promise.all([
        User.countDocuments({}),
        Consultant.countDocuments({}),
        Resume.countDocuments({}),
        ChatSession.countDocuments({}),
        Booking.countDocuments({}),
        Booking.aggregate([
          { $match: { status: { $in: ['PAID', 'CONFIRMED', 'COMPLETED'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Booking.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      const statusMap: Record<string, number> = {};
      bookingStats.forEach((item) => {
        statusMap[item._id] = item.count;
      });

      const data = {
        role: 'ADMIN',
        totalUsers,
        totalConsultants,
        totalResumes,
        totalChats,
        totalBookings,
        totalRevenue: revenueAgg[0]?.total || 0,
        confirmedConsultations: (statusMap['CONFIRMED'] || 0) + (statusMap['PAID'] || 0),
        completedConsultations: statusMap['COMPLETED'] || 0,
        pendingPaymentConsultations: statusMap['PENDING_PAYMENT'] || 0,
        cancelledConsultations: statusMap['CANCELLED'] || 0,
      };

      await cacheSet(cacheKey, data, 120);
      return { ...data, source: 'database' };
    }

    if (role === 'CONSULTANT') {
      let consultant = await Consultant.findOne({
        $or: [{ userId: uId }, { email: email?.toLowerCase() }],
      });

      if (!consultant && email) {
        consultant = await Consultant.findOne({ email: email.toLowerCase() });
      }

      const consultantId = consultant?._id;

      const [bookingStats, revenueAgg] = await Promise.all([
        consultantId
          ? Booking.aggregate([
              { $match: { consultantId } },
              { $group: { _id: '$status', count: { $sum: 1 } } },
            ])
          : Promise.resolve([]),
        consultantId
          ? Booking.aggregate([
              {
                $match: {
                  consultantId,
                  status: { $in: ['PAID', 'CONFIRMED', 'COMPLETED'] },
                },
              },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ])
          : Promise.resolve([]),
      ]);

      const statusMap: Record<string, number> = {};
      bookingStats.forEach((item) => {
        statusMap[item._id] = item.count;
      });

      const upcomingSessions =
        (statusMap['CONFIRMED'] || 0) + (statusMap['PAID'] || 0);
      const completedSessions = statusMap['COMPLETED'] || 0;

      const data = {
        role: 'CONSULTANT',
        consultantProfile: consultant
          ? {
              _id: consultant._id,
              name: consultant.name,
              email: consultant.email,
              specialty: consultant.specialty,
              hourlyRate: consultant.hourlyRate,
              bio: consultant.bio,
              availableDays: consultant.availableDays,
              slots: consultant.slots,
              isActive: consultant.isActive,
            }
          : null,
        totalSessions: (upcomingSessions + completedSessions) || 0,
        upcomingConsultations: upcomingSessions,
        completedConsultations: completedSessions,
        pendingPaymentConsultations: statusMap['PENDING_PAYMENT'] || 0,
        totalEarnings: revenueAgg[0]?.total || 0,
        hourlyRate: consultant?.hourlyRate || 75,
      };

      await cacheSet(cacheKey, data, 120);
      return { ...data, source: 'database' };
    }

    const [resumeCount, chatCount, bookingStats] = await Promise.all([
      Resume.countDocuments({ userId: uId }),
      ChatSession.countDocuments({ userId: uId }),
      Booking.aggregate([
        { $match: { userId: uId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const bookingStatusMap: Record<string, number> = {};
    bookingStats.forEach((item) => {
      bookingStatusMap[item._id] = item.count;
    });

    const upcomingConsultations =
      (bookingStatusMap['CONFIRMED'] || 0) + (bookingStatusMap['PAID'] || 0);
    const completedConsultations = bookingStatusMap['COMPLETED'] || 0;

    const data = {
      role: 'USER',
      totalResumes: resumeCount,
      totalChats: chatCount,
      upcomingConsultations,
      completedConsultations,
      pendingPaymentConsultations: bookingStatusMap['PENDING_PAYMENT'] || 0,
    };

    await cacheSet(cacheKey, data, 300);
    return { ...data, source: 'database' };
  }
}
