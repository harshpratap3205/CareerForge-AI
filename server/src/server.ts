import { app } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import './config/redis.js';
import { BookingService } from './modules/booking/booking.service.js';
import { AuthService } from './modules/auth/auth.service.js';

const startServer = async () => {
  await connectDB();
  await BookingService.seedConsultantsIfEmpty();
  await AuthService.seedAdminIfEmpty();

  app.listen(config.port, () => {
    console.log(`CareerForge Server running on port ${config.port} in ${config.nodeEnv} mode`);
    console.log(`Swagger Docs available at http://localhost:${config.port}/api/docs`);
  });
};

startServer();
