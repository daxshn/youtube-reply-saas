import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth-guard';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const supabase = getSupabaseAdmin();

    // Query all comments with video join
    const { data: comments, error } = await supabase
      .from('comments')
      .select('id, reply_status, detected_tone, video_id, videos ( id, title )');

    if (error) {
      console.error('[Analytics API Error] Failed fetching comments:', error);
      throw new Error(`Failed to query analytics: ${error.message}`);
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

    const videoMap: Record<string, { video_id: string; title: string; comment_count: number; pending_count: number }> = {};

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

      const vidId = c.video_id || 'unknown';
      const vidTitle = (c.videos as any)?.title || 'YouTube Video';

      if (!videoMap[vidId]) {
        videoMap[vidId] = { video_id: vidId, title: vidTitle, comment_count: 0, pending_count: 0 };
      }
      videoMap[vidId].comment_count++;
      if (status === 'pending') {
        videoMap[vidId].pending_count++;
      }
    }

    const responseRate = totalNum > 0 ? Number((((postedNum + approvedNum) / totalNum) * 100).toFixed(1)) : 0;

    const top_videos = Object.values(videoMap)
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
