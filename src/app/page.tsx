import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Smartphone, MessageSquare, Zap } from 'lucide-react';
import { YoutubeIcon } from '@/components/ui/youtube-icon';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 px-6 py-4 backdrop-blur-md bg-slate-950/70 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 p-0.5 shadow-lg shadow-red-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <YoutubeIcon className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <span className="font-bold text-xl text-white">ReplyStudio AI</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 sm:py-24 text-center space-y-8">
        
        {/* Safety Guarantee Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs sm:text-sm font-medium shadow-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Manual Approval • Zero Auto-Replies Ever</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Approve AI YouTube Replies from Your Phone in <span className="bg-gradient-to-r from-red-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">One Click</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Never miss a comment again. Fetch newest channel comments, generate human American-English replies matched to comment tone, and publish with 1-click phone approval.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold text-base shadow-2xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-5 h-5" />
            <span>Launch Reply Queue</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-base border border-slate-700 transition-all"
          >
            <span>Configure AI Settings</span>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3 backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Phone-Friendly Dashboard</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Designed for rapid mobile review. Approve, edit, reject, or regenerate replies anywhere on the go.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3 backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Tone-Matched AI</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automatically detects positive, question, criticism, or funny comments to generate warm, helpful, or playful replies.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3 backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Spam & Duplicate Shield</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Filters out whatsapp/crypto bot spam and ignores comments already answered by your channel.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-6 text-center text-xs text-slate-500">
        <p>© 2026 ReplyStudio AI. Built with Next.js 15, Supabase, Google OAuth & YouTube Data API v3.</p>
      </footer>
    </div>
  );
}
