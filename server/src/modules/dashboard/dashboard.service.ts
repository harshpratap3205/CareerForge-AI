import mongoose from 'mongoose';
import { Resume } from '../resume/resume.model.js';
import { ChatSession } from '../chat/chat.model.js';
import { Booking } from '../booking/booking.model.js';
import { cacheGet, cacheSet } from '../../config/redis.js';

export class DashboardService {
  static async getStats(userId: string) {
    const cacheKey = `dashboard:${userId}`;

    console.log(`[Dashboard] Cache lookup for key: ${cacheKey}`);

    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      console.log(`[Dashboard] Cache hit (source: redis, latency: ~1ms)`);
      return { ...cached, source: 'cache' };
    }

    console.log(`[Dashboard] Cache miss (source: mongodb)`);

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

    console.log(`[Dashboard] Aggregated from MongoDB:`, JSON.stringify(data));
    console.log(`[Dashboard] Storing in Redis with 300s TTL`);
    await cacheSet(cacheKey, data, 300);

    return { ...data, source: 'database' };
  }
}
