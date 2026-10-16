import mongoose from 'mongoose';
import { Resume } from '../resume/resume.model.js';
import { ChatSession } from '../chat/chat.model.js';
import { Booking } from '../booking/booking.model.js';
import { cacheGet, cacheSet } from '../../config/redis.js';

export class DashboardService {
  static async getStats(userId: string) {
    const cacheKey = `dashboard:${userId}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      return { ...cached, source: 'cache' };
    }

    const uId = new mongoose.Types.ObjectId(userId);

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
