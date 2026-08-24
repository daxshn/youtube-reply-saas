import { getValidYouTubeClient } from './oauth';
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

/**
 * Automatically detects connected channel details (Channel ID, Title, Custom URL/Handle, Avatar)
 * and syncs channel uploads/videos into Supabase.
 */
export async function fetchAndStoreChannelDetailsAndVideos(userId: string) {
  const ytClient = await getValidYouTubeClient(userId);
  if (!ytClient) return null;

  const { youtube, account } = ytClient;
  const supabase = getSupabaseAdmin();

  try {
    // 1. Detect Channel Details via channels.list(mine: true)
    const channelRes = await youtube.channels.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
    });

    const channelItem = channelRes.data.items?.[0];
    if (!channelItem) return null;

    const channelId = channelItem.id || account.channel_id;
    const channelTitle = channelItem.snippet?.title || account.channel_title || 'YouTube Creator';
    const channelHandle = channelItem.snippet?.customUrl || '';
    const channelAvatar = channelItem.snippet?.thumbnails?.default?.url || account.channel_avatar || '';
    const uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads;

    // Update youtube_accounts table in Supabase
    if (supabase) {
      await supabase.from('youtube_accounts').upsert({
        user_id: userId,
        channel_id: channelId,
        channel_title: channelTitle,
        channel_avatar: channelAvatar,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'channel_id' });
    }

    // 2. Fetch Channel Videos from uploads playlist
    if (uploadsPlaylistId && supabase) {
      const playlistRes = await youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: uploadsPlaylistId,
        maxResults: 50,
      });

      const videoItems = playlistRes.data.items || [];
      for (const item of videoItems) {
        const vidSnippet = item.snippet;
        const videoId = vidSnippet?.resourceId?.videoId;
        if (!videoId) continue;

        await supabase.from('videos').upsert({
          user_id: userId,
          youtube_video_id: videoId,
          title: vidSnippet?.title || 'YouTube Video',
          description: vidSnippet?.description || '',
          thumbnail_url: vidSnippet?.thumbnails?.high?.url || vidSnippet?.thumbnails?.default?.url || '',
          published_at: vidSnippet?.publishedAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'youtube_video_id' });
      }
    }

    return {
      channelId,
      channelTitle,
      channelHandle,
      channelAvatar,
    };
  } catch (err) {
    console.error('Error fetching channel details and videos:', err);
    return null;
  }
}

/**
 * Fetches recent unanswered comments from YouTube Data API v3 for a given user channel.
 * Strictly ignores comments that have already been replied to, processed, or deleted.
 */
export async function fetchUnansweredYouTubeComments(userId: string): Promise<{
  newCommentsCount: number;
  comments: FetchedCommentRaw[];
}> {
  const ytClient = await getValidYouTubeClient(userId);

  if (!ytClient) {
    throw new Error('YouTube account not connected or OAuth session expired');
  }

  const { youtube, account } = ytClient;
  const supabase = getSupabaseAdmin();

  // 1. Fetch channel's recent comment threads
  const response = await youtube.commentThreads.list({
    part: ['snippet', 'replies'],
    allThreadsRelatedToChannelId: account.channel_id,
    maxResults: 50,
    order: 'time',
  });

  const threads = response.data.items || [];
  const fetchedRawComments: FetchedCommentRaw[] = [];

  for (const thread of threads) {
    const topLevel = thread.snippet?.topLevelComment?.snippet;
    if (!topLevel) continue;

    const commentId = thread.snippet?.topLevelComment?.id;
    const videoId = thread.snippet?.videoId;
    if (!commentId || !videoId) continue;

    // Check if channel owner has already replied in YouTube thread
    const totalReplies = thread.snippet?.totalReplyCount || 0;
    const hasRepliesInYouTube = totalReplies > 0;

    // If channel has already replied on YouTube, ignore this comment!
    if (hasRepliesInYouTube) {
      continue;
    }

    const authorChannelId = topLevel.authorChannelId?.value;
    // Don't process comments made by channel creator themselves
    if (authorChannelId === account.channel_id) {
      continue;
    }

    // Check database if comment has already been processed or replied to by AI
    if (supabase) {
      const { data: existing } = await supabase
        .from('comments')
        .select('id, reply_status')
        .eq('youtube_comment_id', commentId)
        .maybeSingle();

      if (existing) {
        // Comment is already recorded in DB
        continue;
      }
    }

    fetchedRawComments.push({
      youtubeCommentId: commentId,
      youtubeVideoId: videoId,
      videoTitle: 'YouTube Upload Video',
      authorName: topLevel.authorDisplayName || 'YouTube User',
      authorAvatar: topLevel.authorProfileImageUrl || '',
      authorChannelUrl: topLevel.authorChannelUrl || '',
      commentText: topLevel.textDisplay || '',
      publishedAt: topLevel.publishedAt || new Date().toISOString(),
      totalReplyCount: totalReplies,
    });
  }

  return {
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
  const ytClient = await getValidYouTubeClient(userId);

  if (!ytClient) {
    throw new Error('YouTube authentication failed. Please reconnect your account.');
  }

  const { youtube } = ytClient;

  // Insert reply via comments.insert API
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
    throw new Error('Failed to retrieve YouTube reply ID after insertion');
  }

  return {
    success: true,
    youtubeReplyId: postedReplyId,
  };
}
