'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccessMessage(
        res.data?.message ||
          'If an account exists with that email address, a password reset link has been dispatched to your email inbox.'
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to process password reset request. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition font-medium mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">Forgot Password</h1>
            <p className="text-xs text-neutral-500">
              Enter your email and we will send a password reset link to your inbox
            </p>
          </div>
        </div>

        {error && (
          <div className="my-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="my-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-900">Reset Email Dispatched</p>
                <p className="mt-1 text-emerald-800 leading-relaxed">
                  {successMessage} Please check your email inbox (and spam/junk folder) for the reset link.
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="block w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition text-center"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Your Registered Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 pl-9 border border-neutral-300 rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-indigo-600 transition"
                />
                <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition duration-150 flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Email...</span>
                </>
              ) : (
                'Send Password Reset Email'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
