import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { validateAdminSession } from '@/lib/auth-guard';

export async function POST(req: Request) {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const body = await req.json();
    const { commentId, newReplyText } = body;

    if (!commentId || !newReplyText?.trim()) {
      return NextResponse.json({ error: 'Missing commentId or newReplyText' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (supabase) {
      // Update generated reply text
      await supabase
        .from('generated_replies')
        .update({
          reply_text: newReplyText.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('comment_id', commentId);

      await supabase.from('reply_history').insert({
        comment_id: commentId,
        action: 'edited',
        action_by: 'User Edit',
        reply_text: newReplyText.trim(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Reply text updated successfully.',
      commentId,
      newReplyText: newReplyText.trim(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
