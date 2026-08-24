import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-800/80', className)}
      {...props}
    />
  );
}

export function CommentCardSkeleton() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
        <Skeleton className="w-24 h-6 rounded-full" />
      </div>

      <Skeleton className="w-full h-12 rounded-xl" />

      <div className="bg-slate-950/50 p-4 rounded-xl space-y-2 border border-slate-800/40">
        <Skeleton className="w-28 h-3" />
        <Skeleton className="w-full h-10 rounded-lg" />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Skeleton className="w-20 h-9 rounded-xl" />
        <Skeleton className="w-20 h-9 rounded-xl" />
        <Skeleton className="w-24 h-9 rounded-xl" />
      </div>
    </div>
  );
}
