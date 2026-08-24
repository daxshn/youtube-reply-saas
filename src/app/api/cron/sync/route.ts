import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { fetchUnansweredYouTubeComments, fetchAndStoreChannelDetailsAndVideos, postReplyToYouTube } from '@/lib/youtube/client';
import { generateAIReply } from '@/lib/ai/openai';
import { isCommentSpam } from '@/lib/ai/prompt-generator';

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ message: 'Supabase admin client not initialized' }, { status: 200 });
    }

    // Get all active youtube accounts
    const { data: accounts } = await supabase
      .from('youtube_accounts')
      .select('user_id')
      .eq('is_active', true);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'No active YouTube accounts to sync' });
    }

    const summary = [];

    for (const acc of accounts) {
      const userId = acc.user_id;

      try {
        // 1. Sync channel details and videos
        await fetchAndStoreChannelDetailsAndVideos(userId);

        // 2. Fetch new unanswered comments
        const fetchResult = await fetchUnansweredYouTubeComments(userId);

        for (const raw of fetchResult.comments) {
          const isSpam = isCommentSpam(raw.commentText);

          const { data: comment, error: commentErr } = await supabase
            .from('comments')
            .insert({
              user_id: userId,
              youtube_comment_id: raw.youtubeCommentId,
              author_name: raw.authorName,
              author_avatar: raw.authorAvatar,
              author_channel_url: raw.authorChannelUrl,
              comment_text: raw.commentText,
              published_at: raw.publishedAt,
              reply_status: isSpam ? 'rejected' : 'pending',
              is_spam: isSpam,
            })
            .select()
            .single();

          if (commentErr || !comment || isSpam) continue;

          // Generate AI reply draft (human-in-the-loop, requires approval)
          const aiResult = await generateAIReply({
            commentText: comment.comment_text,
            commentAuthor: comment.author_name,
            videoTitle: raw.videoTitle,
          });

          await supabase.from('generated_replies').insert({
            comment_id: comment.id,
            reply_text: aiResult.replyText,
            model_used: aiResult.modelUsed,
            tone: aiResult.tone,
            temperature: 0.7,
            is_approved: false,
            is_active: true,
          });

          await supabase.from('reply_history').insert({
            comment_id: comment.id,
            action: 'generated',
            action_by: 'Cron AI Sync',
            reply_text: aiResult.replyText,
          });
        }

        // 3. Retry failed replies
        const { data: failedComments } = await supabase
          .from('comments')
          .select('*, generated_replies(*)')
          .eq('user_id', userId)
          .eq('reply_status', 'failed')
          .limit(5);

        if (failedComments) {
          for (const failed of failedComments) {
            const replyText = failed.generated_replies?.[0]?.reply_text;
            if (replyText && failed.youtube_comment_id) {
              try {
                const ytRes = await postReplyToYouTube(userId, failed.youtube_comment_id, replyText);
                await supabase.from('comments').update({ reply_status: 'posted' }).eq('id', failed.id);
                await supabase.from('reply_history').insert({
                  comment_id: failed.id,
                  action: 'posted',
                  action_by: 'Cron Auto-Retry',
                  reply_text: replyText,
                  youtube_reply_id: ytRes.youtubeReplyId,
                });
              } catch (err) {
                // Will retry on next cron run
              }
            }
          }
        }

        summary.push({ userId, fetched: fetchResult.comments.length });
      } catch (err: any) {
        console.error(`Cron error for user ${userId}:`, err?.message);
      }
    }

    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
