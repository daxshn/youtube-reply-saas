import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getSupabaseAdmin } from './supabase/admin';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder-google-client-secret',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/youtube.force-ssl',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && user.email) {
        if (user.email.toLowerCase() !== adminEmail.toLowerCase()) {
          console.warn(`[Access Denied] Unauthorized login attempt blocked for: ${user.email}`);
          return false; // Triggers NextAuth AccessDenied error
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && token.email && token.email.toLowerCase() !== adminEmail.toLowerCase()) {
        return {}; // Clear invalid token
      }

      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        
        // Sync user & tokens to Supabase if connected
        const supabase = getSupabaseAdmin();
        if (supabase && token.email) {
          try {
            // Upsert User
            const { data: user } = await supabase
              .from('users')
              .upsert({
                email: token.email,
                name: token.name || profile.name || 'Creator',
                avatar_url: token.picture || (profile as any).picture || null,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'email' })
              .select()
              .single();

            if (user && account.access_token) {
              const expiresAtDate = account.expires_at 
                ? new Date(account.expires_at * 1000).toISOString()
                : new Date(Date.now() + 3600 * 1000).toISOString();

              // Get existing refresh token if not in this callback
              let refreshToken = account.refresh_token;
              if (!refreshToken) {
                const { data: existingAcc } = await supabase
                  .from('youtube_accounts')
                  .select('refresh_token')
                  .eq('user_id', user.id)
                  .maybeSingle();
                refreshToken = existingAcc?.refresh_token;
              }

              // Upsert YouTube Account entry if we have a refresh token
              if (refreshToken) {
                await supabase.from('youtube_accounts').upsert({
                  user_id: user.id,
                  channel_id: (profile as any).sub || user.id,
                  channel_title: user.name || 'YouTube Creator',
                  channel_avatar: user.avatar_url,
                  access_token: account.access_token,
                  refresh_token: refreshToken,
                  token_expires_at: expiresAtDate,
                  is_active: true,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'channel_id' });
              }
            }
          } catch (err) {
            console.error('Error syncing Google OAuth user to Supabase:', err);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && session.user?.email && session.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
        return {} as any;
      }
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET || 'super-secret-nextauth-key-change-in-prod',
};
