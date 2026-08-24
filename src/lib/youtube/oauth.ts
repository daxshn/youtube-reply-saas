import { google } from 'googleapis';
import { getSupabaseAdmin } from '../supabase/admin';

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getYouTubeAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
}

/**
 * Gets a valid YouTube API client for a user.
 * Automatically refreshes expired OAuth tokens if necessary.
 */
export async function getValidYouTubeClient(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // Retrieve YouTube account details for user
  const { data: account, error } = await supabase
    .from('youtube_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error || !account) {
    return null;
  }

  let accessToken = account.access_token;
  const expiresAt = new Date(account.token_expires_at).getTime();
  const now = Date.now();

  // If token expires in less than 5 minutes, refresh it automatically!
  if (expiresAt - now < 5 * 60 * 1000) {
    try {
      const refreshedToken = await refreshGoogleToken(account.refresh_token);
      if (refreshedToken && refreshedToken.access_token) {
        accessToken = refreshedToken.access_token;
        const newExpiry = new Date(Date.now() + refreshedToken.expires_in * 1000).toISOString();

        // Update database with refreshed token
        await supabase
          .from('youtube_accounts')
          .update({
            access_token: accessToken,
            token_expires_at: newExpiry,
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id);
      }
    } catch (err) {
      console.error('Error refreshing Google OAuth token:', err);
    }
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: account.refresh_token,
  });

  return {
    youtube: google.youtube({ version: 'v3', auth: oauth2Client }),
    account,
  };
}

async function refreshGoogleToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token as string,
    expires_in: data.expires_in as number, // seconds
  };
}
