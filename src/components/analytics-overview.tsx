'use client';

import React from 'react';
import { AnalyticsStats } from '@/lib/types';
import { MessageSquare, Clock, CheckCircle2, TrendingUp, Sparkles, Film } from 'lucide-react';

interface AnalyticsOverviewProps {
  stats: AnalyticsStats;
}

export default function AnalyticsOverview({ stats }: AnalyticsOverviewProps) {
  const tones = [
    { key: 'positive', label: 'Positive (Warm)', count: stats.tone_distribution.positive, color: 'bg-emerald-500', text: 'text-emerald-400' },
    { key: 'question', label: 'Questions (Helpful)', count: stats.tone_distribution.question, color: 'bg-cyan-500', text: 'text-cyan-400' },
    { key: 'criticism', label: 'Criticism (Respectful)', count: stats.tone_distribution.criticism, color: 'bg-amber-500', text: 'text-amber-400' },
    { key: 'funny', label: 'Funny (Playful)', count: stats.tone_distribution.funny, color: 'bg-purple-500', text: 'text-purple-400' },
    { key: 'neutral', label: 'Neutral', count: stats.tone_distribution.neutral, color: 'bg-slate-500', text: 'text-slate-400' },
  ];

  const maxToneCount = Math.max(...tones.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Comments */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Comments</span>
            <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stats.total_comments}</p>
          <p className="text-[11px] text-slate-400">Fetched across all uploads</p>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Pending Approval</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-300 tracking-tight">{stats.pending_count}</p>
          <p className="text-[11px] text-amber-400/80 font-medium">Awaiting manual approval</p>
        </div>

        {/* Card 3: Posted Replies */}
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Posted on YouTube</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-300 tracking-tight">{stats.posted_count}</p>
          <p className="text-[11px] text-emerald-400/80 font-medium">Successfully published</p>
        </div>

        {/* Card 4: Response Rate */}
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400">Response Rate</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-purple-300 tracking-tight">{stats.response_rate}%</p>
          <p className="text-[11px] text-purple-400/80 font-medium">Approval speed metric</p>
        </div>
      </div>

      {/* Tone Distribution Breakdown & Top Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tone Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">AI Tone Analytics Breakdown</h3>
          </div>

          <div className="space-y-3 pt-2">
            {tones.map((tone) => {
              const percentage = stats.total_comments > 0 ? Math.round((tone.count / stats.total_comments) * 100) : 0;
              return (
                <div key={tone.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-300">{tone.label}</span>
                    <span className={tone.text}>{tone.count} comments</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${tone.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Videos Queue */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Film className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Top Active Videos</h3>
          </div>

          <div className="space-y-3">
            {stats.top_videos.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active channel videos synced yet.</p>
            ) : (
              stats.top_videos.map((vid) => (
                <div
                  key={vid.video_id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="min-w-0 pr-3">
                    <h4 className="text-xs font-semibold text-slate-200 truncate">{vid.title}</h4>
                    <p className="text-[11px] text-slate-400">{vid.comment_count} total comments</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {vid.pending_count} pending
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
