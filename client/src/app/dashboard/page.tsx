'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  MessageSquare,
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
  Plus,
  Sparkles,
  Video,
  Clock,
  ArrowUpRight,
  Shield,
  Briefcase,
  User,
  Users,
  DollarSign,
  Save,
  Check,
  AlertCircle,
  ExternalLink,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Consultant-specific state
  const [consultantBookings, setConsultantBookings] = useState<any[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number>(75);
  const [specialty, setSpecialty] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [savingConsultant, setSavingConsultant] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Admin-specific state
  const [adminTab, setAdminTab] = useState<'bookings' | 'users' | 'consultants'>('bookings');
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allConsultants, setAllConsultants] = useState<any[]>([]);
  const [adminDataLoading, setAdminDataLoading] = useState(false);

  // Candidate-specific state
  const [upcomingBooking, setUpcomingBooking] = useState<any>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const dashRes = await api.get('/dashboard');
        const data = dashRes.data.data;
        setStats(data);

        if (user?.role === 'CONSULTANT') {
          // Load consultant bookings and profile
          const [bookingsRes, profileRes] = await Promise.all([
            api.get('/bookings', { params: { limit: 20 } }).catch(() => null),
            api.get('/bookings/consultant-profile').catch(() => null),
          ]);

          if (bookingsRes?.data?.data?.items) {
            setConsultantBookings(bookingsRes.data.data.items);
          }

          if (profileRes?.data?.data?.consultant) {
            const c = profileRes.data.data.consultant;
            setHourlyRate(c.hourlyRate || 75);
            setSpecialty(c.specialty || '');
            setBio(c.bio || '');
          }
        } else if (user?.role === 'ADMIN') {
          // Load platform-wide admin data
          setAdminDataLoading(true);
          const [bookingsRes, usersRes, consultantsRes] = await Promise.all([
            api.get('/bookings', { params: { limit: 50 } }).catch(() => null),
            api.get('/users').catch(() => null),
            api.get('/bookings/consultants').catch(() => null),
          ]);

          if (bookingsRes?.data?.data?.items) setAllBookings(bookingsRes.data.data.items);
          if (usersRes?.data?.data?.users) setAllUsers(usersRes.data.data.users);
          if (consultantsRes?.data?.data?.consultants) setAllConsultants(consultantsRes.data.data.consultants);
          setAdminDataLoading(false);
        } else {
          // Candidate flow: Load upcoming booking
          const bookingsRes = await api
            .get('/bookings', { params: { limit: 1, status: 'CONFIRMED' } })
            .catch(() => null);
          const firstItem = bookingsRes?.data?.data?.items?.[0];
          if (firstItem) {
            setUpcomingBooking(firstItem);
          }
        }
      } catch {
        // Fallback silently if network drops
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleSaveConsultantProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConsultant(true);
    setSaveSuccess(false);

    try {
      await api.put('/bookings/consultant-profile', {
        hourlyRate: Number(hourlyRate),
        specialty: specialty.trim(),
        bio: bio.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update consultant profile:', err);
    } finally {
      setSavingConsultant(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setAllUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  // -------------------------------------------------------------
  // 1. CONSULTANT DASHBOARD
  // -------------------------------------------------------------
  if (user?.role === 'CONSULTANT') {
    return (
      <AppShell>
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                  Consultant Workspace
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Briefcase className="w-3 h-3" /> Career Mentor
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Manage your hourly consultation fee, review upcoming candidate appointments, and join video sessions.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-neutral-500">
                Logged in as <strong className="text-neutral-900">{user.email}</strong>
              </span>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Upcoming Sessions
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-neutral-900">
                  {stats?.upcomingConsultations ?? 0}
                </div>
                <span className="text-[11px] text-neutral-500 mt-1 block">Scheduled 1-on-1s</span>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Completed
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-neutral-900">
                  {stats?.completedConsultations ?? 0}
                </div>
                <span className="text-[11px] text-neutral-500 mt-1 block">Past consultations</span>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Hourly Rate
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-neutral-900">
                  ${hourlyRate}/hr
                </div>
                <span className="text-[11px] text-neutral-500 mt-1 block">Current fee per session</span>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Total Earnings
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-neutral-900">
                  ${stats?.totalEarnings ?? 0}
                </div>
                <span className="text-[11px] text-neutral-500 mt-1 block">Gross booked revenue</span>
              </div>
            </div>
          </div>

          {/* Profile & Pay Rate Settings Card */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Mentor Profile & Pay Rate Settings</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Set your hourly rate and specialty so candidates can discover and book sessions with you.
                </p>
              </div>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5" /> Settings Saved!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveConsultantProfile} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Hourly Rate ($ USD per 60-min session)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Professional Specialty / Title
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Senior FAANG Tech Lead & Resume Reviewer"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Bio & Mentoring Experience
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your interview coaching background and how you guide candidates..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <button
                type="submit"
                disabled={savingConsultant}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-60 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {savingConsultant ? 'Saving Changes...' : 'Update My Rates & Profile'}
              </button>
            </form>
          </div>

          {/* Scheduled Sessions Table */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">My Mentorship Appointments</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  All consultations booked by candidates with your profile
                </p>
              </div>
              <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-lg">
                {consultantBookings.length} Total Bookings
              </span>
            </div>

            {consultantBookings.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-neutral-800">No candidate bookings yet</h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  Your profile is active in the directory. When candidates book a session with you, their appointments and Google Meet links will appear right here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Candidate</th>
                      <th className="px-5 py-3">Date & Time</th>
                      <th className="px-5 py-3">Agenda</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Meeting Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {consultantBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-neutral-50/70 transition">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-neutral-900">{b.name}</div>
                          <div className="text-[11px] text-neutral-500">{b.email}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-neutral-900">{b.date}</div>
                          <div className="text-[11px] text-neutral-500">{b.timeSlot}</div>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs truncate text-neutral-600">
                          {b.meetingAgenda || 'Career coaching'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'CONFIRMED' || b.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {b.meetingLink ? (
                            <a
                              href={b.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                            >
                              <Video className="w-3.5 h-3.5" /> Join Meet
                            </a>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  // -------------------------------------------------------------
  // 2. ADMIN DASHBOARD
  // -------------------------------------------------------------
  if (user?.role === 'ADMIN') {
    return (
      <AppShell>
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
          {/* Admin Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                  Admin Platform Command Center
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <Shield className="w-3 h-3" /> System Admin
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Platform-wide oversight of users, consultants, Stripe revenue, and consultation bookings.
              </p>
            </div>
            <div className="text-xs text-neutral-500">
              Admin: <strong className="text-neutral-900">{user.email}</strong>
            </div>
          </div>

          {/* Admin Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Total Users</span>
              <div className="text-2xl font-bold text-neutral-900 mt-2">{stats?.totalUsers ?? allUsers.length}</div>
            </div>
            <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Active Mentors</span>
              <div className="text-2xl font-bold text-neutral-900 mt-2">{stats?.totalConsultants ?? allConsultants.length}</div>
            </div>
            <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Resumes Created</span>
              <div className="text-2xl font-bold text-neutral-900 mt-2">{stats?.totalResumes ?? 0}</div>
            </div>
            <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Total Bookings</span>
              <div className="text-2xl font-bold text-neutral-900 mt-2">{stats?.totalBookings ?? allBookings.length}</div>
            </div>
            <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Platform Revenue</span>
              <div className="text-2xl font-bold text-neutral-900 mt-2">${stats?.totalRevenue ?? 0}</div>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-neutral-200">
            <button
              onClick={() => setAdminTab('bookings')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                adminTab === 'bookings'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All System Bookings ({allBookings.length})
            </button>
            <button
              onClick={() => setAdminTab('users')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                adminTab === 'users'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Registered Users & Roles ({allUsers.length})
            </button>
            <button
              onClick={() => setAdminTab('consultants')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                adminTab === 'consultants'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Consultants Directory ({allConsultants.length})
            </button>
          </div>

          {/* Tab 1: All Bookings */}
          {adminTab === 'bookings' && (
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-neutral-200">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Global System Bookings
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Reference ID</th>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Consultant</th>
                      <th className="px-4 py-3">Date & Slot</th>
                      <th className="px-4 py-3">Fee</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Meet Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {allBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-neutral-50/70 transition">
                        <td className="px-4 py-3 font-mono text-[11px] text-neutral-600">{b._id.slice(-8)}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-neutral-900">{b.name}</div>
                          <div className="text-[10px] text-neutral-500">{b.email}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-neutral-900">
                          {b.consultantId?.name || 'Unassigned'}
                        </td>
                        <td className="px-4 py-3">
                          <div>{b.date}</div>
                          <div className="text-[10px] text-neutral-500">{b.timeSlot}</div>
                        </td>
                        <td className="px-4 py-3 font-bold text-neutral-900">${b.amount || 75}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'CONFIRMED' || b.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {b.meetingLink ? (
                            <a
                              href={b.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 font-bold hover:underline"
                            >
                              Join Meet
                            </a>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Users Management */}
          {adminTab === 'users' && (
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-neutral-200">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Platform Users & Role Assignments
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Current Role</th>
                      <th className="px-4 py-3">Manage Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {allUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-neutral-50/70 transition">
                        <td className="px-4 py-3 font-semibold text-neutral-900">{u.name}</td>
                        <td className="px-4 py-3 text-neutral-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-rose-100 text-rose-800'
                                : u.role === 'CONSULTANT'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                            className="px-2 py-1 border border-neutral-300 rounded text-xs bg-white text-neutral-800 focus:outline-none"
                          >
                            <option value="USER">USER (Candidate)</option>
                            <option value="CONSULTANT">CONSULTANT</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Consultants Directory */}
          {adminTab === 'consultants' && (
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-neutral-200">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Active Career Consultants
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Consultant</th>
                      <th className="px-4 py-3">Specialty</th>
                      <th className="px-4 py-3">Hourly Rate</th>
                      <th className="px-4 py-3">Available Slots</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {allConsultants.map((c) => (
                      <tr key={c._id} className="hover:bg-neutral-50/70 transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-neutral-900">{c.name}</div>
                          <div className="text-[10px] text-neutral-500">{c.email}</div>
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{c.specialty}</td>
                        <td className="px-4 py-3 font-bold text-neutral-900">${c.hourlyRate}/hr</td>
                        <td className="px-4 py-3 text-neutral-600 text-[11px]">
                          {c.slots?.join(', ') || '09:00, 11:00, 14:00, 16:00'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  // -------------------------------------------------------------
  // 3. CANDIDATE / USER DASHBOARD
  // -------------------------------------------------------------
  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Candidate
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Your career workspace, resume versions, and scheduled expert consultations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Chat</span>
            </Link>
            <Link
              href="/resumes/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Resume</span>
            </Link>
          </div>
        </div>

        {upcomingBooking && (
          <div className="py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Confirmed Consultation</span>
                </div>
                <h3 className="text-base font-bold text-neutral-900">
                  Session with {upcomingBooking.consultantId?.name || 'Career Expert'}
                </h3>
                <p className="text-xs text-neutral-600 flex flex-wrap items-center gap-2">
                  <span>
                    Date: <strong>{upcomingBooking.date}</strong> at <strong>{upcomingBooking.timeSlot}</strong>
                  </span>
                  {upcomingBooking.meetingAgenda && (
                    <span className="text-neutral-400">• {upcomingBooking.meetingAgenda}</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {upcomingBooking.meetingLink && (
                  <a
                    href={upcomingBooking.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Google Meet</span>
                  </a>
                )}
                <Link
                  href="/consultations"
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Platform Metrics
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-white border border-neutral-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/resumes"
                className="group bg-white border border-neutral-200 hover:border-neutral-300 p-5 rounded-xl shadow-2xs hover:shadow-xs transition duration-150 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Total Resumes
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-neutral-900 tracking-tight">
                    {stats?.totalResumes ?? 0}
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                    ATS & Modern versions <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </Link>

              <Link
                href="/chat"
                className="group bg-white border border-neutral-200 hover:border-neutral-300 p-5 rounded-xl shadow-2xs hover:shadow-xs transition duration-150 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Advisory Chats
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-100 transition">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-neutral-900 tracking-tight">
                    {stats?.totalChats ?? 0}
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                    Active LLM threads <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </Link>

              <Link
                href="/consultations"
                className="group bg-white border border-neutral-200 hover:border-neutral-300 p-5 rounded-xl shadow-2xs hover:shadow-xs transition duration-150 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Upcoming Sessions
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-neutral-900 tracking-tight">
                    {stats?.upcomingConsultations ?? 0}
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                    Confirmed appointments <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </Link>

              <Link
                href="/consultations"
                className="group bg-white border border-neutral-200 hover:border-neutral-300 p-5 rounded-xl shadow-2xs hover:shadow-xs transition duration-150 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Completed
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-neutral-900 tracking-tight">
                    {stats?.completedConsultations ?? 0}
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                    Past consultations <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Career Platform Modules</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Quick access to all evaluation services</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/resumes/create"
              className="group p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-neutral-50/40 hover:bg-neutral-50 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition" />
              </div>
              <h3 className="font-semibold text-xs text-neutral-900">AI Resume Generator</h3>
              <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                Build ATS-friendly resumes with multi-model generation, Tiptap editing, and instant PDF exports.
              </p>
            </Link>

            <Link
              href="/chat"
              className="group p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-neutral-50/40 hover:bg-neutral-50 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition" />
              </div>
              <h3 className="font-semibold text-xs text-neutral-900">Career Advisory Chat</h3>
              <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                Interactive real-time career coaching with Groq streaming, conversation memory, and session management.
              </p>
            </Link>

            <Link
              href="/consultations/book"
              className="group p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-neutral-50/40 hover:bg-neutral-50 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition" />
              </div>
              <h3 className="font-semibold text-xs text-neutral-900">Book Expert Session</h3>
              <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                Schedule consultations with Stripe payments, automated Google Calendar invites, and confirmation emails.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
