'use client';

import React, { useState, useEffect, useMemo } from 'react';
import YouTubeConnectCard from '@/components/youtube-connect-card';
import CommentFilters from '@/components/comment-filters';
import CommentCard from '@/components/comment-card';
import BulkActionBar from '@/components/bulk-action-bar';
import EditReplyModal from '@/components/edit-reply-modal';
import HistoryDrawer from '@/components/history-drawer';
import { CommentCardSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/providers';
import { INITIAL_MOCK_COMMENTS, INITIAL_MOCK_VIDEOS } from '@/lib/mock-data';
import { CommentItem, FilterOptions, VideoItem } from '@/lib/types';
import { MessageSquare, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const { showToast } = useToast();

  const [comments, setComments] = useState<CommentItem[]>(INITIAL_MOCK_COMMENTS);
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_MOCK_VIDEOS);
  const [channel, setChannel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNew, setIsFetchingNew] = useState(false);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'pending',
    tone: 'all',
    videoId: 'all',
    sort: 'newest',
    page: 1,
    limit: 5,
  });

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingComment, setEditingComment] = useState<CommentItem | null>(null);
  const [historyComment, setHistoryComment] = useState<CommentItem | null>(null);

  // Load live data from Supabase DB on dashboard mount
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/comments/fetch');
      const data = await res.json();
      if (data.success) {
        if (data.comments && data.comments.length > 0) {
          setComments(data.comments);
        }
        if (data.channel) {
          setChannel(data.channel);
        }
        if (data.videos && data.videos.length > 0) {
          setVideos(data.videos);
        }
      }
    } catch (err: any) {
      console.error('[Dashboard Error] Failed fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Comment Fetcher Action
  const handleFetchNewComments = async () => {
    setIsFetchingNew(true);
    try {
      const res = await fetch('/api/comments/fetch', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'Comments fetched successfully!', 'success');
        if (data.data && data.data.length > 0) {
          setComments((prev) => [...data.data, ...prev]);
        }
      } else {
        showToast(data.error || 'Failed to fetch new comments', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching comments', 'error');
    } finally {
      setIsFetchingNew(false);
    }
  };

  // Single Actions: Approve, Reject, Edit, Regenerate, Retry
  const handleApprove = async (comment: CommentItem) => {
    const replyText = comment.generated_reply?.reply_text;
    if (!replyText) {
      showToast('No reply text available to publish', 'warning');
      return;
    }

    setActionProcessingId(comment.id);
    try {
      const res = await fetch('/api/comments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: comment.id,
          youtubeCommentId: comment.youtube_comment_id,
          replyText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Reply approved and published to YouTube!', 'success');
        setComments((prev) =>
          prev.map((c) => (c.id === comment.id ? { ...c, reply_status: 'posted' } : c))
        );
      } else {
        showToast(data.error || 'Failed to approve reply', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error approving reply', 'error');
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleReject = async (comment: CommentItem) => {
    setActionProcessingId(comment.id);
    try {
      const res = await fetch('/api/comments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment.id }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Comment marked as rejected', 'info');
        setComments((prev) =>
          prev.map((c) => (c.id === comment.id ? { ...c, reply_status: 'rejected' } : c))
        );
      } else {
        showToast(data.error || 'Failed to reject comment', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error rejecting comment', 'error');
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleSaveEditedReply = async (commentId: string, newReplyText: string, approveImmediately = false) => {
    setActionProcessingId(commentId);
    try {
      const res = await fetch('/api/comments/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, newReplyText }),
      });

      const data = await res.json();
      if (data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  generated_reply: c.generated_reply
                    ? { ...c.generated_reply, reply_text: newReplyText }
                    : null,
                }
              : c
          )
        );
        showToast('Draft reply updated!', 'success');
        setEditingComment(null);

        if (approveImmediately) {
          const targetComment = comments.find((c) => c.id === commentId);
          if (targetComment) {
            await handleApprove({
              ...targetComment,
              generated_reply: { ...targetComment.generated_reply!, reply_text: newReplyText },
            });
          }
        }
      } else {
        showToast(data.error || 'Failed to save edit', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving edited reply', 'error');
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleRegenerate = async (comment: CommentItem) => {
    setActionProcessingId(comment.id);
    try {
      const res = await fetch('/api/comments/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: comment.id,
          commentText: comment.comment_text,
          commentAuthor: comment.author_name,
          videoTitle: comment.video?.title,
          currentReplyText: comment.generated_reply?.reply_text,
        }),
      });

      const data = await res.json();
      if (data.success && data.newReply) {
        showToast('Fresh AI reply generated!', 'success');
        setComments((prev) =>
          prev.map((c) =>
            c.id === comment.id
              ? {
                  ...c,
                  generated_reply: {
                    id: `gen-${Date.now()}`,
                    comment_id: c.id,
                    reply_text: data.newReply.reply_text,
                    model_used: data.newReply.model_used,
                    tone: data.newReply.tone,
                    temperature: 0.7,
                    is_approved: false,
                    is_active: true,
                    prompt_used: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                }
              : c
          )
        );
      } else {
        showToast(data.error || 'Failed to regenerate reply', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error regenerating reply', 'error');
    } finally {
      setActionProcessingId(null);
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'approve' | 'reject' | 'regenerate') => {
    if (selectedIds.length === 0) return;

    const selectedComments = comments.filter((c) => selectedIds.includes(c.id));
    setIsLoading(true);

    try {
      const res = await fetch('/api/comments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments: selectedComments }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Bulk ${action} executed for ${selectedIds.length} comments!`, 'success');
        if (action === 'approve') {
          setComments((prev) =>
            prev.map((c) => (selectedIds.includes(c.id) ? { ...c, reply_status: 'posted' } : c))
          );
        } else if (action === 'reject') {
          setComments((prev) =>
            prev.map((c) => (selectedIds.includes(c.id) ? { ...c, reply_status: 'rejected' } : c))
          );
        }
        setSelectedIds([]);
      } else {
        showToast(data.error || `Bulk ${action} failed`, 'error');
      }
    } catch (err: any) {
      showToast(err.message || `Error executing bulk ${action}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Filtered Comments Computation
  const filteredComments = useMemo(() => {
    return comments
      .filter((c) => {
        // Status filter
        if (filters.status !== 'all' && c.reply_status !== filters.status) return false;
        // Tone filter
        if (filters.tone !== 'all' && c.detected_tone !== filters.tone) return false;
        // Video filter
        if (filters.videoId !== 'all' && c.video_id !== filters.videoId) return false;
        // Search filter
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase();
          const matchAuthor = c.author_name.toLowerCase().includes(q);
          const matchComment = c.comment_text.toLowerCase().includes(q);
          const matchVideo = c.video?.title.toLowerCase().includes(q) || false;
          if (!matchAuthor && !matchComment && !matchVideo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.published_at).getTime();
        const timeB = new Date(b.published_at).getTime();
        return filters.sort === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [comments, filters]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredComments.length / filters.limit) || 1;
  const paginatedComments = useMemo(() => {
    const start = (filters.page - 1) * filters.limit;
    return filteredComments.slice(start, start + filters.limit);
  }, [filteredComments, filters.page, filters.limit]);

  const pendingCount = comments.filter((c) => c.reply_status === 'pending').length;

  return (
    <div className="space-y-6 pb-20">
      
      {/* YouTube OAuth Connection Banner */}
      <YouTubeConnectCard channel={channel} />

      {/* Queue Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Pending Approval Queue</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 border border-amber-500/40 text-amber-300">
              {pendingCount} Pending
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Review, edit, and approve AI draft replies before publishing to YouTube</p>
        </div>

        <button
          onClick={handleFetchNewComments}
          disabled={isFetchingNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingNew ? 'animate-spin' : ''}`} />
          <span>{isFetchingNew ? 'Syncing...' : 'Sync New Comments'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <CommentFilters
        filters={filters}
        onChangeFilters={(upd) => setFilters((prev) => ({ ...prev, ...upd }))}
        videos={videos}
        totalCount={filteredComments.length}
      />

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <CommentCardSkeleton />
            <CommentCardSkeleton />
          </>
        ) : paginatedComments.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3 backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No comments found matching current filters</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search criteria or click "Sync New Comments" to check YouTube for fresh audience replies.
            </p>
          </div>
        ) : (
          paginatedComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={(c) => setEditingComment(c)}
              onRegenerate={handleRegenerate}
              onViewHistory={(c) => setHistoryComment(c)}
              isSelected={selectedIds.includes(comment.id)}
              onToggleSelect={handleToggleSelect}
              isProcessing={actionProcessingId === comment.id}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Showing Page <span className="font-semibold text-white">{filters.page}</span> of{' '}
            <span className="font-semibold text-white">{totalPages}</span> ({filteredComments.length} items)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={filters.page === 1}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
              disabled={filters.page === totalPages}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onBulkApprove={() => handleBulkAction('approve')}
        onBulkReject={() => handleBulkAction('reject')}
        onBulkRegenerate={() => handleBulkAction('regenerate')}
        onClearSelection={() => setSelectedIds([])}
        isProcessing={isLoading}
      />

      {/* Edit Reply Modal */}
      <EditReplyModal
        comment={editingComment}
        isOpen={Boolean(editingComment)}
        onClose={() => setEditingComment(null)}
        onSave={handleSaveEditedReply}
        isProcessing={Boolean(actionProcessingId)}
      />

      {/* Audit History Drawer */}
      <HistoryDrawer
        comment={historyComment}
        isOpen={Boolean(historyComment)}
        onClose={() => setHistoryComment(null)}
      />
    </div>
  );
}
