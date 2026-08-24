import React from 'react';
import { ReplyStatus, CommentTone } from '@/lib/types';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: ReplyStatus }) {
  const statusStyles: Record<ReplyStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', label: 'Pending Approval' },
    approved: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', label: 'Approved' },
    posted: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', label: 'Posted on YouTube' },
    rejected: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400', label: 'Rejected' },
    failed: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', label: 'Posting Failed' },
  };

  const current = statusStyles[status] || statusStyles.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md',
        current.bg,
        current.text
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {current.label}
    </span>
  );
}

export function ToneBadge({ tone }: { tone: CommentTone }) {
  const toneStyles: Record<CommentTone, { bg: string; text: string; emoji: string }> = {
    positive: { bg: 'bg-emerald-950/60 border-emerald-700/40', text: 'text-emerald-300', emoji: '😊 Warm' },
    question: { bg: 'bg-cyan-950/60 border-cyan-700/40', text: 'text-cyan-300', emoji: '❓ Helpful' },
    criticism: { bg: 'bg-amber-950/60 border-amber-700/40', text: 'text-amber-300', emoji: '🤝 Respectful' },
    funny: { bg: 'bg-purple-950/60 border-purple-700/40', text: 'text-purple-300', emoji: '😄 Playful' },
    neutral: { bg: 'bg-slate-800/60 border-slate-700/40', text: 'text-slate-300', emoji: '💬 Neutral' },
  };

  const current = toneStyles[tone] || toneStyles.neutral;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
        current.bg,
        current.text
      )}
    >
      {current.emoji}
    </span>
  );
}
