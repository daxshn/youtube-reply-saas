'use client';

import React from 'react';
import { CommentItem } from '@/lib/types';
import { StatusBadge, ToneBadge } from './ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { Edit3, Trash2, RotateCw, ExternalLink, Sparkles, AlertTriangle, ShieldAlert, History as HistoryIcon, Send } from 'lucide-react';

interface CommentCardProps {
  comment: CommentItem;
  onApprove: (comment: CommentItem) => void;
  onReject: (comment: CommentItem) => void;
  onEdit: (comment: CommentItem) => void;
  onRegenerate: (comment: CommentItem) => void;
  onRetry?: (comment: CommentItem) => void;
  onViewHistory?: (comment: CommentItem) => void;
  isSelected?: boolean;
  onToggleSelect?: (commentId: string) => void;
  isProcessing?: boolean;
}

export default function CommentCard({
  comment,
  onApprove,
  onReject,
  onEdit,
  onRegenerate,
  onRetry,
  onViewHistory,
  isSelected = false,
  onToggleSelect,
  isProcessing = false,
}: CommentCardProps) {
  const isPending = comment.reply_status === 'pending';
  const isFailed = comment.reply_status === 'failed';
  const replyText = comment.generated_reply?.reply_text;

  return (
    <div
      className={`group relative bg-slate-900/70 border rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-xl backdrop-blur-md ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-slate-900/90'
          : 'border-slate-800/80 hover:border-slate-700/80'
      }`}
    >
      {/* Top Header Row: Video Title & Checkbox */}
      <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSelect && isPending && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(comment.id)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
            />
          )}

          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-slate-400 truncate flex items-center gap-1.5">
              <span>Video:</span>
              <span className="text-slate-200 font-medium">{comment.video?.title || 'Video'}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={comment.reply_status} />
          {comment.detected_tone && <ToneBadge tone={comment.detected_tone} />}
        </div>
      </div>

      {/* Comment Author & Text */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={comment.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
              alt={comment.author_name}
              className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
            />
            <div>
              <a
                href={comment.author_channel_url || '#'}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-slate-100 hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
              >
                {comment.author_name}
                <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <p className="text-[11px] text-slate-400">{formatRelativeTime(comment.published_at)}</p>
            </div>
          </div>

          {/* Spam / Duplicate Badges */}
          <div className="flex items-center gap-1.5">
            {comment.is_spam && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 border border-rose-800/40 text-rose-300">
                <ShieldAlert className="w-3 h-3 text-rose-400" /> Spam
              </span>
            )}
            {comment.is_duplicate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 border border-amber-800/40 text-amber-300">
                <AlertTriangle className="w-3 h-3 text-amber-400" /> Duplicate
              </span>
            )}
          </div>
        </div>

        {/* Comment Text Content */}
        <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-sm text-slate-200 leading-relaxed">
          "{comment.comment_text}"
        </div>
      </div>

      {/* AI Generated Reply Box */}
      {replyText && (
        <div className="bg-gradient-to-br from-indigo-950/30 via-slate-950 to-purple-950/20 border border-indigo-500/20 rounded-xl p-3.5 space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Draft Reply</span>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">
              {comment.generated_reply?.model_used || 'gpt-4o-mini'}
            </span>
          </div>
          <p className="text-sm text-indigo-100 font-sans leading-relaxed italic">
            "{replyText}"
          </p>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-1">
          {onViewHistory && (
            <button
              onClick={() => onViewHistory(comment)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Failed Retry Option */}
          {isFailed && onRetry && (
            <button
              onClick={() => onRetry(comment)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry Post
            </button>
          )}

          {/* Regenerate Button */}
          {isPending && (
            <button
              onClick={() => onRegenerate(comment)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
              title="Regenerate non-repetitive reply"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}

          {/* Edit Button */}
          {isPending && (
            <button
              onClick={() => onEdit(comment)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}

          {/* Reject Button */}
          {isPending && (
            <button
              onClick={() => onReject(comment)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reject</span>
            </button>
          )}

          {/* Approve & Publish Button */}
          {isPending && (
            <button
              onClick={() => onApprove(comment)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Approve & Post</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
