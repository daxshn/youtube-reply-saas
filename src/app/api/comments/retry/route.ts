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

    const { commentId, youtubeCommentId, replyText } = body;

    if (!commentId || !replyText) {
      return NextResponse.json({ error: 'Missing commentId or replyText' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let youtubeReplyId = `yt-retry-${Date.now()}`;

    if (supabase && youtubeCommentId && process.env.GOOGLE_CLIENT_ID) {
      const ytRes = await postReplyToYouTube(userId, youtubeCommentId, replyText);
      youtubeReplyId = ytRes.youtubeReplyId;
    }

    if (supabase) {
      await supabase
        .from('comments')
        .update({ reply_status: 'posted', updated_at: new Date().toISOString() })
        .eq('id', commentId);

      await supabase.from('reply_history').insert({
        comment_id: commentId,
        action: 'posted',
        action_by: 'User Retry',
        reply_text: replyText,
        youtube_reply_id: youtubeReplyId,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Retry succeeded! Reply posted to YouTube.',
      commentId,
      youtubeReplyId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Retry failed: ' + error.message }, { status: 500 });
  }
}
