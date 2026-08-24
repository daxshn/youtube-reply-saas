'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { RefreshCw, ShieldCheck, LogIn, LogOut, Menu, Bell } from 'lucide-react';
import { YoutubeIcon } from './ui/youtube-icon';
import NotificationsDrawer from './notifications-drawer';
import { useToast } from './providers';

interface NavbarProps {
  onFetchComments?: () => void;
  isFetching?: boolean;
  onToggleMobileSidebar?: () => void;
}

export default function Navbar({ onFetchComments, isFetching = false, onToggleMobileSidebar }: NavbarProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleFetchClick = () => {
    if (onFetchComments) {
      onFetchComments();
    } else {
      showToast('Fetching latest YouTube comments...', 'info');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden text-slate-300 hover:text-white p-2 rounded-lg bg-slate-900 border border-slate-800"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-rose-600 to-purple-600 p-0.5 shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <YoutubeIcon className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  ReplyStudio
                </span>
                <span className="bg-red-500/10 text-red-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-red-500/20">
                  AI SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">YouTube Comment Approval Assistant</p>
            </div>
          </Link>
        </div>

        {/* Safety Badge & Sync Button */}
        <div className="flex items-center gap-3">
          {/* Manual Approval Guarantee Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Manual Approval</span>
          </div>

          {/* Bell Notifications Button */}
          <button
            onClick={() => setNotifOpen(true)}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors relative"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </button>

          {/* Sync Button */}
          <button
            onClick={handleFetchClick}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200 disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isFetching ? 'Fetching...' : 'Fetch Comments'}</span>
            <span className="sm:hidden">Fetch</span>
          </button>

          {/* Auth Button */}
          {session?.user ? (
            <div className="flex items-center gap-2">
              <img
                src={session.user.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                alt={session.user.name || 'User'}
                className="w-9 h-9 rounded-full border-2 border-indigo-500/40 object-cover"
              />
              <button
                onClick={() => signOut()}
                className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition-all"
            >
              <LogIn className="w-4 h-4 text-slate-400" />
              <span>Connect Channel</span>
            </button>
          )}
        </div>
      </div>

      <NotificationsDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  );
}
