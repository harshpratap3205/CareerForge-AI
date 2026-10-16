'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, tokens } = res.data.data;
      login({ accessToken: tokens.accessToken }, user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
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

        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Sign in to your account</h1>
        <p className="text-xs text-neutral-500 mb-5">Enter your email and password below</p>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-9 border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded text-xs transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-neutral-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-neutral-900 underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
