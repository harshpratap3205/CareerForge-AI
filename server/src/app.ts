import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { config } from './config/env.js';
import cookieParser from 'cookie-parser';
import { globalLimiter } from './middlewares/rateLimiter.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/user/user.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { resumeRoutes } from './modules/resume/resume.routes.js';
import { bookingRoutes } from './modules/booking/booking.routes.js';
import { PaymentController } from './modules/payment/payment.controller.js';
import { paymentRoutes } from './modules/payment/payment.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, curl, webhooks)
      if (!origin) return callback(null, true);
      if (
        origin === config.clientUrl ||
        origin.includes('localhost') ||
        origin.endsWith('.vercel.app') ||
        /^https:\/\/.*\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: ${origin}`));
      // return callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());

// Stripe Webhook MUST receive raw buffer before express.json()
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);

app.use(
  express.json({
    verify: (req: any, _res: express.Response, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(globalLimiter);

app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
