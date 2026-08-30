import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl) {
    console.error('[Supabase Admin Error] SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL environment variable is missing.');
    throw new Error('Supabase Configuration Error: SUPABASE_URL is missing.');
  }

  if (!serviceRoleKey) {
    console.error('[Supabase Admin Error] SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_ROLE environment variable is missing.');
    throw new Error('Supabase Configuration Error: SUPABASE_SERVICE_ROLE_KEY is missing.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

