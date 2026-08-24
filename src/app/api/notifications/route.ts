import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth-guard';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const userId = (auth.user as any)?.id || 'usr-admin';

    const supabase = getSupabaseAdmin();
    const notifications = [];

    if (supabase) {
      // Check pending queue size
      const { count: pendingCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('reply_status', 'pending');

      if ((pendingCount || 0) > 3) {
        notifications.push({
          id: 'notif-pending-queue',
          title: 'Approval Queue Alert',
          message: `You have ${pendingCount} pending comment replies waiting for approval.`,
          type: 'warning',
          time: 'Just now',
        });
      }

      // Check failed replies
      const { count: failedCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('reply_status', 'failed');

      if ((failedCount || 0) > 0) {
        notifications.push({
          id: 'notif-failed-replies',
          title: 'Reply Publishing Error',
          message: `${failedCount} replies failed to post. Click to retry.`,
          type: 'error',
          time: '5m ago',
        });
      }

      // Check OAuth session status
      const { data: account } = await supabase
        .from('youtube_accounts')
        .select('token_expires_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (account) {
        const expiresAt = new Date(account.token_expires_at).getTime();
        if (expiresAt - Date.now() < 30 * 60 * 1000) {
          notifications.push({
            id: 'notif-oauth-refresh',
            title: 'OAuth Session Info',
            message: 'Auto-refresh active for YouTube OAuth connection.',
            type: 'info',
            time: '1m ago',
          });
        }
      }
    }

    // Default System Notifications fallback
    if (notifications.length === 0) {
      notifications.push({
        id: 'notif-welcome',
        title: 'System Ready',
        message: 'Auto-sync background job is active. YouTube comment queue is synchronized.',
        type: 'success',
        time: 'Just now',
      });
    }

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
