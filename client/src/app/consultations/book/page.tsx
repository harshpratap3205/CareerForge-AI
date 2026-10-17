'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Consultant {
  _id: string;
  name: string;
  specialty: string;
  hourlyRate: number;
  bio?: string;
  slots: string[];
}

export default function BookConsultationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+1 555-0123');
  const [meetingAgenda, setMeetingAgenda] = useState('Staff Engineer system design and resume positioning review');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalidField, setInvalidField] = useState<string | null>(null);

  const consultantRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const agendaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }

    const fetchConsultants = async () => {
      try {
        const res = await api.get('/bookings/consultants');
        const rawList: Consultant[] = res.data.data.consultants || [];
        const list = rawList.filter(
          (c: any) => !c.name?.toLowerCase().includes('alex') && !c.email?.endsWith('.test')
        );
        setConsultants(list);
        if (list.length > 0) {
          setSelectedConsultantId(list[0]._id);
        }
      } catch {
        // Fallback silently if offline
      }
    };

    fetchConsultants();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
  }, [user]);

  const selectedConsultant = consultants.find((c) => c._id === selectedConsultantId);

  const scrollToField = (ref: React.RefObject<HTMLElement | null>, fieldName: string, errorMessage: string) => {
    setError(errorMessage);
    setInvalidField(fieldName);
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in ref.current && typeof (ref.current as any).focus === 'function') {
        (ref.current as any).focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedConsultantId) {
      scrollToField(consultantRef, 'consultant', 'Please select a career consultant to continue');
      return;
    }

    if (!date) {
      scrollToField(dateRef, 'date', 'Please choose a date for the consultation session');
      return;
    }

    if (!timeSlot) {
      scrollToField(slotRef, 'slot', 'Please select an available time slot for your session');
      return;
    }

    if (!name.trim()) {
      scrollToField(nameRef, 'name', 'Please provide your full candidate name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      scrollToField(emailRef, 'email', 'Please provide a valid email address for confirmation');
      return;
    }

    if (!phone.trim()) {
      scrollToField(phoneRef, 'phone', 'Please provide a contact phone number');
      return;
    }

    if (!meetingAgenda.trim()) {
      scrollToField(agendaRef, 'agenda', 'Please describe your meeting goals or agenda');
      return;
    }

    setError('');
    setInvalidField(null);
    setLoading(true);

    try {
      const bookingRes = await api.post('/bookings', {
        consultantId: selectedConsultantId,
        date,
        timeSlot,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        meetingAgenda: meetingAgenda.trim(),
      });

      const booking = bookingRes.data.data.booking;

      const checkoutRes = await api.post('/payments/create-checkout-session', {
        bookingId: booking._id,
      });

      const { url } = checkoutRes.data.data;
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize booking session');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/consultations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Consultations
        </Link>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Book a Career Consultation</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Choose an expert mentor, select your preferred time slot, and confirm via Stripe.
          </p>

          {error && (
            <div className="p-3 my-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mt-6" noValidate>
            <div ref={consultantRef} id="field-consultant">
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-2">
                1. Select Consultant
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {consultants.map((c) => {
                  const isSelected = c._id === selectedConsultantId;
                  return (
                    <div
                      key={c._id}
                      onClick={() => {
                        setSelectedConsultantId(c._id);
                        setTimeSlot('');
                        if (invalidField === 'consultant') setInvalidField(null);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                          : invalidField === 'consultant'
                          ? 'border-rose-400 bg-rose-50/30'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-sm text-neutral-900">{c.name}</h3>
                          <p className="text-xs text-indigo-600 font-medium">{c.specialty}</p>
                        </div>
                        <span className="text-xs font-bold text-neutral-900">${c.hourlyRate}/hr</span>
                      </div>
                      {c.bio && <p className="text-[11px] text-neutral-500 mt-2 line-clamp-2">{c.bio}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  2. Select Date
                </label>
                <input
                  ref={dateRef}
                  id="field-date"
                  type="date"
                  min={todayStr}
                  required
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (invalidField === 'date') setInvalidField(null);
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-xs text-neutral-900 focus:outline-none transition ${
                    invalidField === 'date'
                      ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400'
                      : 'border-neutral-300 focus:border-neutral-900'
                  }`}
                />
              </div>

              <div ref={slotRef} id="field-slot">
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                  3. Select Slot
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(selectedConsultant?.slots || ['10:00', '14:00']).map((slot) => {
                    const isSelected = timeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setTimeSlot(slot);
                          if (invalidField === 'slot') setInvalidField(null);
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                            : invalidField === 'slot'
                            ? 'border-rose-400 bg-rose-50/30 text-rose-700'
                            : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-neutral-100 pt-5">
              <label className="block text-xs font-semibold text-neutral-700 uppercase">
                4. Candidate Information
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    ref={nameRef}
                    id="field-name"
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (invalidField === 'name') setInvalidField(null);
                    }}
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-xs text-neutral-900 focus:outline-none transition ${
                      invalidField === 'name'
                        ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400'
                        : 'border-neutral-300 focus:border-neutral-900'
                    }`}
                  />
                </div>
                <div>
                  <input
                    ref={emailRef}
                    id="field-email"
                    type="email"
                    required
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (invalidField === 'email') setInvalidField(null);
                    }}
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-xs text-neutral-900 focus:outline-none transition ${
                      invalidField === 'email'
                        ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400'
                        : 'border-neutral-300 focus:border-neutral-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <input
                  ref={phoneRef}
                  id="field-phone"
                  type="tel"
                  required
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (invalidField === 'phone') setInvalidField(null);
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-xs text-neutral-900 focus:outline-none transition ${
                    invalidField === 'phone'
                      ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400'
                      : 'border-neutral-300 focus:border-neutral-900'
                  }`}
                />
              </div>

              <div>
                <textarea
                  ref={agendaRef}
                  id="field-agenda"
                  rows={2}
                  required
                  placeholder="Meeting Agenda & Goals..."
                  value={meetingAgenda}
                  onChange={(e) => {
                    setMeetingAgenda(e.target.value);
                    if (invalidField === 'agenda') setInvalidField(null);
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-xs text-neutral-900 focus:outline-none transition ${
                    invalidField === 'agenda'
                      ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400'
                      : 'border-neutral-300 focus:border-neutral-900'
                  }`}
                />
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-neutral-500 font-medium">Consultation Fee</div>
                <div className="text-xl font-bold text-neutral-900">${selectedConsultant?.hourlyRate || 50}.00</div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Processing...' : 'Proceed to Stripe Checkout'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
