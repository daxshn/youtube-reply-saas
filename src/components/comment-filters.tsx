'use client';

import React from 'react';
import { FilterOptions, VideoItem } from '@/lib/types';
import { Search, SlidersHorizontal, ArrowUpDown, Film, Filter } from 'lucide-react';

interface CommentFiltersProps {
  filters: FilterOptions;
  onChangeFilters: (updated: Partial<FilterOptions>) => void;
  videos: VideoItem[];
  totalCount: number;
}

export default function CommentFilters({ filters, onChangeFilters, videos, totalCount }: CommentFiltersProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5 backdrop-blur-md shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChangeFilters({ search: e.target.value, page: 1 })}
            placeholder="Search author, comment text, or video title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Filters Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.status}
              onChange={(e) => onChangeFilters({ status: e.target.value as any, page: 1 })}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="pending" className="bg-slate-900 text-slate-200">Pending Queue</option>
              <option value="posted" className="bg-slate-900 text-slate-200">Posted on YouTube</option>
              <option value="rejected" className="bg-slate-900 text-slate-200">Rejected</option>
              <option value="failed" className="bg-slate-900 text-slate-200">Failed</option>
              <option value="all" className="bg-slate-900 text-slate-200">All Statuses</option>
            </select>
          </div>

          {/* Tone Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.tone}
              onChange={(e) => onChangeFilters({ tone: e.target.value as any, page: 1 })}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Tones</option>
              <option value="positive" className="bg-slate-900 text-slate-200">Positive (Warm)</option>
              <option value="question" className="bg-slate-900 text-slate-200">Questions (Helpful)</option>
              <option value="criticism" className="bg-slate-900 text-slate-200">Criticism (Respectful)</option>
              <option value="funny" className="bg-slate-900 text-slate-200">Funny (Playful)</option>
            </select>
          </div>

          {/* Video Selector Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Film className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.videoId}
              onChange={(e) => onChangeFilters({ videoId: e.target.value, page: 1 })}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Videos</option>
              {videos.map((vid) => (
                <option key={vid.id} value={vid.id} className="bg-slate-900 text-slate-200 truncate">
                  {vid.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sort}
              onChange={(e) => onChangeFilters({ sort: e.target.value as any })}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-slate-900 text-slate-200">Newest First</option>
              <option value="oldest" className="bg-slate-900 text-slate-200">Oldest First</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
