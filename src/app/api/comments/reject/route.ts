import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth-guard';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const body = await req.json();
    const { commentId, reason } = body;

    if (!commentId) {
      return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (supabase) {
      await supabase
        .from('comments')
        .update({
          reply_status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      await supabase.from('reply_history').insert({
        comment_id: commentId,
        action: 'rejected',
        action_by: 'User Action',
        error_message: reason || 'Rejected by user on dashboard',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Comment rejected successfully.',
      commentId,
      status: 'rejected',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
