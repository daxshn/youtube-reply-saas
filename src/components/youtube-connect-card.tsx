'use client';

import React from 'react';
import { signIn } from 'next-auth/react';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { YoutubeIcon } from './ui/youtube-icon';

export default function YouTubeConnectCard() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-950/40 via-slate-900 to-indigo-950/40 border border-red-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-6">
      {/* Subtle background blur accent glow */}
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <YoutubeIcon className="w-4 h-4 text-red-500" />
            <span>Google & YouTube Data API OAuth</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
            Connect Your YouTube Channel to Sync Real-Time Comments
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Securely authorize YouTube Data API access to enable comment fetching and 1-click reply publishing right from your phone or desktop.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> 100% Manual Approval Guaranteed
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Automatic OAuth Token Refresh
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => signIn('google')}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/25 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <YoutubeIcon className="w-5 h-5 text-white" />
            <span>Connect YouTube Channel</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
