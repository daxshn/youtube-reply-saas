'use client';

import React from 'react';
import Modal from './ui/modal';
import { CommentItem } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import { History, Sparkles, CheckCircle2, XCircle, RotateCw, Edit3 } from 'lucide-react';

interface HistoryDrawerProps {
  comment: CommentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ActivityItem {
  id: string;
  action: string;
  action_by: string;
  reply_text: string | null;
  created_at: string;
}

export default function HistoryDrawer({ comment, isOpen, onClose }: HistoryDrawerProps) {
  if (!comment) return null;

  const replyText = comment.generated_reply?.reply_text || null;

  // Build activity log items dynamically from comment fields
  const activityList: ActivityItem[] = [
    {
      id: `${comment.id}-created`,
      action: 'received',
      action_by: 'youtube',
      reply_text: null,
      created_at: comment.published_at,
    },
  ];

  if (replyText) {
    activityList.push({
      id: `${comment.id}-generated`,
      action: comment.reply_status === 'posted' ? 'posted' : comment.reply_status === 'rejected' ? 'rejected' : 'generated',
      action_by: 'ai',
      reply_text: replyText,
      created_at: comment.updated_at || comment.created_at,
    });
  }

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
    <Modal isOpen={isOpen} onClose={onClose} title={`Audit History: ${comment.author_name}`}>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400 font-semibold">Comment Text:</p>
          <p className="text-xs text-slate-200">"{comment.comment_text}"</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activity Log</h4>

          {activityList.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl text-xs"
            >
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                {getActionIcon(item.action)}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 capitalize">{item.action} by {item.action_by}</span>
                  <span className="text-[10px] text-slate-500">{formatRelativeTime(item.created_at)}</span>
                </div>

                {item.reply_text && (
                  <p className="text-slate-300 italic text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800">
                    "{item.reply_text}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
