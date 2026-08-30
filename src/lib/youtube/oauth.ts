import { google } from 'googleapis';
import { getSupabaseAdmin } from '../supabase/admin';

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    console.error('[Google OAuth Config Error] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getYouTubeAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ],
  });
}

/**
 * Gets a valid YouTube API client for a user.
 * Automatically refreshes expired OAuth tokens if necessary.
 */
export async function getValidYouTubeClient(userId: string) {
  const supabase = getSupabaseAdmin();

  // Retrieve YouTube account details for user
  const { data: account, error } = await supabase
    .from('youtube_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error(`[YouTube OAuth Query Error] Failed to fetch youtube_account for user_id=${userId}:`, error);
    throw new Error(`Supabase query error: ${error.message}`);
  }

  if (!account) {
    console.error(`[YouTube OAuth Error] No active YouTube account found in DB for user_id=${userId}`);
    throw new Error(`No active YouTube account found for user: ${userId}`);
  }

  let accessToken = account.access_token;
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  const now = Date.now();

  // If token expires in less than 5 minutes or is expired, refresh it automatically!
  if (!accessToken || expiresAt - now < 5 * 60 * 1000) {
    console.log(`[YouTube OAuth] Refreshing access token for user_id=${userId}, account_id=${account.id}...`);
    try {
      if (!account.refresh_token) {
        throw new Error('Refresh token is missing from YouTube account record');
      }
      const refreshedToken = await refreshGoogleToken(account.refresh_token);
      if (refreshedToken && refreshedToken.access_token) {
        accessToken = refreshedToken.access_token;
        const newExpiry = new Date(Date.now() + refreshedToken.expires_in * 1000).toISOString();

        // Update database with refreshed token
        const { error: updateErr } = await supabase
          .from('youtube_accounts')
          .update({
            access_token: accessToken,
            token_expires_at: newExpiry,
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id);

        if (updateErr) {
          console.error('[YouTube OAuth DB Error] Failed to save refreshed token:', updateErr);
        } else {
          console.log(`[YouTube OAuth Success] Refreshed access token saved successfully for user_id=${userId}`);
        }
      }
    } catch (err: any) {
      console.error('[YouTube OAuth Refresh Error] Exception refreshing token:', err?.message || err);
      throw new Error(`Failed to refresh Google OAuth token: ${err?.message || 'Unknown error'}`);
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

  if (!clientId || !clientSecret) {
    console.error('[Google OAuth Config Error] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in refreshGoogleToken');
    throw new Error('Missing Google OAuth environment variables');
  }

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
    const errorBody = await response.text();
    console.error('[Google OAuth API Error] Token refresh HTTP request failed:', response.status, errorBody);
    throw new Error(`Token refresh HTTP request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token as string,
    expires_in: data.expires_in as number, // seconds
  };
}

