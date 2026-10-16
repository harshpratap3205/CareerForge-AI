'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, FileText, CalendarCheck } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Advisory Chat', href: '/chat', icon: MessageSquare },
  { label: 'Resume Builder', href: '/resumes', icon: FileText },
  { label: 'Consultations', href: '/consultations', icon: CalendarCheck },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col justify-between p-3 min-h-[calc(100vh-3.5rem)] shrink-0">
      <div className="space-y-0.5">
        <div className="px-2.5 py-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium',
                isActive
                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              )}
            >
              <Icon className={clsx('w-4 h-4', isActive ? 'text-neutral-900' : 'text-neutral-500')} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-neutral-200 pt-3 text-[11px] text-neutral-400 px-2.5">
        CareerForge v1.0
      </div>
    </aside>
  );
};
