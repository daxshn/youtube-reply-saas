import type { Metadata } from 'next';
import { AppProviders } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReplyStudio AI - YouTube Comment Reply SaaS',
  description: 'AI-powered YouTube comment reply approval workflow. Approve AI generated replies with 1-click from phone or desktop.',
  keywords: ['YouTube SaaS', 'AI Comment Reply', 'YouTube Data API', 'Next.js 15', 'Supabase'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
