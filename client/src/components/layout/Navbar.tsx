'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-neutral-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-neutral-900 rounded flex items-center justify-center text-white text-xs font-bold tracking-tight">
          CF
        </div>
        <span className="font-semibold text-sm tracking-tight text-neutral-900">
          CareerForge
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-neutral-700 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded">
              <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span className="font-medium text-neutral-800">{user.name}</span>
              <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">{user.role}</span>
            </div>
            <button
              onClick={() => logout()}
              className="text-neutral-500 hover:text-neutral-900 p-1.5 rounded transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs font-medium text-neutral-600 hover:text-neutral-900">
              Sign in
            </Link>
            <Link href="/register" className="text-xs font-medium bg-neutral-900 text-white px-3 py-1.5 rounded hover:bg-neutral-800 transition">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
