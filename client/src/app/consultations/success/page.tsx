'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { api } from '../../../lib/api';
import {
  CheckCircle2,
  Calendar,
  Video,
  Mail,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Clock,
  User,
} from 'lucide-react';
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

        const res = await api.get('/bookings', { params: { limit: 20 } });
        const match = res.data.data.items.find((b: any) => b._id === bookingId);
        setBooking(match);

        // If status is transitioning from PAID to CONFIRMED or generating meet link, poll once more
        if (match && (!match.meetingLink || match.status === 'PAID')) {
          setTimeout(async () => {
            try {
              const retryRes = await api.get('/bookings', { params: { limit: 20 } });
              const retryMatch = retryRes.data.data.items.find((b: any) => b._id === bookingId);
              if (retryMatch) setBooking(retryMatch);
            } catch (_) {}
          }, 1500);
        }
      } catch (err) {
        console.error('Error confirming booking:', err);
      } finally {
        setLoading(false);
      }
    };

    confirmAndLoad();
  }, [bookingId, sessionId]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-6">
        {/* Header Hero */}
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Booking Confirmed & Synced
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Consultation Scheduled!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mt-1.5">
            Your payment was successfully processed. Your Google Calendar event and meeting room have been created, and a confirmation email has been dispatched.
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-500 font-medium">Finalizing calendar invitation & meeting link...</p>
          </div>
        ) : (
          <div className="space-y-6 text-left">
            {/* Step-by-Step Completed Workflow Card */}
            <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-4 sm:p-5">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Completed Automated Processes
              </h3>

              <div className="space-y-4">
                {/* Step 1: Payment */}
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">1. Payment Processed & Verified</span>
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-bold rounded">
                        PAID
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      {booking?.amount ? `\$${booking.amount}` : 'Consultation fee'} authorized and securely captured via Stripe.
                    </p>
                  </div>
                </div>

                {/* Step 2: Google Calendar & Meet */}
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">2. Google Calendar Meeting Scheduled</span>
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-bold rounded">
                        CONFIRMED
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      1-on-1 video consultation room generated and synced to both calendars.
                    </p>
                    {booking?.meetingLink && (
                      <div className="mt-2">
                        <a
                          href={booking.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Google Meet Room <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Confirmation Email */}
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">3. Confirmation Email Dispatched</span>
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-bold rounded">
                        SENT
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Detailed invitation with agenda and calendar link dispatched to{' '}
                      <strong className="text-neutral-900">{booking?.email || 'your registered email'}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Details Card */}
            <div className="bg-neutral-50 rounded-xl p-5 text-xs text-neutral-700 border border-neutral-200 space-y-3">
              <h4 className="font-bold text-neutral-900 text-xs mb-2">Session Overview</h4>

              <div className="flex justify-between border-b border-neutral-200 pb-2">
                <span className="font-semibold text-neutral-500">Booking Reference:</span>
                <span className="font-mono text-neutral-900 font-semibold">{bookingId}</span>
              </div>

              {booking && (
                <>
                  <div className="flex justify-between border-b border-neutral-200 pb-2">
                    <span className="font-semibold text-neutral-500">Consultant:</span>
                    <span className="font-semibold text-neutral-900 flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-400" />
                      {booking.consultantId?.name || 'Career Specialist'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-neutral-200 pb-2">
                    <span className="font-semibold text-neutral-500">Date & Time:</span>
                    <span className="font-semibold text-neutral-900 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-400" />
                      {booking.date} at {booking.timeSlot}
                    </span>
                  </div>

                  {booking.meetingAgenda && (
                    <div className="border-b border-neutral-200 pb-2">
                      <span className="block font-semibold text-neutral-500 mb-0.5">Meeting Agenda:</span>
                      <p className="text-neutral-800 bg-white p-2.5 rounded border border-neutral-200 italic text-[11px]">
                        &quot;{booking.meetingAgenda}&quot;
                      </p>
                    </div>
                  )}

                  {booking.meetingLink && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-semibold text-neutral-500">Meeting Room:</span>
                      <a
                        href={booking.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                      >
                        <Video className="w-3.5 h-3.5" /> Open Google Meet
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/consultations"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" /> View Consultations Schedule <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/resumes"
            className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs px-4 py-2.5 rounded-xl transition"
          >
            Resume Builder
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-2"
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
      <Suspense fallback={<div className="text-center py-12 text-xs text-neutral-500">Loading confirmation...</div>}>
        <SuccessContent />
      </Suspense>
    </AppShell>
  );
}
