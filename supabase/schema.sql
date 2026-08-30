-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reply_status') THEN
        CREATE TYPE reply_status AS ENUM ('pending','approved','rejected','posted','failed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_type') THEN
        CREATE TYPE action_type AS ENUM ('generated','edited','approved','posted','rejected','regenerated','failed_attempt');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comment_tone') THEN
        CREATE TYPE comment_tone AS ENUM ('positive','question','criticism','funny','neutral');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    UNIQUE(youtube_account_id,youtube_video_id)
);

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

CREATE TABLE IF NOT EXISTS public.generated_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    reply_text TEXT NOT NULL,
    prompt_used TEXT,
    model_used TEXT DEFAULT 'gpt-4o-mini',
    tone comment_tone DEFAULT 'positive',
    temperature NUMERIC(3,2) DEFAULT 0.70,
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    openai_api_key TEXT,
    openai_base_url TEXT DEFAULT 'https://api.openai.com/v1',
    openai_model TEXT DEFAULT 'gpt-4o-mini',
    custom_prompt TEXT DEFAULT 'You are a warm, helpful, engaging YouTube content creator replying to comments.',
    temperature NUMERIC(3,2) DEFAULT 0.70,
    max_tokens INTEGER DEFAULT 150,
    reply_length TEXT DEFAULT '1-3 sentences',
    default_tone TEXT DEFAULT 'auto',
    auto_fetch_interval_minutes INTEGER DEFAULT 5,
    spam_filter_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);