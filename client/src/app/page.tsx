import Link from 'next/link';
import { FileText, MessageSquare, CalendarCheck, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200 px-8 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-neutral-900 rounded flex items-center justify-center text-white text-xs font-bold tracking-tight">
            CF
          </div>
          <span className="font-semibold text-sm tracking-tight text-neutral-900">CareerForge</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-medium text-neutral-600 hover:text-neutral-900">
            Sign in
          </Link>
          <Link href="/register" className="text-xs font-medium bg-neutral-900 text-white px-3.5 py-2 rounded hover:bg-neutral-800">
            Get Started
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-950 leading-tight">
          Career Advisory and Resume Platform
        </h1>
        <p className="mt-4 text-base text-neutral-600 max-w-xl mx-auto leading-relaxed">
          Structured resume generation with dual ATS templates, contextual interview preparation, and verified mentor consultations.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/register" className="inline-flex items-center gap-2 bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded hover:bg-neutral-800">
            Create Account <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-neutral-800 text-xs font-semibold px-4 py-2.5 rounded border border-neutral-300 hover:bg-neutral-50">
            Dashboard
          </Link>
        </div>

        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left border-t border-neutral-200 pt-16">
          <div className="p-5 border border-neutral-200 rounded-lg bg-neutral-50/50">
            <div className="w-8 h-8 rounded bg-neutral-200 flex items-center justify-center text-neutral-800 mb-3">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm text-neutral-900 mb-1">Career Advisory</h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Multi-session advisory console with contextual conversation memory and streaming token generation.
            </p>
          </div>

          <div className="p-5 border border-neutral-200 rounded-lg bg-neutral-50/50">
            <div className="w-8 h-8 rounded bg-neutral-200 flex items-center justify-center text-neutral-800 mb-3">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm text-neutral-900 mb-1">Structured Resume Builder</h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Eight required sections, Tiptap rich-text editing, version history, and dual ATS Classic / Modern templates.
            </p>
          </div>

          <div className="p-5 border border-neutral-200 rounded-lg bg-neutral-50/50">
            <div className="w-8 h-8 rounded bg-neutral-200 flex items-center justify-center text-neutral-800 mb-3">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm text-neutral-900 mb-1">Expert Consultations</h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Stripe checkout with idempotent webhooks, Google Calendar invitations, and automated email confirmations.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
        CareerForge Platform — Modular Full-Stack Architecture
      </footer>
    </div>
  );
}
