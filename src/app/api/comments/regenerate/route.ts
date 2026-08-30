import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth-guard';
import { generateAIReply } from '@/lib/ai/openai';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const auth = await validateAdminSession();
    if (!auth.authorized) return auth.response!;

    const userId = (auth.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User ID missing from session.' }, { status: 401 });
    }

    const body = await req.json();
    const { commentId, commentText, commentAuthor, videoTitle, currentReplyText } = body;

    if (!commentId || !commentText) {
      return NextResponse.json({ error: 'Missing commentId or commentText' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let previousReplies: string[] = currentReplyText ? [currentReplyText] : [];
    let customPrompt: string | undefined;
    let userModel: string | undefined;
    let userApiKey: string | undefined;
    let userBaseUrl: string | undefined;
    let temperature: number | undefined;

    // Fetch user settings
    const { data: userSettings } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (userSettings) {
      customPrompt = userSettings.custom_prompt;
      userModel = userSettings.openai_model;
      userApiKey = userSettings.openai_api_key;
      userBaseUrl = userSettings.openai_base_url;
      temperature = userSettings.temperature;
    }

    // Fetch previous generations for this comment
    const { data: history } = await supabase
      .from('reply_history')
      .select('reply_text')
      .eq('comment_id', commentId)
      .not('reply_text', 'is', null);

    if (history) {
      previousReplies = Array.from(
        new Set([...previousReplies, ...history.map((h) => h.reply_text).filter(Boolean)])
      );
    }

    // Call AI generator with previousReplies exclusion list
    const aiResult = await generateAIReply({
      commentText,
      commentAuthor: commentAuthor || 'Viewer',
      videoTitle: videoTitle || '',
      userApiKey,
      userBaseUrl,
      userModel,
      customPrompt,
      temperature,
      previousReplies,
    });

    // Update DB generated reply
    await supabase
      .from('generated_replies')
      .update({
        reply_text: aiResult.replyText,
        model_used: aiResult.modelUsed,
        tone: aiResult.tone,
        updated_at: new Date().toISOString(),
      })
      .eq('comment_id', commentId);

    // Record in audit log
    await supabase.from('reply_history').insert({
      comment_id: commentId,
      action: 'regenerated',
      action_by: 'User Action',
      reply_text: aiResult.replyText,
    });

    return NextResponse.json({
      success: true,
      message: 'Generated new fresh AI reply.',
      commentId,
      newReply: {
        reply_text: aiResult.replyText,
        model_used: aiResult.modelUsed,
        tone: aiResult.tone,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
