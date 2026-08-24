-- YouTube Comment Reply SaaS - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to initialize the database structure.

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types
CREATE TYPE reply_status AS ENUM ('pending', 'approved', 'rejected', 'posted', 'failed');
CREATE TYPE action_type AS ENUM ('generated', 'edited', 'approved', 'posted', 'rejected', 'regenerated', 'failed_attempt');
CREATE TYPE comment_tone AS ENUM ('positive', 'question', 'criticism', 'funny', 'neutral');

-- 1. Users Table (Maps to Supabase Auth or NextAuth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. YouTube Accounts Table (Stores OAuth Tokens)
CREATE TABLE IF NOT EXISTS public.youtube_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  channel_id TEXT UNIQUE NOT NULL,
  channel_title TEXT NOT NULL,
  channel_avatar TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Videos Table
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_account_id UUID REFERENCES public.youtube_accounts(id) ON DELETE CASCADE NOT NULL,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(youtube_account_id, youtube_video_id)
);

-- 4. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_account_id UUID REFERENCES public.youtube_accounts(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  youtube_comment_id TEXT UNIQUE NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  author_channel_url TEXT,
  comment_text TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  reply_status reply_status DEFAULT 'pending',
  detected_tone comment_tone DEFAULT 'neutral',
  is_spam BOOLEAN DEFAULT FALSE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Generated Replies Table
CREATE TABLE IF NOT EXISTS public.generated_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  reply_text TEXT NOT NULL,
  prompt_used TEXT,
  model_used TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  tone comment_tone DEFAULT 'positive',
  temperature NUMERIC(3,2) DEFAULT 0.70,
  is_approved BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Reply History (Audit Trail)
CREATE TABLE IF NOT EXISTS public.reply_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  action action_type NOT NULL,
  action_by TEXT DEFAULT 'user',
  reply_text TEXT,
  youtube_reply_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. User Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  openai_api_key TEXT,
  openai_base_url TEXT DEFAULT 'https://api.openai.com/v1',
  openai_model TEXT DEFAULT 'gpt-4o-mini',
  custom_prompt TEXT DEFAULT 'You are a warm, helpful, engaging YouTube content creator replying to comments on your video. Sound natural, friendly, non-robotic, and strictly 1 to 3 sentences.',
  temperature NUMERIC(3,2) DEFAULT 0.70,
  max_tokens INTEGER DEFAULT 150,
  reply_length TEXT DEFAULT '1-3 sentences',
  default_tone TEXT DEFAULT 'auto',
  auto_fetch_interval_minutes INTEGER DEFAULT 5,
  spam_filter_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance Optimization
CREATE INDEX IF NOT EXISTS idx_comments_youtube_account ON public.comments(youtube_account_id);
CREATE INDEX IF NOT EXISTS idx_comments_video ON public.comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(reply_status);
CREATE INDEX IF NOT EXISTS idx_comments_published ON public.comments(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_replies_comment ON public.generated_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_reply_history_comment ON public.reply_history(comment_id);
CREATE INDEX IF NOT EXISTS idx_youtube_accounts_user ON public.youtube_accounts(user_id);

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at Triggers
CREATE TRIGGER trg_update_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_youtube_accounts BEFORE UPDATE ON public.youtube_accounts FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_videos BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_comments BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_generated_replies BEFORE UPDATE ON public.generated_replies FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_settings BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Service Role policies (Bypass for API backend) & Authenticated User Policies
CREATE POLICY "Users can manage own record" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own youtube accounts" ON public.youtube_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own settings" ON public.settings FOR ALL USING (auth.uid() = user_id);
