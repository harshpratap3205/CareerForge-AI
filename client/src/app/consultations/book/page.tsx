'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { Calendar, Clock, DollarSign, Check, AlertCircle, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }

    const fetchConsultants = async () => {
      try {
        const res = await api.get('/bookings/consultants');
        const list = res.data.data.consultants;
        setConsultants(list);
        if (list.length > 0) {
          setSelectedConsultantId(list[0]._id);
        }
      } catch (err) {
        console.error('Error fetching consultants:', err);
      }
    };

    fetchConsultants();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
  }, [user]);

  const selectedConsultant = consultants.find((c) => c._id === selectedConsultantId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeSlot) {
      setError('Please select an available time slot');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const bookingRes = await api.post('/bookings', {
        consultantId: selectedConsultantId,
        date,
        timeSlot,
        name,
        email,
        phone,
        meetingAgenda,
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
      console.error('Booking Error:', err);
      setError(err.response?.data?.message || 'Failed to initialize booking');
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Consultations
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs">
          <h1 className="text-xl font-bold text-gray-900">Book a Career Consultation</h1>
          <p className="text-xs text-gray-500 mt-1">
            Choose an expert mentor, select your preferred time slot, and confirm via Stripe.
          </p>

          {error && (
            <div className="p-3 my-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">1. Select Consultant</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {consultants.map((c) => {
                  const isSelected = c._id === selectedConsultantId;
                  return (
                    <div
                      key={c._id}
                      onClick={() => {
                        setSelectedConsultantId(c._id);
                        setTimeSlot('');
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-sm text-gray-900">{c.name}</h3>
                          <p className="text-xs text-indigo-600 font-medium">{c.specialty}</p>
                        </div>
                        <span className="text-xs font-extrabold text-gray-900">${c.hourlyRate}/hr</span>
                      </div>
                      {c.bio && <p className="text-2xs text-gray-500 mt-2 line-clamp-2">{c.bio}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">2. Select Date</label>
                <input
                  type="date"
                  min={todayStr}
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">3. Select Slot</label>
                <div className="grid grid-cols-2 gap-2">
                  {(selectedConsultant?.slots || ['10:00', '14:00']).map((slot) => {
                    const isSelected = timeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeSlot(slot)}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-5">
              <label className="block text-xs font-semibold text-gray-700 uppercase">4. Candidate Information</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <input
                  type="tel"
                  required
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <textarea
                  rows={2}
                  required
                  placeholder="Meeting Agenda & Goals..."
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Consultation Fee</div>
                <div className="text-xl font-extrabold text-gray-900">${selectedConsultant?.hourlyRate || 50}.00</div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-xs disabled:opacity-50"
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
