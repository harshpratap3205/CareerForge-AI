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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Overview for {user?.name || 'Engineer'}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white border border-neutral-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-neutral-200 p-4 rounded">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[11px] font-medium uppercase tracking-wider">Total Resumes</span>
                <FileText className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-2xl font-semibold text-neutral-900 mt-2">{stats?.totalResumes ?? 0}</div>
              <span className="text-[11px] text-neutral-400 mt-0.5 block">Configured versions</span>
            </div>

            <div className="bg-white border border-neutral-200 p-4 rounded">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[11px] font-medium uppercase tracking-wider">Advisory Chats</span>
                <MessageSquare className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-2xl font-semibold text-neutral-900 mt-2">{stats?.totalChats ?? 0}</div>
              <span className="text-[11px] text-neutral-400 mt-0.5 block">Active threads</span>
            </div>

            <div className="bg-white border border-neutral-200 p-4 rounded">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[11px] font-medium uppercase tracking-wider">Upcoming Sessions</span>
                <CalendarCheck className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-2xl font-semibold text-neutral-900 mt-2">{stats?.upcomingConsultations ?? 0}</div>
              <span className="text-[11px] text-neutral-500 mt-0.5 block">Confirmed bookings</span>
            </div>

            <div className="bg-white border border-neutral-200 p-4 rounded">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[11px] font-medium uppercase tracking-wider">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-2xl font-semibold text-neutral-900 mt-2">{stats?.completedConsultations ?? 0}</div>
              <span className="text-[11px] text-neutral-400 mt-0.5 block">Past consultations</span>
            </div>
          </div>
        )}

        <div className="bg-white border border-neutral-200 rounded p-5">
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">Quick Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/resumes/create"
              className="flex items-center justify-between p-3.5 rounded border border-neutral-200 hover:border-neutral-300 bg-neutral-50/50"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-neutral-700" />
                <div>
                  <h3 className="font-medium text-xs text-neutral-900">New Resume</h3>
                  <p className="text-[11px] text-neutral-500">Structured ATS template</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
            </Link>

            <Link
              href="/chat"
              className="flex items-center justify-between p-3.5 rounded border border-neutral-200 hover:border-neutral-300 bg-neutral-50/50"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-neutral-700" />
                <div>
                  <h3 className="font-medium text-xs text-neutral-900">Advisory Chat</h3>
                  <p className="text-[11px] text-neutral-500">Career & interview coaching</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
            </Link>

            <Link
              href="/consultations/book"
              className="flex items-center justify-between p-3.5 rounded border border-neutral-200 hover:border-neutral-300 bg-neutral-50/50"
            >
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-4 h-4 text-neutral-700" />
                <div>
                  <h3 className="font-medium text-xs text-neutral-900">Book Session</h3>
                  <p className="text-[11px] text-neutral-500">Schedule with a consultant</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
