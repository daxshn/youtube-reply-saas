'use client';

import React, { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, AlertCircle, Lock } from 'lucide-react';
import { YoutubeIcon } from '@/components/ui/youtube-icon';

function SignInForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const isAccessDenied = error === 'AccessDenied' || error === 'Callback';

  return (
    <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
      {/* Brand Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-purple-600 p-0.5 shadow-xl shadow-red-500/20 mx-auto">
        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
          <YoutubeIcon className="w-8 h-8 text-red-500" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-white">Sign In to ReplyStudio</h1>
        <p className="text-xs text-slate-400">Restricted Administrator Single-User SaaS Portal</p>
      </div>

      {/* Access Denied Alert */}
      {isAccessDenied && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl text-left flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-rose-300">Access Denied</h4>
            <p className="text-rose-200/90">
              Only the administrator Google account specified in <code className="bg-rose-950 px-1 py-0.5 rounded text-rose-300">ADMIN_EMAIL</code> is authorized to access this platform.
            </p>
          </div>
        </div>
      )}

      {/* Google Login Button */}
      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Sign In as Admin</span>
      </button>

      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4" /> Server-Enforced Single Administrator Restriction
        </div>
        <p>Unauthorized accounts are automatically blocked and signed out.</p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white text-sm">Loading...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
