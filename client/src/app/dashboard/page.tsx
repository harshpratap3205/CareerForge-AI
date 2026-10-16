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
} from 'lucide-react';

interface DashboardStats {
  totalResumes: number;
  totalChats: number;
  upcomingConsultations: number;
  completedConsultations: number;
  pendingPaymentConsultations: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingBooking, setUpcomingBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [dashRes, bookingsRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/bookings', { params: { limit: 1, status: 'CONFIRMED' } }).catch(() => null),
        ]);
        setStats(dashRes.data.data);
        if (bookingsRes && bookingsRes.data?.data?.items?.length > 0) {
          setUpcomingBooking(bookingsRes.data.data.items[0]);
        }
      } catch {
        // Fallback silently if network drops
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
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
          <div className="py-2">
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
                  <span>Date: <strong>{upcomingBooking.date}</strong> at <strong>{upcomingBooking.timeSlot}</strong></span>
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-neutral-900 text-neutral-900 text-xs font-medium transition"
                  >
                    <Video className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Join Google Meet</span>
                  </a>
                )}
                <Link
                  href="/consultations"
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
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
                <div
                  key={i}
                  className="h-28 bg-white border border-neutral-200 rounded-xl animate-pulse"
                />
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
