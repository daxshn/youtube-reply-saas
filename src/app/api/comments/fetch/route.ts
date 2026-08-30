import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth-guard';
import { checkRateLimit } from '@/lib/rate-limit';
import { fetchUnansweredYouTubeComments, fetchAndStoreChannelDetailsAndVideos } from '@/lib/youtube/client';
import { generateAIReply } from '@/lib/ai/openai';
import { isCommentSpam } from '@/lib/ai/prompt-generator';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const userId = (auth.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User ID missing from session.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    console.log(`[API GET /comments/fetch] Querying database for user_id=${userId}...`);

    // Retrieve YouTube Account info
    const { data: youtubeAccount, error: accErr } = await supabase
      .from('youtube_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (accErr) {
      console.error('[API GET /comments/fetch DB Error] Account query error:', accErr);
      return NextResponse.json({ error: accErr.message }, { status: 500 });
    }

    if (!youtubeAccount) {
      console.log(`[API GET /comments/fetch] No active YouTube account found for user ${userId}.`);
      return NextResponse.json({
        success: true,
        channel: null,
        videos: [],
        comments: [],
      });
    }

    // Retrieve Videos for this YouTube account
    const { data: videos, error: vidErr } = await supabase
      .from('videos')
      .select('*')
      .eq('youtube_account_id', youtubeAccount.id)
      .order('published_at', { ascending: false })
      .limit(50);

    if (vidErr) {
      console.error('[API GET /comments/fetch DB Error] Videos query error:', vidErr);
    }

    // Build dual lookup maps for videos by UUID (v.id) and YouTube Video ID (v.youtube_video_id)
    const videoByUuidMap = new Map<string, any>();
    const videoByYtIdMap = new Map<string, any>();

    for (const v of (videos || [])) {
      if (v.id) videoByUuidMap.set(v.id, v);
      if (v.youtube_video_id) videoByYtIdMap.set(v.youtube_video_id, v);
    }

    // Retrieve Comments & Generated Replies
    const { data: rawComments, error: commErr } = await supabase
      .from('comments')
      .select('*, generated_replies(*)')
      .eq('youtube_account_id', youtubeAccount.id)
      .order('published_at', { ascending: false });

    if (commErr) {
      console.error('[API GET /comments/fetch DB Error] Comments query error:', commErr);
    }

    const comments = (rawComments || []).map((c: any) => {
      const matchedVideo = c.video_id
        ? videoByUuidMap.get(c.video_id) || videoByYtIdMap.get(c.video_id)
        : null;

      return {
        ...c,
        video: matchedVideo || null,
        generated_reply: c.generated_replies?.[0] || null,
      };
    });

    console.log(`[API GET /comments/fetch Success] Found ${videos?.length || 0} videos and ${comments.length} comments for channel "${youtubeAccount.channel_title}".`);

    return NextResponse.json({
      success: true,
      channel: youtubeAccount,
      videos: videos || [],
      comments,
    });
  } catch (error: any) {
    console.error('[API GET /comments/fetch Error] Unhandled exception:', error?.message || error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const userId = (auth.user as any)?.id;
    if (!userId) {
      console.error('[Fetch Comments Error] User ID is null in session');
      return NextResponse.json({ error: 'Unauthorized: User ID missing from session.' }, { status: 401 });
    }

    // Rate limiting check
    const { success: rateLimitOk } = checkRateLimit(userId);
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a minute before syncing again.' }, { status: 429 });
    }

    const supabase = getSupabaseAdmin();

    console.log(`[API POST /comments/fetch] Starting live YouTube comment sync for user_id=${userId}...`);

    // Ensure youtube_accounts entry exists
    const { data: account, error: accErr } = await supabase
      .from('youtube_accounts')
      .select('id, channel_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (accErr) {
      console.error('[API POST /comments/fetch DB Error] Query failed for youtube_account:', accErr);
      return NextResponse.json({ error: `Database error querying YouTube account: ${accErr.message}` }, { status: 500 });
    }

    if (!account) {
      console.log(`[API POST /comments/fetch] No YouTube account found for user ${userId}. Attempting automatic channel sync...`);
      try {
        await fetchAndStoreChannelDetailsAndVideos(userId);
      } catch (err: any) {
        console.error('[API POST /comments/fetch Error] Automatic channel sync failed:', err?.message || err);
        return NextResponse.json({
          error: 'No connected YouTube Channel found. Please log in with Google to connect your YouTube channel.',
        }, { status: 400 });
      }
    }

    // Execute live YouTube comments fetch
    const fetchResult = await fetchUnansweredYouTubeComments(userId);
    const processedComments = [];

    console.log(`[API POST /comments/fetch] Processing ${fetchResult.comments.length} new raw comments into database...`);

    for (const raw of fetchResult.comments) {
      const isSpam = isCommentSpam(raw.commentText);

      // 1. Upsert Video into database (using youtube_account_id FK)
      const { data: video, error: videoErr } = await supabase
        .from('videos')
        .upsert({
          youtube_account_id: fetchResult.youtubeAccountId,
          youtube_video_id: raw.youtubeVideoId,
          title: raw.videoTitle,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'youtube_account_id,youtube_video_id' })
        .select()
        .single();

      if (videoErr) {
        console.error(`[API POST /comments/fetch DB Error] Failed upserting video ${raw.youtubeVideoId}:`, videoErr);
      }

      // 2. Insert Comment into database (store video.id UUID)
      const { data: comment, error: commentErr } = await supabase
        .from('comments')
        .insert({
          youtube_account_id: fetchResult.youtubeAccountId,
          video_id: video?.id || raw.youtubeVideoId,
          youtube_comment_id: raw.youtubeCommentId,
          author_name: raw.authorName,
          author_avatar: raw.authorAvatar,
          author_channel_url: raw.authorChannelUrl,
          comment_text: raw.commentText,
          published_at: raw.publishedAt,
          reply_status: isSpam ? 'rejected' : 'pending',
          is_spam: isSpam,
          is_duplicate: false,
          is_deleted: false,
        })
        .select('*, generated_replies(*)')
        .single();

      if (commentErr || !comment) {
        console.error(`[API POST /comments/fetch DB Error] Failed inserting comment ${raw.youtubeCommentId}:`, commentErr);
        continue;
      }

      console.log(`[API POST /comments/fetch DB Success] Saved comment ${comment.id} by "${comment.author_name}"`);

      const commentWithVideo = { ...comment, video: video || null };

      // Update matching video comment_count based on exact comments count in DB
      if (video?.id) {
        const { count: commentCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .or(`video_id.eq.${video.id},video_id.eq.${raw.youtubeVideoId}`);

        if (commentCount !== null && commentCount !== undefined) {
          await supabase
            .from('videos')
            .update({ comment_count: commentCount, updated_at: new Date().toISOString() })
            .eq('id', video.id);
        }
      }

      // 3. If not spam, generate AI reply draft
      if (!isSpam) {
        const aiResult = await generateAIReply({
          commentText: comment.comment_text,
          commentAuthor: comment.author_name,
          videoTitle: raw.videoTitle,
        });

        const { data: genReply, error: genErr } = await supabase
          .from('generated_replies')
          .insert({
            comment_id: comment.id,
            reply_text: aiResult.replyText,
            model_used: aiResult.modelUsed,
            tone: aiResult.tone,
            temperature: 0.7,
            is_approved: false, // Human approval required before posting
            is_active: true,
          })
          .select()
          .single();

        if (genErr) {
          console.error(`[API POST /comments/fetch DB Error] Failed saving generated reply for comment ${comment.id}:`, genErr);
        }

        // Record audit log entry
        await supabase.from('reply_history').insert({
          comment_id: comment.id,
          action: 'generated',
          action_by: 'AI Engine',
          reply_text: aiResult.replyText,
        });

        processedComments.push({ ...commentWithVideo, generated_reply: genReply });
      } else {
        processedComments.push({ ...commentWithVideo, generated_reply: null });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully fetched and processed ${fetchResult.comments.length} new comments from YouTube!`,
      newCommentsCount: fetchResult.comments.length,
      data: processedComments,
    });
  } catch (error: any) {
    console.error('[API POST /comments/fetch Error] Unhandled exception:', error?.message || error);
    return NextResponse.json({ error: error.message || 'Internal Server Error fetching comments' }, { status: 500 });
  }
}
