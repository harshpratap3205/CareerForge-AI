'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  CalendarCheck,
  X,
  PlusCircle,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Advisory Chat', href: '/chat', icon: MessageSquare },
    { label: 'Resume Builder', href: '/resumes', icon: FileText },
    {
      label: user?.role === 'CONSULTANT' ? 'My Consultations' : 'Consultations',
      href: '/consultations',
      icon: CalendarCheck,
    },
    ...(user?.role === 'ADMIN'
      ? [{ label: 'User Management', href: '/admin/users', icon: ShieldCheck }]
      : []),
  ];

  const handleMobileNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Navigation
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1 text-neutral-400 hover:text-neutral-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleMobileNavClick}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )}
                >
                  <Icon
                    className={clsx(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-white' : 'text-neutral-500'
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Quick Shortcuts
            </span>
          </div>
          <div className="space-y-1">
            <Link
              href="/resumes/create"
              onClick={handleMobileNavClick}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition"
            >
              <span className="flex items-center gap-2">
                <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Create Resume</span>
              </span>
            </Link>
            {user?.role === 'CONSULTANT' ? (
              <Link
                href="/consultations"
                onClick={handleMobileNavClick}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>My Consultations</span>
                </span>
              </Link>
            ) : (
              <Link
                href="/consultations/book"
                onClick={handleMobileNavClick}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition"
              >
                <span className="flex items-center gap-2">
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Book Consultant</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-4">
        <div className="bg-neutral-50 border border-neutral-200/60 rounded-lg p-3 text-[11px] text-neutral-600">
          <p className="font-semibold text-neutral-800">CareerForge AI</p>
          <p className="text-neutral-400 text-[10px] mt-0.5">Platform Edition</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-2xs z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 md:hidden transform transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </aside>

      <aside
        className={clsx(
          'hidden md:flex flex-col bg-white border-r border-neutral-200 shrink-0 transition-all duration-200 min-h-[calc(100vh-3.5rem)] sticky top-14',
          isOpen ? 'w-60' : 'w-0 overflow-hidden border-r-0'
        )}
      >
        {navContent}
      </aside>
    </>
  );
};
