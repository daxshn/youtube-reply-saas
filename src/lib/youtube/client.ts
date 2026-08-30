import { google } from 'googleapis';
import { getValidYouTubeClient, getOAuth2Client } from './oauth';
import { getSupabaseAdmin } from '../supabase/admin';

export interface FetchedCommentRaw {
  youtubeCommentId: string;
  youtubeVideoId: string;
  videoTitle: string;
  authorName: string;
  authorAvatar: string;
  authorChannelUrl: string;
  commentText: string;
  publishedAt: string;
  totalReplyCount: number;
}

export interface InitialTokens {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

/**
 * Automatically detects connected channel details (Channel ID, Title, Avatar)
 * and syncs channel uploads/videos into Supabase.
 */
export async function fetchAndStoreChannelDetailsAndVideos(userId: string, initialTokens?: InitialTokens) {
  const supabase = getSupabaseAdmin();

  console.log(`[YouTube Client] Syncing channel details and videos for user_id=${userId}...`);

  let youtubeClient: any = null;
  let existingAccount: any = null;

  if (initialTokens && initialTokens.access_token) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: initialTokens.access_token,
      refresh_token: initialTokens.refresh_token,
    });
    youtubeClient = google.youtube({ version: 'v3', auth: oauth2Client });
  } else {
    try {
      const validRes = await getValidYouTubeClient(userId);
      youtubeClient = validRes.youtube;
      existingAccount = validRes.account;
    } catch (err: any) {
      console.warn(`[YouTube Client Warning] Could not get existing client for user_id=${userId}:`, err?.message || err);
      if (!initialTokens) throw err;
    }
  }

  if (!youtubeClient) {
    throw new Error('Failed to initialize YouTube OAuth API client.');
  }

  // 1. Detect Channel Details via channels.list(mine: true)
  console.log('[YouTube API] Requesting channels.list(mine: true)...');
  const channelRes = await youtubeClient.channels.list({
    part: ['snippet', 'contentDetails'],
    mine: true,
  });

  const channelItem = channelRes.data.items?.[0];
  if (!channelItem) {
    console.error('[YouTube API Error] No channel found for authenticated Google account.');
    throw new Error('No YouTube channel found associated with this Google Account.');
  }

  const channelId = channelItem.id!;
  const channelTitle = channelItem.snippet?.title || 'YouTube Creator';
  const channelHandle = channelItem.snippet?.customUrl || '';
  const channelAvatar = channelItem.snippet?.thumbnails?.high?.url || channelItem.snippet?.thumbnails?.default?.url || '';
  const uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads;

  const accessToken = initialTokens?.access_token || existingAccount?.access_token;
  const refreshToken = initialTokens?.refresh_token || existingAccount?.refresh_token;
  const expiresAt = initialTokens?.expires_at
    ? new Date(initialTokens.expires_at * 1000).toISOString()
    : (existingAccount?.token_expires_at || new Date(Date.now() + 3600 * 1000).toISOString());

  if (!accessToken || !refreshToken) {
    throw new Error('Missing OAuth tokens for youtube_accounts record');
  }

  // Upsert youtube_accounts record
  console.log(`[Supabase] Upserting youtube_account record for channel_id=${channelId}...`);
  const { data: ytAccount, error: ytAccountErr } = await supabase
    .from('youtube_accounts')
    .upsert({
      user_id: userId,
      channel_id: channelId,
      channel_title: channelTitle,
      channel_avatar: channelAvatar,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: expiresAt,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'channel_id' })
    .select()
    .single();

  if (ytAccountErr || !ytAccount) {
    console.error('[Supabase Error] Failed to upsert youtube_accounts record:', ytAccountErr);
    throw new Error(`Database error saving youtube_account: ${ytAccountErr?.message}`);
  }

  console.log(`[Supabase Success] Saved youtube_account ID: ${ytAccount.id} for Channel "${channelTitle}" (${channelId})`);

  // 2. Fetch Channel Videos from uploads playlist
  let savedVideosCount = 0;
  if (uploadsPlaylistId) {
    console.log(`[YouTube API] Fetching videos from uploads playlist (${uploadsPlaylistId})...`);
    const playlistRes = await youtubeClient.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
    });

    const videoItems = playlistRes.data.items || [];
    for (const item of videoItems) {
      const vidSnippet = item.snippet;
      const videoId = vidSnippet?.resourceId?.videoId;
      if (!videoId) continue;

      const title = vidSnippet?.title || 'YouTube Video';
      const thumbnailUrl = vidSnippet?.thumbnails?.high?.url || vidSnippet?.thumbnails?.default?.url || '';
      const publishedAt = vidSnippet?.publishedAt || new Date().toISOString();

      // Fix schema foreign key: youtube_account_id (NOT user_id)
      const { error: vidErr } = await supabase.from('videos').upsert({
        youtube_account_id: ytAccount.id,
        youtube_video_id: videoId,
        title,
        thumbnail_url: thumbnailUrl,
        published_at: publishedAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'youtube_account_id,youtube_video_id' });

      if (vidErr) {
        console.error(`[Supabase Error] Failed to upsert video youtube_video_id=${videoId}:`, vidErr);
      } else {
        savedVideosCount++;
      }
    }
    console.log(`[Supabase Success] Upserted ${savedVideosCount} channel videos into videos table.`);
  }

  return {
    youtubeAccountId: ytAccount.id,
    channelId,
    channelTitle,
    channelHandle,
    channelAvatar,
    savedVideosCount,
  };
}

