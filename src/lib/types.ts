// TypeScript definitions for YouTube Comment Reply SaaS

export type ReplyStatus = 'pending' | 'approved' | 'rejected' | 'posted' | 'failed';
export type CommentTone = 'positive' | 'question' | 'criticism' | 'funny' | 'neutral';
export type ActionType = 'generated' | 'edited' | 'approved' | 'posted' | 'rejected' | 'regenerated' | 'failed_attempt';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface YouTubeAccount {
  id: string;
  user_id: string;
  channel_id: string;
  channel_title: string;
  channel_avatar: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoItem {
  id: string;
  youtube_account_id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string | null;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface GeneratedReply {
  id: string;
  comment_id: string;
  reply_text: string;
  prompt_used: string | null;
  model_used: string;
  tone: CommentTone;
  temperature: number;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentItem {
  id: string;
  youtube_account_id: string;
  video_id: string;
  youtube_comment_id: string;
  author_name: string;
  author_avatar: string | null;
  author_channel_url: string | null;
  comment_text: string;
  published_at: string;
  reply_status: ReplyStatus;
  detected_tone: CommentTone;
  is_spam: boolean;
  is_duplicate: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  video?: VideoItem;
  generated_reply?: GeneratedReply | null;
}

export interface ReplyHistoryItem {
  id: string;
  comment_id: string;
  action: ActionType;
  action_by: string;
  reply_text: string | null;
  youtube_reply_id: string | null;
  error_message: string | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  openai_api_key: string | null;
  openai_base_url: string;
  openai_model: string;
  custom_prompt: string;
  temperature: number;
  max_tokens: number;
  reply_length: string;
  default_tone: string;
  auto_fetch_interval_minutes: number;
  spam_filter_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FilterOptions {
  search: string;
  status: ReplyStatus | 'all';
  tone: CommentTone | 'all';
  videoId: string | 'all';
  sort: 'newest' | 'oldest';
  page: number;
  limit: number;
}

export interface AnalyticsStats {
  total_comments: number;
  pending_count: number;
  approved_count: number;
  posted_count: number;
  rejected_count: number;
  response_rate: number;
  tone_distribution: {
    positive: number;
    question: number;
    criticism: number;
    funny: number;
    neutral: number;
  };
  top_videos: {
    video_id: string;
    title: string;
    comment_count: number;
    pending_count: number;
  }[];
}
