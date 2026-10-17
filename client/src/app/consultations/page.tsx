'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  User,
  CreditCard,
} from 'lucide-react';

interface BookingItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  consultantId?: {
    name: string;
    specialty: string;
    avatarUrl?: string;
  };
  date: string;
  timeSlot: string;
  meetingAgenda: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'PAYMENT_FAILED';
  amount: number;
  meetingLink?: string;
}

export default function ConsultationsListPage() {
  const { user } = useAuth();
  const isConsultant = user?.role === 'CONSULTANT';

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/bookings', { params });
      setBookings(res.data.data.items || []);
      setTotalPages(res.data.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  const handleContinuePayment = async (bookingId: string) => {
    setPayingBookingId(bookingId);
    try {
      const checkoutRes = await api.post('/payments/create-checkout-session', {
        bookingId,
      });
      const { url } = checkoutRes.data.data;
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initialize payment session.');
    } finally {
      setPayingBookingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (err) {
      console.error('Error canceling booking:', err);
    }
  };

  const getStatusBadge = (status: BookingItem['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'PAID':
        return <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold">Paid</span>;
      case 'PENDING_PAYMENT':
        return (
          <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Payment
          </span>
        );
      case 'COMPLETED':
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-semibold">Completed</span>;
      case 'CANCELLED':
        return (
          <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {isConsultant ? 'My Mentoring Appointments' : 'Consultation Sessions'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isConsultant
                ? 'Review candidates booked with your mentor profile and join Google Meet sessions.'
                : 'Track 1-on-1 mentorship sessions, Google Meet links, and expert reviews.'}
            </p>
          </div>
          {!isConsultant ? (
            <Link
              href="/consultations/book"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Book Consultation
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
            >
              Consultant Settings
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or agenda..."
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 text-sm">
              {isConsultant ? 'No candidate appointments scheduled yet' : 'No consultations found'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              {isConsultant
                ? 'When candidates book 1-on-1 sessions with your profile, their appointments and agendas will appear here.'
                : 'Book a session with a FAANG mentor to refine your interview and resume strategy.'}
            </p>
            {!isConsultant && (
              <Link
                href="/consultations/book"
                className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> Book Now
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs text-gray-600 border-collapse">
                <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">{isConsultant ? 'Candidate' : 'Consultant'}</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Meeting Agenda</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isConsultant ? (
                          <>
                            <div className="font-semibold text-gray-900">{b.name}</div>
                            <div className="text-gray-400 text-2xs">{b.email}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-semibold text-gray-900">{b.consultantId?.name || 'Expert'}</div>
                            <div className="text-gray-400 text-2xs">{b.consultantId?.specialty}</div>
                          </>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" /> {b.date}
                        </div>
                        <div className="text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" /> {b.timeSlot}
                        </div>
                      </td>
                      <td className="py-4 px-4 max-w-xs truncate">{b.meetingAgenda}</td>
                      <td className="py-4 px-4 whitespace-nowrap">{getStatusBadge(b.status)}</td>
                      <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                        {b.meetingLink && (b.status === 'CONFIRMED' || b.status === 'PAID') && (
                          <a
                            href={b.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg font-semibold transition"
                          >
                            <Video className="w-3.5 h-3.5" /> Join Meet
                          </a>
                        )}
                        {b.status === 'PENDING_PAYMENT' && (
                          <button
                            type="button"
                            onClick={() => handleContinuePayment(b._id)}
                            disabled={payingBookingId === b._id}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-60"
                            title="Continue to Stripe Checkout"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {payingBookingId === b._id ? 'Opening Stripe...' : 'Pay Now'}
                          </button>
                        )}
                        {['PENDING_PAYMENT', 'CONFIRMED'].includes(b.status) && (
                          <button
                            onClick={() => handleCancel(b._id)}
                            className="text-gray-400 hover:text-red-600 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 border border-gray-200 rounded-md disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 border border-gray-200 rounded-md disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