/**
 * Fetches recent unanswered comments from YouTube Data API v3 for a given user channel.
 * Strictly ignores comments that have already been replied to, processed, or deleted.
 */
export async function fetchUnansweredYouTubeComments(userId: string): Promise<{
  youtubeAccountId: string;
  channelId: string;
  newCommentsCount: number;
  comments: FetchedCommentRaw[];
}> {
  const { youtube, account } = await getValidYouTubeClient(userId);
  const supabase = getSupabaseAdmin();

  console.log(`[YouTube API] Fetching unanswered comments for channel_id=${account.channel_id}...`);

  // Fetch channel's recent comment threads
  const response = await youtube.commentThreads.list({
    part: ['snippet', 'replies'],
    allThreadsRelatedToChannelId: account.channel_id,
    maxResults: 50,
    order: 'time',
  });

  const threads = response.data.items || [];
  console.log(`[YouTube API] Received ${threads.length} raw comment threads from YouTube.`);

  const fetchedRawComments: FetchedCommentRaw[] = [];

  for (const thread of threads) {
    const topLevel = thread.snippet?.topLevelComment?.snippet;
    if (!topLevel) continue;

    const commentId = thread.snippet?.topLevelComment?.id;
    const videoId = thread.snippet?.videoId;
    if (!commentId || !videoId) continue;

    // Check if channel owner has already replied in YouTube thread
    const totalReplies = thread.snippet?.totalReplyCount || 0;
    if (totalReplies > 0) {
      continue;
    }

    const authorChannelId = topLevel.authorChannelId?.value;
    if (authorChannelId === account.channel_id) {
      continue;
    }

    // Check database if comment has already been processed or replied to
    const { data: existing, error: checkErr } = await supabase
      .from('comments')
      .select('id, reply_status')
      .eq('youtube_comment_id', commentId)
      .maybeSingle();

    if (checkErr) {
      console.error(`[Supabase Query Warning] Failed checking existing comment ${commentId}:`, checkErr);
    }

    if (existing) {
      continue;
    }

    fetchedRawComments.push({
      youtubeCommentId: commentId,
      youtubeVideoId: videoId,
      videoTitle: (topLevel as any).videoTitle || 'YouTube Upload Video',
      authorName: topLevel.authorDisplayName || 'YouTube User',
      authorAvatar: topLevel.authorProfileImageUrl || '',
      authorChannelUrl: topLevel.authorChannelUrl || '',
      commentText: topLevel.textDisplay || '',
      publishedAt: topLevel.publishedAt || new Date().toISOString(),
      totalReplyCount: totalReplies,
    });
  }

  console.log(`[YouTube Client] Filtered down to ${fetchedRawComments.length} new unanswered comments.`);

  return {
    youtubeAccountId: account.id,
    channelId: account.channel_id,
    newCommentsCount: fetchedRawComments.length,
    comments: fetchedRawComments,
  };
}

/**
 * Publishes a reply to YouTube comment using YouTube Data API v3
 */
export async function postReplyToYouTube(
  userId: string,
  youtubeCommentId: string,
  replyText: string
): Promise<{ success: boolean; youtubeReplyId: string }> {
  console.log(`[YouTube API] Posting reply to commentId=${youtubeCommentId} for user_id=${userId}...`);

  const { youtube } = await getValidYouTubeClient(userId);

  const response = await youtube.comments.insert({
    part: ['snippet'],
    requestBody: {
      snippet: {
        parentId: youtubeCommentId,
        textOriginal: replyText,
      },
    },
  });

  const postedReplyId = response.data.id;
  if (!postedReplyId) {
    console.error('[YouTube API Error] comments.insert succeeded but returned no reply ID.');
    throw new Error('Failed to retrieve YouTube reply ID after insertion.');
  }

  console.log(`[YouTube API Success] Reply posted successfully! YouTube Reply ID: ${postedReplyId}`);

  return {
    success: true,
    youtubeReplyId: postedReplyId,
  };
}
