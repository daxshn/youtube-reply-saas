import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getSupabaseAdmin } from './supabase/admin';
import { fetchAndStoreChannelDetailsAndVideos } from './youtube/client';

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
      const userEmail = user?.email?.toLowerCase();

      console.log(`[Google Login Attempt] Authenticating email: ${userEmail}`);

      if (adminEmail && userEmail) {
        if (userEmail !== adminEmail.toLowerCase()) {
          console.error(`[Access Denied] Unauthorized login attempt blocked for: ${userEmail}. Only ADMIN_EMAIL (${adminEmail}) is allowed.`);
          return false; // Triggers NextAuth AccessDenied error
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      const adminEmail = process.env.ADMIN_EMAIL;

      // Extract details from profile or token
      if (profile) {
        token.email = profile.email || token.email;
        token.name = profile.name || token.name;
        token.picture = (profile as any).picture || token.picture;
      }

      if (adminEmail && token.email && token.email.toLowerCase() !== adminEmail.toLowerCase()) {
        console.error(`[JWT Block] Invalid user email ${token.email} cleared from token.`);
        return {}; // Clear invalid token
      }

      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        console.log(`[NextAuth JWT] Successfully received Google OAuth tokens for ${token.email}`);

        // Sync user & YouTube tokens to Supabase
        if (token.email) {
          try {
            const supabase = getSupabaseAdmin();
            console.log(`[Supabase User Sync] Upserting user email=${token.email}...`);

            const { data: user, error: userErr } = await supabase
              .from('users')
              .upsert({
                email: token.email,
                name: token.name || profile.name || 'Creator',
                avatar_url: token.picture || (profile as any).picture || null,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'email' })
              .select()
              .single();

            if (userErr || !user) {
              console.error('[Supabase User Sync Error] Failed upserting user:', userErr);
              throw new Error(`Failed to upsert user: ${userErr?.message}`);
            }

            token.sub = user.id; // Store Supabase user UUID in token.sub!
            console.log(`[Supabase User Sync Success] User ID: ${user.id} (${user.email})`);

            if (account.access_token) {
              console.log(`[YouTube Sync] Triggering automatic channel & video sync for user ${user.id}...`);
              await fetchAndStoreChannelDetailsAndVideos(user.id, {
                access_token: account.access_token,
                refresh_token: account.refresh_token || '',
                expires_at: account.expires_at,
              });
              console.log(`[YouTube Sync Success] Automatic channel & video sync completed for user ${user.id}`);
            }
          } catch (err: any) {
            console.error('[Google OAuth Sync Error] Exception during user & YouTube sync:', err?.message || err);
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
        (session.user as any).id = token.sub || token.id;
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
