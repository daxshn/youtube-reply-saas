import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth-guard';
import { postReplyToYouTube } from '@/lib/youtube/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const userId = (auth.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User ID missing from session.' }, { status: 401 });
    }

    const body = await req.json();
    const { commentId, replyText, youtubeCommentId } = body;

    if (!commentId || !replyText || !youtubeCommentId) {
      console.error('[API /comments/approve Error] Missing parameters:', { commentId, replyText, youtubeCommentId });
      return NextResponse.json({ error: 'Missing commentId, replyText, or youtubeCommentId' }, { status: 400 });
    }

    console.log(`[API /comments/approve] Approving & posting reply for commentId=${commentId}, youtubeCommentId=${youtubeCommentId}...`);

    const supabase = getSupabaseAdmin();
    let youtubeReplyId = '';

    // Post live reply to YouTube Data API
    try {
      const ytRes = await postReplyToYouTube(userId, youtubeCommentId, replyText);
      youtubeReplyId = ytRes.youtubeReplyId;
    } catch (err: any) {
      console.error(`[API /comments/approve Error] Failed posting reply to YouTube API for comment ${commentId}:`, err?.message || err);

      // Record failed status in DB
      await supabase
        .from('comments')
        .update({ reply_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', commentId);

      await supabase.from('reply_history').insert({
        comment_id: commentId,
        action: 'failed_attempt',
        action_by: 'User Approval',
        reply_text: replyText,
        error_message: err?.message || 'YouTube API authorization or quota error',
      });

      return NextResponse.json({
        error: `YouTube API Error: ${err?.message || 'Failed to post reply on YouTube'}`,
        failedStatus: true,
      }, { status: 400 });
    }

    // Update database records on success
    console.log(`[API /comments/approve DB] Updating comment ${commentId} status to 'posted'...`);

    const { error: commentUpdErr } = await supabase
      .from('comments')
      .update({
        reply_status: 'posted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId);

    if (commentUpdErr) {
      console.error('[API /comments/approve DB Error] Failed updating comment status:', commentUpdErr);
    }

    const { error: genUpdErr } = await supabase
      .from('generated_replies')
      .update({
        reply_text: replyText,
        is_approved: true,
        updated_at: new Date().toISOString(),
      })
      .eq('comment_id', commentId);

    if (genUpdErr) {
      console.error('[API /comments/approve DB Error] Failed updating generated reply:', genUpdErr);
    }

    // Audit log entry
    await supabase.from('reply_history').insert({
      comment_id: commentId,
      action: 'posted',
      action_by: 'User Approval',
      reply_text: replyText,
      youtube_reply_id: youtubeReplyId,
    });

    console.log(`[API /comments/approve Success] Comment ${commentId} approved and posted to YouTube!`);

    return NextResponse.json({
      success: true,
      message: 'Reply approved and published to YouTube successfully!',
      commentId,
      youtubeReplyId,
      status: 'posted',
    });
  } catch (error: any) {
    console.error('[API /comments/approve Critical Error]:', error?.message || error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
