'use client';

import React from 'react';
import { Send, Trash2, RotateCw, CheckSquare, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onBulkRegenerate: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
}

export default function BulkActionBar({
  selectedCount,
  onBulkApprove,
  onBulkReject,
  onBulkRegenerate,
  onClearSelection,
  isProcessing = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl bg-slate-900/95 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-xl p-3 sm:p-4 animate-in slide-in-from-bottom-8 duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/40">
            {selectedCount}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-white">Selected</span>
          <button
            onClick={onClearSelection}
            className="text-slate-400 hover:text-white text-xs underline ml-1"
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBulkRegenerate}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Bulk Regenerate</span>
            <span className="sm:hidden">Regen</span>
          </button>

          <button
            onClick={onBulkReject}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/50 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bulk Reject</span>
          </button>

          <button
            onClick={onBulkApprove}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Bulk Approve</span>
          </button>
        </div>
      </div>
    </div>
  );
}
