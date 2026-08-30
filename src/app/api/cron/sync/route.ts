import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { fetchUnansweredYouTubeComments, fetchAndStoreChannelDetailsAndVideos, postReplyToYouTube } from '@/lib/youtube/client';
import { generateAIReply } from '@/lib/ai/openai';
import { isCommentSpam } from '@/lib/ai/prompt-generator';

export async function GET(req: Request) {
  console.log('[Cron Sync] Starting automated background sync job...');
  try {
    const supabase = getSupabaseAdmin();

    // Get all active youtube accounts
    const { data: accounts, error: accErr } = await supabase
      .from('youtube_accounts')
      .select('id, user_id, channel_id, channel_title')
      .eq('is_active', true);

    if (accErr) {
      console.error('[Cron Sync Error] Failed querying active youtube_accounts:', accErr);
      return NextResponse.json({ error: `Database error: ${accErr.message}` }, { status: 500 });
    }

    if (!accounts || accounts.length === 0) {
      console.log('[Cron Sync] No active YouTube accounts to sync.');
      return NextResponse.json({ success: true, message: 'No active YouTube accounts to sync', summary: [] });
    }

    const summary = [];

    for (const acc of accounts) {
      const userId = acc.user_id;
      console.log(`[Cron Sync] Processing account "${acc.channel_title}" (${acc.channel_id}) for user ${userId}...`);

      try {
        // 1. Sync channel details and uploaded videos
        await fetchAndStoreChannelDetailsAndVideos(userId);

        // 2. Fetch new unanswered comments
        const fetchResult = await fetchUnansweredYouTubeComments(userId);

        for (const raw of fetchResult.comments) {
          const isSpam = isCommentSpam(raw.commentText);

          // Upsert Video (using youtube_account_id FK)
          const { data: video, error: vidErr } = await supabase
            .from('videos')
            .upsert({
              youtube_account_id: fetchResult.youtubeAccountId,
              youtube_video_id: raw.youtubeVideoId,
              title: raw.videoTitle,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'youtube_account_id,youtube_video_id' })
            .select()
            .single();

          if (vidErr) {
            console.error(`[Cron Sync DB Error] Video upsert error:`, vidErr);
          }

          // Insert Comment
          const { data: comment, error: commentErr } = await supabase
            .from('comments')
            .insert({
              youtube_account_id: fetchResult.youtubeAccountId,
              video_id: video?.id || null,
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

          if (commentErr || !comment || isSpam) {
            if (commentErr) console.error(`[Cron Sync DB Error] Comment insert error:`, commentErr);
            continue;
          }

          // Generate AI reply draft (requires user approval)
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
        const { data: failedComments, error: failedErr } = await supabase
          .from('comments')
          .select('*, generated_replies(*)')
          .eq('youtube_account_id', acc.id)
          .eq('reply_status', 'failed')
          .limit(5);

        if (failedErr) {
          console.error('[Cron Sync Error] Querying failed comments failed:', failedErr);
        } else if (failedComments && failedComments.length > 0) {
          console.log(`[Cron Sync] Retrying ${failedComments.length} failed comments for channel ${acc.channel_title}...`);
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
                console.log(`[Cron Sync Success] Auto-retried and posted reply for comment ${failed.id}`);
              } catch (err: any) {
                console.error(`[Cron Sync Auto-Retry Error] Retry failed for comment ${failed.id}:`, err?.message || err);
              }
            }
          }
        }

        summary.push({ userId, channelTitle: acc.channel_title, fetchedCount: fetchResult.comments.length });
      } catch (err: any) {
        console.error(`[Cron Sync Error] Exception syncing user ${userId}:`, err?.message || err);
      }
    }

    console.log('[Cron Sync Success] Background sync job completed.');
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), summary });
  } catch (error: any) {
    console.error('[Cron Sync Error] Critical exception in GET /api/cron/sync:', error?.message || error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
