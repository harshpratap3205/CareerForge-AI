'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import {
  ShieldCheck,
  Search,
  UserCheck,
  Briefcase,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'USER' | 'CONSULTANT' | 'ADMIN';
  isVerified?: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!authLoading && currentUser) {
      if (currentUser.role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        fetchUsers();
      }
    }
  }, [currentUser, authLoading, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data.users || []);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || 'Failed to fetch user directory.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'CONSULTANT' | 'ADMIN') => {
    if (userId === currentUser?._id && newRole !== 'ADMIN') {
      if (!confirm('Warning: Demoting your own admin account will revoke your admin permissions. Continue?')) {
        return;
      }
    }

    setUpdatingId(userId);
    setMessage(null);

    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      setMessage({
        text: `Role successfully updated to ${newRole}.`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || 'Failed to update user role.',
        type: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const getRoleBadge = (role: UserRecord['role']) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" /> Platform Admin
          </span>
        );
      case 'CONSULTANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Briefcase className="w-3 h-3 text-amber-600" /> Career Consultant
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <UserCheck className="w-3 h-3 text-neutral-500" /> Candidate
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* Header */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">Platform User Administration</h1>
              <p className="text-xs text-neutral-500">
                Manage candidate accounts, promote career consultants, and oversee system privileges
              </p>
            </div>
          </div>

          <div className="text-xs text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200/80 font-medium">
            Total Accounts: <strong className="text-neutral-900">{users.length}</strong>
          </div>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter accounts by name or email..."
            className="w-full text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none"
          />
        </div>

        {/* User Directory Table */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <p className="text-xs">Loading user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <p className="text-sm">No accounts found matching your query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Contact Details</th>
                    <th className="px-6 py-3.5">Current Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Role Authorization Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-neutral-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-neutral-900">{u.name}</div>
                        <div className="text-[11px] text-neutral-400">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-700">
                        <div>{u.email}</div>
                        {u.phone && <div className="text-[11px] text-neutral-400">{u.phone}</div>}
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                      <td className="px-6 py-4">
                        {u.isVerified ? (
                          <span className="text-emerald-700 font-medium">Verified</span>
                        ) : (
                          <span className="text-neutral-400">Standard</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {updatingId === u._id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) =>
                                handleRoleChange(u._id, e.target.value as any)
                              }
                              className="px-2.5 py-1 border border-neutral-300 rounded-lg text-xs bg-white text-neutral-800 font-medium focus:outline-none focus:border-purple-600 cursor-pointer"
                            >
                              <option value="USER">USER (Candidate)</option>
                              <option value="CONSULTANT">CONSULTANT (Expert)</option>
                              <option value="ADMIN">ADMIN (Platform)</option>
                            </select>
                          )}
                        </div>
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
