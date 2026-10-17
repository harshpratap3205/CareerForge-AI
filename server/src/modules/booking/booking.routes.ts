import { Router } from 'express';
import { BookingController } from './booking.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/consultant-profile', BookingController.getMyConsultantProfile);
router.put('/consultant-profile', BookingController.updateMyConsultantProfile);
router.get('/consultants', BookingController.getConsultants);
router.get('/consultants/:id', BookingController.getConsultantById);

router.post('/', BookingController.createBooking);
router.get('/', BookingController.getBookings);
router.patch('/:id/cancel', BookingController.cancelBooking);

export const bookingRoutes = router;
