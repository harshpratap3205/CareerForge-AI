'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams?.get('registered') === 'true';

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
      const res = await api.post('/auth/login', { email: email.trim(), password });
      const { user, tokens } = res.data.data;
      login({ accessToken: tokens.accessToken }, user);
      router.push('/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? 'Invalid email or password. Please check your credentials.'
          : 'Unable to sign in. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm w-full bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/" className="font-bold text-lg tracking-tight text-neutral-900">
          CareerForge <span className="text-indigo-600 font-bold">AI</span>
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Sign in to your account</h1>
      <p className="text-xs text-neutral-500 mb-5">Enter your email and password below to continue</p>

      {justRegistered && !error && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Account created successfully! Please sign in with your email and password.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">Email address</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none transition ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
                : 'border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10'
            }`}
            placeholder="name@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-neutral-700">Password</label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 pr-9 border rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none transition ${
                error
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
                  : 'border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10'
              }`}
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
          className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg text-xs transition duration-150 flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
        <p className="text-xs text-neutral-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-neutral-900 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50/80 px-4">
      <Suspense fallback={<div className="text-xs text-neutral-500">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
