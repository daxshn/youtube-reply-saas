'use client';

import React from 'react';
import { INITIAL_HISTORY, INITIAL_MOCK_COMMENTS } from '@/lib/mock-data';
import { formatRelativeTime } from '@/lib/utils';
import { History, ShieldCheck, CheckCircle2, XCircle, RotateCw, Edit3, Sparkles } from 'lucide-react';

export default function HistoryPage() {
  const historyList = INITIAL_HISTORY;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'generated':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case 'posted':
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'regenerated':
        return <RotateCw className="w-4 h-4 text-purple-400" />;
      case 'edited':
        return <Edit3 className="w-4 h-4 text-amber-400" />;
      default:
        return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-400" /> Channel Reply Audit History
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete transparent audit trail of all AI generations, edits, approvals, and YouTube posts
        </p>
      </div>

      <div className="space-y-3">
        {historyList.map((item) => {
          const comment = INITIAL_MOCK_COMMENTS.find((c) => c.id === item.comment_id);

          return (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-start gap-4"
            >
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                {getActionIcon(item.action)}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white capitalize">
                    {item.action} by {item.action_by}
                  </span>
                  <span className="text-xs text-slate-400">{formatRelativeTime(item.created_at)}</span>
                </div>

                {comment && (
                  <p className="text-xs text-slate-400">
                    Comment by <span className="text-slate-200 font-semibold">{comment.author_name}</span>: "{comment.comment_text}"
                  </p>
                )}

                {item.reply_text && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs text-indigo-200 italic">
                    "{item.reply_text}"
                  </div>
                )}

                {item.youtube_reply_id && (
                  <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Published to YouTube (ID: {item.youtube_reply_id})
                  </p>
                )}

                {item.error_message && (
                  <p className="text-[11px] text-rose-400 font-medium">Log Details: {item.error_message}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
