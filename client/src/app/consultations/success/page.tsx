'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { api } from '../../../lib/api';
import { CheckCircle, Calendar, Video, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams?.get('booking_id');
  const sessionId = searchParams?.get('session_id');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const confirmAndLoad = async () => {
      try {
        if (sessionId && sessionId.startsWith('mock_')) {
          await api.post('/payments/mock-confirm', { bookingId });
        } else if (sessionId) {
          // Direct backend verification with Stripe API in case webhook is delayed or testing locally
          await api.post('/payments/verify-session', { sessionId }).catch(console.warn);
        }

        const res = await api.get('/bookings', { params: { limit: 10 } });
        const match = res.data.data.items.find((b: any) => b._id === bookingId);
        setBooking(match);
      } catch (err) {
        console.error('Error confirming booking:', err);
      } finally {
        setLoading(false);
      }
    };

    confirmAndLoad();
  }, [bookingId, sessionId]);

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultation Confirmed!</h1>
          <p className="text-xs text-gray-500 mt-1">
            Payment verified. Your calendar invitation and confirmation email have been dispatched.
          </p>
        </div>

        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 text-xs text-gray-700 border border-gray-200">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="font-semibold text-gray-500">Booking Reference:</span>
              <span className="font-mono text-gray-900">{bookingId}</span>
            </div>
            {booking && (
              <>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-500">Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    booking.status === 'CONFIRMED' || booking.status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-500">Consultant:</span>
                  <span className="font-medium text-gray-900">{booking.consultantId?.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-500">Date & Time:</span>
                  <span className="font-medium text-gray-900">{booking.date} at {booking.timeSlot}</span>
                </div>
                {booking.meetingLink && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-semibold text-gray-500">Meeting Room:</span>
                    <a
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Google Meet
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-4">
          <Link
            href="/consultations"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition"
          >
            View All Consultations <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConsultationSuccessPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="text-center py-12">Loading confirmation...</div>}>
        <SuccessContent />
      </Suspense>
    </AppShell>
  );
}
