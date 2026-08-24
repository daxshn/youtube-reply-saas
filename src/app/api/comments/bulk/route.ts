import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth-guard';
import { postReplyToYouTube } from '@/lib/youtube/client';
import { generateAIReply } from '@/lib/ai/openai';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const userId = (auth.user as any)?.id || 'usr-admin';
    const body = await req.json();

    const { action, comments }: { action: 'approve' | 'reject' | 'regenerate'; comments: any[] } = body;

    if (!action || !Array.isArray(comments) || comments.length === 0) {
      return NextResponse.json({ error: 'Missing action or comments array' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const results = [];

    for (const item of comments) {
      const commentId = typeof item === 'string' ? item : item.id;
      const youtubeCommentId = typeof item === 'object' ? item.youtube_comment_id : undefined;
      const replyText = typeof item === 'object' ? item.generated_reply?.reply_text : undefined;

      try {
        if (action === 'approve') {
          let youtubeReplyId = `yt-reply-bulk-${Date.now()}`;

          if (supabase && youtubeCommentId && replyText && process.env.GOOGLE_CLIENT_ID) {
            const ytRes = await postReplyToYouTube(userId, youtubeCommentId, replyText);
            youtubeReplyId = ytRes.youtubeReplyId;
          }

          if (supabase) {
            await supabase
              .from('comments')
              .update({ reply_status: 'posted', updated_at: new Date().toISOString() })
              .eq('id', commentId);

            await supabase
              .from('generated_replies')
              .update({ is_approved: true, updated_at: new Date().toISOString() })
              .eq('comment_id', commentId);

            await supabase.from('reply_history').insert({
              comment_id: commentId,
              action: 'posted',
              action_by: 'Bulk User Approval',
              reply_text: replyText,
              youtube_reply_id: youtubeReplyId,
            });
          }
          results.push({ commentId, status: 'posted', success: true });
        } else if (action === 'reject') {
          if (supabase) {
            await supabase
              .from('comments')
              .update({ reply_status: 'rejected', updated_at: new Date().toISOString() })
              .eq('id', commentId);

            await supabase.from('reply_history').insert({
              comment_id: commentId,
              action: 'rejected',
              action_by: 'Bulk User Reject',
            });
          }
          results.push({ commentId, status: 'rejected', success: true });
        } else if (action === 'regenerate') {
          if (typeof item === 'object') {
            const aiRes = await generateAIReply({
              commentText: item.comment_text || 'Great video!',
              commentAuthor: item.author_name || 'User',
              videoTitle: item.video?.title || 'Video',
              previousReplies: replyText ? [replyText] : [],
            });

            if (supabase) {
              await supabase
                .from('generated_replies')
                .update({
                  reply_text: aiRes.replyText,
                  model_used: aiRes.modelUsed,
                  tone: aiRes.tone,
                  updated_at: new Date().toISOString(),
                })
                .eq('comment_id', commentId);

              await supabase.from('reply_history').insert({
                comment_id: commentId,
                action: 'regenerated',
                action_by: 'Bulk User Regenerate',
                reply_text: aiRes.replyText,
              });
            }
            results.push({ commentId, newReply: aiRes.replyText, success: true });
          }
        }
      } catch (err: any) {
        results.push({ commentId, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} processed for ${comments.length} comments.`,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
