'use client';

import React, { useEffect, useState } from 'react';
import AnalyticsOverview from '@/components/analytics-overview';
import { AnalyticsStats } from '@/lib/types';
import { BarChart3, RefreshCw } from 'lucide-react';

const EMPTY_ANALYTICS: AnalyticsStats = {
  total_comments: 0,
  pending_count: 0,
  approved_count: 0,
  posted_count: 0,
  rejected_count: 0,
  response_rate: 0,
  tone_distribution: {
    positive: 0,
    question: 0,
    criticism: 0,
    funny: 0,
    neutral: 0,
  },
  top_videos: [],
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats>(EMPTY_ANALYTICS);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.success && data.analytics) {
        setStats(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" /> Channel Analytics & Statistics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time comment sentiment, response rates, and tone distribution breakdown
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <AnalyticsOverview stats={stats} />
    </div>
  );
}
