import { Router } from 'express';
import { BookingController } from './booking.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/consultants', BookingController.getConsultants);
router.get('/consultants/:id', BookingController.getConsultantById);

router.post('/', BookingController.createBooking);
router.get('/', BookingController.getBookings);
router.patch('/:id/cancel', BookingController.cancelBooking);

export const bookingRoutes = router;
