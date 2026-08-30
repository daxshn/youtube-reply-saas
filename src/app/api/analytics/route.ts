import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth-guard';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const supabase = getSupabaseAdmin();

    // 1. Fetch all videos for reference
    const { data: videos, error: vidErr } = await supabase
      .from('videos')
      .select('id, youtube_video_id, title, thumbnail_url');

    if (vidErr) {
      console.error('[Analytics API DB Error] Videos query error:', vidErr);
    }

    // Build dual lookup maps for videos by UUID (v.id) and YouTube Video ID (v.youtube_video_id)
    const videoByUuidMap = new Map<string, any>();
    const videoByYtIdMap = new Map<string, any>();

    for (const v of (videos || [])) {
      if (v.id) videoByUuidMap.set(v.id, v);
      if (v.youtube_video_id) videoByYtIdMap.set(v.youtube_video_id, v);
    }

    // 2. Fetch all comments
    const { data: comments, error: commErr } = await supabase
      .from('comments')
      .select('id, reply_status, detected_tone, video_id');

    if (commErr) {
      console.error('[Analytics API DB Error] Comments query error:', commErr);
      throw new Error(`Failed to query analytics comments: ${commErr.message}`);
    }

    const commentList = comments || [];
    const totalNum = commentList.length;

    let pendingNum = 0;
    let postedNum = 0;
    let rejectedNum = 0;
    let approvedNum = 0;

    const toneDistribution = {
      positive: 0,
      question: 0,
      criticism: 0,
      funny: 0,
      neutral: 0,
    };

    const videoStatsMap: Record<string, { video_id: string; title: string; comment_count: number; pending_count: number }> = {};

    for (const c of commentList) {
      const status = c.reply_status;
      if (status === 'pending') pendingNum++;
      else if (status === 'posted') postedNum++;
      else if (status === 'approved') approvedNum++;
      else if (status === 'rejected') rejectedNum++;

      const tone = (c.detected_tone || 'neutral').toLowerCase();
      if (tone === 'positive' || tone === 'appreciation') toneDistribution.positive++;
      else if (tone === 'question') toneDistribution.question++;
      else if (tone === 'criticism' || tone === 'feedback') toneDistribution.criticism++;
      else if (tone === 'funny') toneDistribution.funny++;
      else toneDistribution.neutral++;

      // Dual join: match c.video_id against v.id or v.youtube_video_id
      const matchedVideo = c.video_id
        ? videoByUuidMap.get(c.video_id) || videoByYtIdMap.get(c.video_id)
        : null;

      const vidKey = matchedVideo ? matchedVideo.id : (c.video_id || 'unknown');
      const vidTitle = matchedVideo?.title || 'Untitled Video';

      if (!videoStatsMap[vidKey]) {
        videoStatsMap[vidKey] = {
          video_id: vidKey,
          title: vidTitle,
          comment_count: 0,
          pending_count: 0,
        };
      }
      videoStatsMap[vidKey].comment_count++;
      if (status === 'pending') {
        videoStatsMap[vidKey].pending_count++;
      }
    }

    const responseRate = totalNum > 0 ? Number((((postedNum + approvedNum) / totalNum) * 100).toFixed(1)) : 0;

    // Top active videos calculated dynamically strictly from comments table counts
    const top_videos = Object.values(videoStatsMap)
      .sort((a, b) => b.comment_count - a.comment_count)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      analytics: {
        total_comments: totalNum,
        pending_count: pendingNum,
        approved_count: approvedNum,
        posted_count: postedNum,
        rejected_count: rejectedNum,
        response_rate: responseRate,
        tone_distribution: toneDistribution,
        top_videos,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
