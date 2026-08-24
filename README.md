# ReplyStudio AI — YouTube Comment Reply SaaS 🚀

A production-ready, mobile-friendly AI-powered YouTube Comment Reply SaaS application built with **Next.js 15 App Router**, **TypeScript**, **TailwindCSS**, **Supabase Database**, **Google OAuth**, and **YouTube Data API v3**.

---

## 🔒 Primary Safety Rule

> **EVERYTHING REQUIRES MANUAL APPROVAL.**
> The system **NEVER** automatically posts replies to YouTube without explicit approval by the content creator.

---

## ✨ Features

- 📱 **Mobile & Desktop Dashboard**: Optimized for quick phone approval on the go.
- 🔑 **Google & YouTube OAuth Integration**: Store OAuth tokens securely in Supabase RLS and automatically refresh expired tokens before API calls.
- 📥 **Smart Comment Fetcher**:
  - Only fetches comments where the channel has not replied yet.
  - Ignores deleted, duplicate, or previously processed comments.
  - Automatic Spam Detection (WhatsApp/crypto bot filters).
- 🧠 **Tone-Matched AI Reply Engine**:
  - Configurable OpenAI Compatible API (`OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`).
  - Natural American English, human, non-robotic, non-repetitive, 1–3 sentences.
  - Matches comment tone: Warm (Positive), Helpful (Questions), Respectful (Criticism), Playful (Funny).
- ⚡ **Approval Actions**:
  - **Approve**: Immediately publishes reply to YouTube via `comments.insert` API and updates status to `posted`.
  - **Edit**: Refine AI text before approving.
  - **Reject**: Mark comment as rejected.
  - **Regenerate**: Trigger fresh AI response avoiding previous generations.
- ⚡ **Bonus Features**:
  - **Bulk Approve**, **Bulk Reject**, and **Bulk Regenerate**.
  - **Audit History Drawer**: Complete activity log per comment.
  - **Retry Failed Replies**.
  - **Channel Analytics & Comment Statistics**.
  - **Custom Settings**: Persona prompt editor, temperature slider, max tokens, tone selector.

---

## 🛠️ Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS v4, Lucide Icons
- **Backend**: Next.js API Routes, NextAuth, Google OAuth 2.0
- **Database**: Supabase PostgreSQL with RLS and automated updated_at triggers
- **APIs**: YouTube Data API v3, OpenAI Compatible API

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/youtube-reply-saas.git
cd youtube-reply-saas

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run the development server
npm run dev
```

Visit `http://localhost:3000` to open the application!

---

## 📄 License

MIT
