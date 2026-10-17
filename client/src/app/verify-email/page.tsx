'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { CheckCircle2, AlertCircle, Loader2, MailCheck, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function performVerification() {
      if (!token) {
        setLoading(false);
        setMessage('No verification token provided in URL.');
        return;
      }

      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        setSuccess(true);
        setMessage(res.data?.message || 'Email verified successfully! Your account is active.');
      } catch (err: any) {
        setSuccess(false);
        setMessage(
          err.response?.data?.message || 'Email verification link is invalid or has expired.'
        );
      } finally {
        setLoading(false);
      }
    }

    performVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
          <MailCheck className="w-6 h-6" />
        </div>

        <h1 className="text-lg font-bold text-neutral-900 mb-1">Email Verification</h1>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs text-neutral-500">Verifying your email token with server...</p>
          </div>
        ) : success ? (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5 text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Email Confirmed!</p>
                <p className="mt-0.5">{message}</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 text-left">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Verification Failed</p>
                <p className="mt-0.5">{message}</p>
              </div>
            </div>

            <Link
              href="/login"
              className="block w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg text-xs transition text-center"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
