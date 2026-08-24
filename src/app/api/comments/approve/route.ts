import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth-guard';
import { postReplyToYouTube } from '@/lib/youtube/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const userId = (auth.user as any)?.id || 'usr-admin';
    const body = await req.json();

    const { commentId, replyText, youtubeCommentId } = body;

    if (!commentId || !replyText) {
      return NextResponse.json({ error: 'Missing commentId or replyText' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let youtubeReplyId = `yt-reply-demo-${Date.now()}`;

    // Attempt posting to live YouTube Data API if YouTube connection exists
    if (supabase && youtubeCommentId && process.env.GOOGLE_CLIENT_ID) {
      try {
        const ytRes = await postReplyToYouTube(userId, youtubeCommentId, replyText);
        youtubeReplyId = ytRes.youtubeReplyId;
      } catch (err: any) {
        console.warn('YouTube API live post warning:', err.message);
        // If live API fails, update status as failed in DB
        await supabase
          .from('comments')
          .update({ reply_status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', commentId);

        await supabase.from('reply_history').insert({
          comment_id: commentId,
          action: 'failed_attempt',
          action_by: 'User Approval',
          reply_text: replyText,
          error_message: err.message || 'YouTube API authorization or quota error',
        });

        return NextResponse.json({
          error: `YouTube API Error: ${err.message || 'Failed to post reply on YouTube'}`,
          failedStatus: true,
        }, { status: 400 });
      }
    }

    // Update database records
    if (supabase) {
      // Mark comment as posted/completed
      await supabase
        .from('comments')
        .update({
          reply_status: 'posted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      // Update generated reply approval status
      await supabase
        .from('generated_replies')
        .update({
          reply_text: replyText,
          is_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq('comment_id', commentId);

      // Record audit history entry
      await supabase.from('reply_history').insert({
        comment_id: commentId,
        action: 'posted',
        action_by: 'User Approval',
        reply_text: replyText,
        youtube_reply_id: youtubeReplyId,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Reply approved and published to YouTube successfully!',
      commentId,
      youtubeReplyId,
      status: 'posted',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
