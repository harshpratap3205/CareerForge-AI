'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'CONSULTANT'>('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { user, tokens } = res.data.data;
      login(tokens, user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-sm w-full bg-white p-7 rounded-lg border border-neutral-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 bg-neutral-900 rounded flex items-center justify-center text-white text-[10px] font-bold">
            CF
          </div>
          <span className="font-semibold text-sm text-neutral-900">CareerForge</span>
        </div>

        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Create an account</h1>
        <p className="text-xs text-neutral-500 mb-5">Fill in your information to get started</p>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
              placeholder="Alex Johnson"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-neutral-300 rounded text-xs text-neutral-900 bg-white focus:outline-none focus:border-neutral-900"
            >
              <option value="USER">Candidate / Job Seeker</option>
              <option value="CONSULTANT">Career Consultant</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded text-xs transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-neutral-600">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-neutral-900 underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
