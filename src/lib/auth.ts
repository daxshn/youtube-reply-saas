import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getSupabaseAdmin } from './supabase/admin';
import { fetchAndStoreChannelDetailsAndVideos } from './youtube/client';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    async signIn({ user, profile }) {
      const rawAdminEmail = process.env.ADMIN_EMAIL;
      const adminEmail = rawAdminEmail ? rawAdminEmail.replace(/['"]/g, '').trim().toLowerCase() : null;
      
      const rawUserEmail = user?.email || (profile as any)?.email;
      const userEmail = rawUserEmail ? rawUserEmail.trim().toLowerCase() : null;

      console.log(`[Google Login Attempt] Authenticating userEmail: "${userEmail}", configured adminEmail: "${adminEmail}"`);

      if (adminEmail) {
        if (!userEmail || userEmail !== adminEmail) {
          console.error(`[Access Denied] Unauthorized login attempt blocked for: "${userEmail}". Only ADMIN_EMAIL ("${adminEmail}") is allowed.`);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, profile, user }) {
      console.log(`\n--- [JWT CALLBACK START] ---`);
      console.log(`JWT BEFORE: ${token.sub}`);
      console.log(`GOOGLE PROFILE SUB: ${profile?.sub || (profile as any)?.id || 'N/A'}`);
      console.log(`GOOGLE ACCOUNT ID: ${account?.providerAccountId || 'N/A'}`);

      // Extract email & details
      if (profile) {
        token.email = profile.email || (profile as any).email || user?.email || token.email;
        token.name = profile.name || user?.name || token.name;
        token.picture = (profile as any).picture || user?.image || token.picture;
      } else if (user) {
        token.email = user.email || token.email;
        token.name = user.name || token.name;
        token.picture = user.image || token.picture;
      }

      if (account && (profile || user)) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      // Upsert or retrieve user UUID from Supabase
      if (token.email) {
        try {
          const supabase = getSupabaseAdmin();
          console.log("TOKEN EMAIL:", token.email);

          const { data: dbUser, error } = await supabase
            .from("users")
            .upsert(
              {
                email: token.email,
                name: token.name,
                avatar_url: token.picture,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "email",
              }
            )
            .select()
            .single();

          console.log("DB USER =", dbUser);
          console.log("DB ERROR =", error);

          if (error || !dbUser) {
            console.error('[Supabase User Sync Error] Failed upserting user:', error);
            throw new Error(`Failed to upsert user: ${error?.message}`);
          }

          // Enforce Supabase UUID in token.sub!
          token.sub = dbUser.id;
          console.log(`SUPABASE USER: ${dbUser.id}`);

          if (account && account.access_token) {
            console.log(`[YouTube Sync] Triggering automatic channel & video sync for user ${dbUser.id}...`);
            await fetchAndStoreChannelDetailsAndVideos(dbUser.id, {
              access_token: account.access_token,
              refresh_token: account.refresh_token || '',
              expires_at: account.expires_at,
            });
            console.log(`[YouTube Sync Success] Automatic channel & video sync completed for user ${dbUser.id}`);
          }
        } catch (err: any) {
          console.error('[Google OAuth Sync Error] Exception during user & YouTube sync:', err?.message || err);
        }
      }

      // Safeguard: Ensure token.sub is ALWAYS a valid Supabase UUID
      if (token.sub && !UUID_REGEX.test(token.sub) && token.email) {
        console.warn(`[JWT Warning] token.sub ("${token.sub}") is not a valid UUID. Querying Supabase for user UUID...`);
        try {
          const supabase = getSupabaseAdmin();
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', token.email)
            .maybeSingle();

          if (existingUser?.id) {
            token.sub = existingUser.id;
          }
        } catch (err) {
          console.error('[JWT Error] Failed resolving user UUID:', err);
        }
      }

      console.log(`JWT AFTER: ${token.sub}`);
      console.log(`--- [JWT CALLBACK END] ---\n`);

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Enforce session.user.id is strictly equal to token.sub (Supabase UUID)
        (session.user as any).id = token.sub;
        (session.user as any).accessToken = token.accessToken;
      }
      console.log(`SESSION: ${(session.user as any)?.id}`);
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET || 'super-secret-nextauth-key-change-in-prod',
};
