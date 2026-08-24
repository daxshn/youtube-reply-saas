import OpenAI from 'openai';
import { CommentTone } from '../types';
import { constructAIReplyPrompt, detectCommentTone, calculateSimilarity } from './prompt-generator';

export interface GenerateReplyOptions {
  commentText: string;
  commentAuthor: string;
  videoTitle: string;
  userApiKey?: string | null;
  userBaseUrl?: string | null;
  userModel?: string | null;
  customPrompt?: string | null;
  personalityStyle?: string;
  temperature?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  maxTokens?: number;
  replyLength?: string;
  previousReplies?: string[];
}

export async function generateAIReply({
  commentText,
  commentAuthor,
  videoTitle,
  userApiKey,
  userBaseUrl,
  userModel,
  customPrompt,
  personalityStyle = 'Creator Mode',
  temperature = 0.7,
  topP = 1.0,
  presencePenalty = 0.5,
  frequencyPenalty = 0.5,
  maxTokens = 150,
  replyLength = '1-3 sentences',
  previousReplies = [],
}: GenerateReplyOptions): Promise<{
  replyText: string;
  tone: CommentTone;
  modelUsed: string;
}> {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;
  const baseURL = userBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = userModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const tone = detectCommentTone(commentText);

  // Fallback mode if API key is not configured
  if (!apiKey) {
    const fallbackReply = generateFallbackReply(commentAuthor, commentText, tone);
    return {
      replyText: fallbackReply,
      tone,
      modelUsed: `${model} (Demo Mode)`,
    };
  }

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL,
    });

    const { systemPrompt, userPrompt } = constructAIReplyPrompt({
      videoTitle,
      commentAuthor,
      commentText,
      tone,
      personalityStyle,
      customSystemPrompt: customPrompt || undefined,
      replyLength,
      previousReplies,
    });

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      top_p: topP,
      presence_penalty: presencePenalty,
      frequency_penalty: frequencyPenalty,
      max_tokens: maxTokens,
    });

    let replyText = response.choices[0]?.message?.content?.trim() || generateFallbackReply(commentAuthor, commentText, tone);
    replyText = replyText.replace(/^["']|["']$/g, '');

    // Duplicate Protection: Check semantic similarity (>0.8 threshold) against previous replies
    for (const prev of previousReplies) {
      if (calculateSimilarity(replyText, prev) > 0.8) {
        // High similarity detected! Retry with slight variation & elevated temperature
        const retryRes = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: `${systemPrompt}\nIMPORTANT: Rephrase completely. Avoid any word overlap with: "${prev}"` },
            { role: 'user', content: userPrompt },
          ],
          temperature: Math.min(1.0, temperature + 0.2),
          max_tokens: maxTokens,
        });

        const retriedText = retryRes.choices[0]?.message?.content?.trim();
        if (retriedText) {
          replyText = retriedText.replace(/^["']|["']$/g, '');
        }
        break;
      }
    }

    return {
      replyText,
      tone,
      modelUsed: model,
    };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return {
      replyText: generateFallbackReply(commentAuthor, commentText, tone),
      tone,
      modelUsed: `${model} (Fallback)`,
    };
  }
}

function generateFallbackReply(author: string, commentText: string, tone: CommentTone): string {
  switch (tone) {
    case 'positive':
      return `Thanks so much ${author}! Really glad this was helpful for you.`;
    case 'question':
      return `Great point ${author}! Check the video description for links or ask if you need more details.`;
    case 'criticism':
      return `Appreciate the feedback ${author}. Will keep this in mind for the next video!`;
    case 'funny':
      return `Haha love this comment ${author}! Classic response.`;
    default:
      return `Thanks for commenting ${author}! Glad to have you in the community.`;
  }
}
