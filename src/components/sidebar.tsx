'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, BarChart3, History, Settings, ShieldCheck, X } from 'lucide-react';
import { YoutubeIcon } from './ui/youtube-icon';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  pendingCount?: number;
}

export default function Sidebar({ isOpenMobile = false, onCloseMobile, pendingCount = 4 }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Pending Queue',
      href: '/dashboard',
      icon: MessageSquare,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
    },
    {
      name: 'Reply History',
      href: '/dashboard/history',
      icon: History,
    },
    {
      name: 'AI & Prompt Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between p-4 space-y-6">
      <div className="space-y-6">
        {/* Mobile Header Close Button */}
        <div className="flex items-center justify-between lg:hidden border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <YoutubeIcon className="w-5 h-5 text-red-500" />
            <span className="font-bold text-white text-base">ReplyStudio</span>
          </div>
          <button onClick={onCloseMobile} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Card Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold shrink-0">
              YT
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">Tech Studio Channel</h4>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> OAuth Active
              </p>
            </div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2.5 text-[11px] text-slate-400 flex items-center justify-between border border-slate-800/50">
            <span>Auto Sync Interval</span>
            <span className="text-indigo-300 font-mono font-medium">Every 5 mins</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <p className="px-3 text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2">Main Navigation</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-400')} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Safety Guarantee Footer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Strict Security Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Zero auto-posting. All replies require explicit phone/desktop approval before being published to YouTube.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-slate-950/60 border-r border-slate-800/80 min-h-[calc(100vh-65px)]">
        {content}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="fixed top-0 left-0 bottom-0 w-72 bg-slate-950 border-r border-slate-800 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
