# YouTube Comment Reply SaaS - Deployment & Setup Guide

This guide walks you through deploying **ReplyStudio AI** to Vercel with Google OAuth, YouTube Data API v3, Supabase Database, and OpenAI Compatible API integration.

---

## 1. Supabase Database Setup

1. Create a free project at [Supabase](https://supabase.com).
2. Open your Supabase Dashboard and go to **SQL Editor**.
3. Open `supabase/schema.sql` from this repository.
4. Paste the entire SQL schema into the editor and click **Run**.
5. Copy your **Supabase URL**, **Anon Key**, and **Service Role Key** from **Project Settings → API**.

---

## 2. Google Cloud Platform & YouTube Data API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project named `ReplyStudio SaaS`.
3. Go to **APIs & Services → Library**, search for **YouTube Data API v3**, and click **Enable**.
4. Go to **OAuth Consent Screen**:
   - User Type: External.
   - App Name: `ReplyStudio AI`.
   - Add Scopes:
     - `https://www.googleapis.com/auth/youtube.force-ssl`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
5. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**:
   - Application Type: Web application.
   - Authorized JavaScript Origins: `https://your-app.vercel.app` (and `http://localhost:3000` for dev).
   - Authorized Redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`.
6. Copy the **Client ID** and **Client Secret**.

---

## 3. Vercel Deployment

1. Push this codebase to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel](https://vercel.com) and click **Add New → Project**.
3. Import your repository.
4. Add the following **Environment Variables**:

| Variable Key | Description | Example Value |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` |
| `NEXTAUTH_URL` | Application URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Secret key for JWT session | `generate-random-secret-key` |
| `SUPABASE_URL` | Supabase Project URL | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Public Anon Key | `eyJhb...` |
| `SUPABASE_SERVICE_ROLE` | Supabase Admin Service Key | `eyJhb...` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-proj-xxx` |
| `OPENAI_BASE_URL` | OpenAI API Endpoint | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | AI Model Name | `gpt-4o-mini` |

5. Click **Deploy**. Vercel will build and launch your application automatically!

---

## 4. Local Development Quickstart

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open `http://localhost:3000` in your browser or phone on local network to test the approval queue!
