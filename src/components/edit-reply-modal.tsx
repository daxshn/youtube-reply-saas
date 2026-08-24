'use client';

import React, { useState, useEffect } from 'react';
import Modal from './ui/modal';
import { CommentItem } from '@/lib/types';
import { Sparkles, Send } from 'lucide-react';

interface EditReplyModalProps {
  comment: CommentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (commentId: string, newReplyText: string, approveImmediately?: boolean) => void;
  isProcessing?: boolean;
}

export default function EditReplyModal({
  comment,
  isOpen,
  onClose,
  onSave,
  isProcessing = false,
}: EditReplyModalProps) {
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (comment) {
      setReplyText(comment.generated_reply?.reply_text || '');
    }
  }, [comment]);

  if (!comment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit AI Generated Reply">
      <div className="space-y-4">
        {/* Comment context snippet */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400 font-semibold">User Comment ({comment.author_name}):</p>
          <p className="text-xs text-slate-200 italic">"{comment.comment_text}"</p>
        </div>

        {/* Reply Editor textarea */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Reply Content (1–3 Sentences)
            </span>
            <span className="text-[11px] text-slate-500 font-normal">{replyText.length} chars</span>
          </label>

          <textarea
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans leading-relaxed"
            placeholder="Type your refined YouTube comment reply here..."
          />
        </div>

        {/* Save & Save & Approve Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!replyText.trim() || isProcessing}
            onClick={() => onSave(comment.id, replyText, false)}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={!replyText.trim() || isProcessing}
            onClick={() => onSave(comment.id, replyText, true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Save & Approve</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
