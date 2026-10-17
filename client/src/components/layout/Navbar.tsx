'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  ChevronDown,
  LayoutDashboard,
  MessageSquare,
  FileText,
  CalendarCheck,
  PanelLeft,
  UserCog,
} from 'lucide-react';
import { EditProfileModal } from '../profile/EditProfileModal';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-14 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition focus:outline-none"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-bold text-base sm:text-lg tracking-tight text-neutral-900">
            CareerForge <span className="text-indigo-600 font-bold">AI</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {user ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-semibold tracking-wide">
                {getInitials(user.name)}
              </div>
              <div className="hidden sm:flex flex-col text-left mr-1">
                <span className="text-xs font-semibold text-neutral-800 leading-tight max-w-[120px] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">
                  {user.role === 'ADMIN'
                    ? 'Platform Admin'
                    : user.role === 'CONSULTANT'
                    ? 'Career Consultant'
                    : 'Candidate'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-neutral-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setIsEditProfileOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition text-left cursor-pointer"
                  >
                    <UserCog className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Edit Profile</span>
                  </button>
                  <Link
                    href="/dashboard"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/chat"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Advisory Chat</span>
                  </Link>
                  <Link
                    href="/resumes"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Resumes</span>
                  </Link>
                  <Link
                    href="/consultations"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Consultations</span>
                  </Link>
                </div>

                <div className="border-t border-neutral-100 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded transition"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold bg-neutral-900 text-white px-3.5 py-1.5 rounded-lg hover:bg-neutral-800 transition shadow-xs"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </header>
  );
};
