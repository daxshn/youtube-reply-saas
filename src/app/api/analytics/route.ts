import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth-guard';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { INITIAL_ANALYTICS } from '@/lib/mock-data';

export async function GET() {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const supabase = getSupabaseAdmin();

    if (supabase) {
      const { count: total } = await supabase.from('comments').select('*', { count: 'exact', head: true });
      const { count: pending } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('reply_status', 'pending');
      const { count: posted } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('reply_status', 'posted');
      const { count: rejected } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('reply_status', 'rejected');

      const totalNum = total || 0;
      const postedNum = posted || 0;
      const responseRate = totalNum > 0 ? Number(((postedNum / totalNum) * 100).toFixed(1)) : 100;

      return NextResponse.json({
        success: true,
        analytics: {
          total_comments: totalNum,
          pending_count: pending || 0,
          approved_count: postedNum,
          posted_count: postedNum,
          rejected_count: rejected || 0,
          response_rate: responseRate,
          tone_distribution: INITIAL_ANALYTICS.tone_distribution,
          top_videos: INITIAL_ANALYTICS.top_videos,
        },
      });
    }

    return NextResponse.json({ success: true, analytics: INITIAL_ANALYTICS });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
