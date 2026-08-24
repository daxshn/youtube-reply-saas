import { CommentTone } from '../types';

export function detectCommentTone(commentText: string): CommentTone {
  const text = commentText.toLowerCase();

  // Questions
  if (text.includes('?') || text.startsWith('how') || text.startsWith('what') || text.startsWith('why') || text.startsWith('can') || text.startsWith('where')) {
    return 'question';
  }

  // Funny / Memes
  if (text.includes('lol') || text.includes('lmao') || text.includes('haha') || text.includes('bro') || text.includes('funny') || text.includes('😂') || text.includes('💀')) {
    return 'funny';
  }

  // Criticism / Issue reports / Haters
  if (text.includes('issue') || text.includes('error') || text.includes('bug') || text.includes('wrong') || text.includes('bad') || text.includes('slow') || text.includes('problem') || text.includes('hate') || text.includes('trash') || text.includes('fake')) {
    return 'criticism';
  }

  // Positive
  if (text.includes('great') || text.includes('awesome') || text.includes('love') || text.includes('amazing') || text.includes('best') || text.includes('helpful') || text.includes('thank') || text.includes('sub')) {
    return 'positive';
  }

  return 'neutral';
}

export function detectVideoNiche(videoTitle: string): { niche: string; nicheTone: string } {
  const title = videoTitle.toLowerCase();

  if (title.includes('dexter') || title.includes('thriller') || title.includes('mystery') || title.includes('crime')) {
    return { niche: 'Thriller / Mystery', nicheTone: 'engaging, suspenseful, and sharp' };
  }
  if (title.includes('breaking bad') || title.includes('movie') || title.includes('cinema') || title.includes('film')) {
    return { niche: 'Cinematic Drama', nicheTone: 'thoughtful, analytical, and cinematic' };
  }
  if (title.includes('code') || title.includes('next.js') || title.includes('tech') || title.includes('react') || title.includes('software')) {
    return { niche: 'Technology & Software', nicheTone: 'informative, precise, and encouraging' };
  }
  if (title.includes('game') || title.includes('gaming') || title.includes('stream') || title.includes('playstation')) {
    return { niche: 'Gaming', nicheTone: 'energetic, casual, and fun' };
  }
  if (title.includes('ai') || title.includes('openai') || title.includes('gpt') || title.includes('agent')) {
    return { niche: 'Artificial Intelligence', nicheTone: 'modern, forward-thinking, and insightful' };
  }

  return { niche: 'General Content', nicheTone: 'conversational and warm' };
}

export function isCommentSpam(commentText: string): boolean {
  const text = commentText.toLowerCase();

  const spamKeywords = [
    'whatsapp', 'telegram', 'crypto', 'bitcoin', 'investment', 'free money',
    'guaranteed return', 'trade with', 'dm me', 'click link', 'subs for subs',
    '+1', 'vipsignals', 'profit', 'manager', 't.me'
  ];

  let matches = 0;
  for (const keyword of spamKeywords) {
    if (text.includes(keyword)) {
      matches++;
    }
  }

  const hasPhonePattern = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/.test(commentText);
  return matches >= 2 || (matches >= 1 && hasPhonePattern);
}

/**
 * Calculates word overlap / Jaccard similarity percentage between two strings.
 * Returns a score between 0.0 and 1.0 (1.0 = identical).
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(Boolean));
  const words2 = new Set(text2.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(Boolean));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });

  const union = new Set([...Array.from(words1), ...Array.from(words2)]).size;
  return intersection / union;
}

export function constructAIReplyPrompt({
  videoTitle,
  commentAuthor,
  commentText,
  tone,
  personalityStyle = 'Creator Mode',
  customSystemPrompt,
  replyLength = '1-3 sentences',
  previousReplies = [],
}: {
  videoTitle: string;
  commentAuthor: string;
  commentText: string;
  tone: CommentTone;
  personalityStyle?: string;
  customSystemPrompt?: string;
  replyLength?: string;
  previousReplies?: string[];
}): { systemPrompt: string; userPrompt: string } {

  const { niche, nicheTone } = detectVideoNiche(videoTitle);

  const toneGuidanceMap: Record<CommentTone, string> = {
    positive: 'Warm, appreciative, encouraging, and welcoming.',
    question: 'Helpful, clear, informative, and direct.',
    criticism: 'Respectful, calm, constructive, and professional. Never argue.',
    funny: 'Playful, witty, humorous, and light-hearted.',
    neutral: 'Friendly, conversational, and polite.',
  };

  const toneInstruction = toneGuidanceMap[tone] || toneGuidanceMap.neutral;

  const personalityGuidance: Record<string, string> = {
    'Friendly': 'Warm, approachable, and highly personable.',
    'Professional': 'Polite, clear, concise, and structured.',
    'Funny': 'Witty, humorous, and engaging.',
    'Minimal': 'Short, direct, and under 15 words.',
    'Enthusiastic': 'High energy, passionate, and excited.',
    'Educational': 'Informative, insightful, and value-adding.',
    'Creator Mode': 'Authentic YouTube creator persona.',
  };

  const selectedPersonality = personalityGuidance[personalityStyle] || personalityGuidance['Creator Mode'];

  const defaultBasePrompt = customSystemPrompt || 
    `You are an authentic YouTube content creator replying to audience comments on your channel.`;

  const systemPrompt = `
${defaultBasePrompt}

CONTEXTUAL GUIDELINES:
- Video Topic Niche: ${niche} (${nicheTone})
- Persona Style: ${personalityStyle} (${selectedPersonality})
- Comment Sentiment Tone: ${toneInstruction}

STRICT REPLY RULES:
1. Speak in natural, modern American English.
2. Sound genuine and human—NEVER robotic, generic, or formulaic.
3. Keep the reply strictly between ${replyLength}.
4. Do NOT use cliché phrases like "Thanks for watching!", "Great video!", or repetitive templates.
5. Do NOT use emojis unless strictly appropriate to tone.
6. Write fluid conversational text (no bullet points or markdown headings).
`.trim();

  let userPrompt = `
Video Title: "${videoTitle}"
Comment Author: ${commentAuthor}
User Comment: "${commentText}"
Detected Tone: ${tone}
`;

  if (previousReplies.length > 0) {
    userPrompt += `\nPreviously generated replies (DO NOT REPEAT ANY OF THESE):
${previousReplies.map((r, i) => `${i + 1}. "${r}"`).join('\n')}
`;
  }

  userPrompt += `\nGenerate a fresh, unique reply to ${commentAuthor}:`;

  return { systemPrompt, userPrompt };
}
