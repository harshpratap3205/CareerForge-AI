import Stripe from 'stripe';
import { config } from '../../config/env.js';
import { Booking } from '../booking/booking.model.js';
import { Payment } from './payment.model.js';
import { NotificationService } from '../notification/notification.service.js';
import { BookingService } from '../booking/booking.service.js';
import mongoose from 'mongoose';

const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey, { apiVersion: '2025-01-27.acacia' as any })
  : null;

export class PaymentService {
  static async createCheckoutSession(bookingId: string, userId: string) {
    const booking = await Booking.findOne({
      _id: new mongoose.Types.ObjectId(bookingId),
      userId: new mongoose.Types.ObjectId(userId),
    }).populate('consultantId');

    if (!booking) {
      const err: any = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    if (booking.status !== 'PENDING_PAYMENT') {
      const err: any = new Error(`Booking is already in ${booking.status} state`);
      err.statusCode = 400;
      throw err;
    }

    const consultant: any = booking.consultantId;
    const sessionAmount = Math.round(booking.amount * 100);

    if (!stripe) {
      const mockSessionId = `mock_session_${Date.now()}`;
      booking.stripeSessionId = mockSessionId;
      await booking.save();

      return {
        url: `${config.clientUrl}/consultations/success?session_id=${mockSessionId}&booking_id=${booking._id}`,
        sessionId: mockSessionId,
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Consultation with ${consultant?.name || 'Career Expert'}`,
              description: `Date: ${booking.date} at ${booking.timeSlot} | Agenda: ${booking.meetingAgenda}`,
            },
            unit_amount: sessionAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: booking.email,
      client_reference_id: booking._id.toString(),
      metadata: {
        bookingId: booking._id.toString(),
        userId: userId,
      },
      success_url: `${config.clientUrl}/consultations/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
      cancel_url: `${config.clientUrl}/consultations/book?canceled=true`,
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  static async handleWebhook(rawBody: Buffer, signature: string) {
    if (!stripe || !config.stripe.webhookSecret) {
      throw new Error('Stripe is not configured on this server');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
    } catch (err: any) {
      const error: any = new Error(`Webhook Signature Verification Failed: ${err.message}`);
      error.statusCode = 400;
      throw error;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.confirmBookingPayment({
        stripeSessionId: session.id,
        paymentIntentId: (session.payment_intent as string) || session.id,
        bookingId: session.metadata?.bookingId || (session.client_reference_id as string),
        userId: session.metadata?.userId,
        amount: (session.amount_total || 0) / 100,
        rawWebhookData: event,
      });
    }

    return { received: true };
  }

  static async confirmBookingPayment(params: {
    stripeSessionId: string;
    paymentIntentId: string;
    bookingId: string;
    userId?: string;
    amount: number;
    rawWebhookData?: any;
  }) {
    const existingPayment = await Payment.findOne({
      $or: [
        { stripeSessionId: params.stripeSessionId },
        { paymentIntentId: params.paymentIntentId },
      ],
    });

    if (existingPayment) {
      return { status: 'already_processed', payment: existingPayment };
    }

    const booking = await Booking.findById(params.bookingId).populate('consultantId');
    if (!booking) {
      console.warn(`Booking ${params.bookingId} not found during payment confirmation`);
      return null;
    }

    console.log(`[Payment Workflow] Step 1/4: Recording payment ($${params.amount}) for Booking #${booking._id}...`);
    const payment = await Payment.create({
      bookingId: booking._id,
      userId: booking.userId,
      stripeSessionId: params.stripeSessionId,
      paymentIntentId: params.paymentIntentId,
      amount: params.amount || booking.amount,
      status: 'succeeded',
      rawWebhookData: params.rawWebhookData,
    });

    console.log(`[Payment Workflow] Step 2/4: Transitioning Booking #${booking._id} status to PAID`);
    await BookingService.updateStatus(booking._id.toString(), 'PAID', {
      paymentIntentId: params.paymentIntentId,
    });

    const consultant: any = booking.consultantId;

    console.log(`[Payment Workflow] Step 3/4: Triggering Google Calendar event creation...`);
    const calendarResult = await NotificationService.createGoogleCalendarEvent({
      userName: booking.name,
      userEmail: booking.email,
      consultantName: consultant?.name || 'Career Expert',
      date: booking.date,
      timeSlot: booking.timeSlot,
      agenda: booking.meetingAgenda,
    });

    console.log(`[Payment Workflow] Step 4/4: Transitioning Booking #${booking._id} to CONFIRMED with Meeting Link: ${calendarResult?.meetingUrl}`);
    await BookingService.updateStatus(booking._id.toString(), 'CONFIRMED', {
      calendarEventId: calendarResult?.eventId,
      meetingLink: calendarResult?.meetingUrl,
    });

    await NotificationService.sendBookingConfirmationEmail({
      userName: booking.name,
      userEmail: booking.email,
      consultantName: consultant?.name || 'Career Expert',
      date: booking.date,
      timeSlot: booking.timeSlot,
      meetingLink: calendarResult?.meetingUrl || 'https://meet.google.com',
      bookingId: booking._id.toString(),
    });

    console.log(`[Payment Workflow] Complete: Booking #${booking._id} is CONFIRMED, calendar synchronized, and dashboard cache invalidated.`);
    return { status: 'confirmed', payment };
  }

  static async verifyCheckoutSession(sessionId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured on this server');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const bookingId = session.metadata?.bookingId || (session.client_reference_id as string);
      if (!bookingId) {
        throw new Error('No booking ID found in checkout session');
      }

      const result = await this.confirmBookingPayment({
        stripeSessionId: session.id,
        paymentIntentId: (session.payment_intent as string) || session.id,
        bookingId,
        userId: session.metadata?.userId,
        amount: (session.amount_total || 0) / 100,
        rawWebhookData: { verifiedViaApi: true, session },
      });

      return { verified: true, paymentStatus: session.payment_status, result };
    }

    return { verified: false, paymentStatus: session.payment_status };
  }

  static async mockConfirm(bookingId: string, userId: string) {
    const mockSessionId = `mock_sess_${Date.now()}`;
    const mockIntentId = `mock_pi_${Date.now()}`;

    return this.confirmBookingPayment({
      stripeSessionId: mockSessionId,
      paymentIntentId: mockIntentId,
      bookingId,
      userId,
      amount: 50,
      rawWebhookData: { mock: true },
    });
  }
}
