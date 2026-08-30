import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth-guard';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const DEFAULT_SETTINGS = {
  openai_api_key: '',
  openai_base_url: 'https://api.openai.com/v1',
  openai_model: 'gpt-4o-mini',
  custom_prompt: 'You are an AI assistant replying to YouTube comments for a tech creator. Keep replies concise (1-2 sentences), friendly, helpful, and engage with the viewer directly. Use natural American English.',
  temperature: 0.7,
  max_tokens: 150,
  reply_length: '1-3 sentences',
  default_tone: 'auto',
  auto_fetch_interval_minutes: 5,
  spam_filter_enabled: true,
};

export async function GET() {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const userId = (auth.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID missing in session' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Settings GET Error]', error);
    }

    if (settings) {
      return NextResponse.json({ success: true, settings });
    }

    return NextResponse.json({ success: true, settings: { ...DEFAULT_SETTINGS, user_id: userId } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const userId = (auth.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID missing in session' }, { status: 401 });
    }

    const body = await req.json();
    const supabase = getSupabaseAdmin();

    const { data: updated, error } = await supabase
      .from('settings')
      .upsert({
        user_id: userId,
        openai_api_key: body.openai_api_key || null,
        openai_base_url: body.openai_base_url || 'https://api.openai.com/v1',
        openai_model: body.openai_model || 'gpt-4o-mini',
        custom_prompt: body.custom_prompt || DEFAULT_SETTINGS.custom_prompt,
        temperature: parseFloat(body.temperature) || 0.7,
        max_tokens: parseInt(body.max_tokens) || 150,
        reply_length: body.reply_length || '1-3 sentences',
        default_tone: body.default_tone || 'auto',
        auto_fetch_interval_minutes: parseInt(body.auto_fetch_interval_minutes) || 5,
        spam_filter_enabled: body.spam_filter_enabled !== false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Settings saved successfully', settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
