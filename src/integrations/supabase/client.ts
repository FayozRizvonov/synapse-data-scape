import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Supabase connection settings.
 *
 * Read from the environment so the app can be pointed at another Supabase
 * instance (staging, a client tenant) without a code change. The defaults keep
 * local dev and existing deploys working when the variables are not set —
 * previously these were hardcoded, so no amount of Vercel configuration could
 * change which key the deployed bundle used.
 *
 * The publishable key is public by design: it is compiled into the browser
 * bundle and is only useful together with Row Level Security. Never put the
 * secret key (`sb_secret_…`) or the legacy service-role key in this file.
 */
const fromEnv = (value: unknown): string | undefined => {
  const s = typeof value === 'string' ? value.trim() : '';
  return s.length > 0 ? s : undefined;
};

export const SUPABASE_URL =
  fromEnv(import.meta.env.VITE_SUPABASE_URL) ??
  'https://thpnkluejymycxmiavjp.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  fromEnv(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) ??
  'sb_publishable_RZ_1d-ZsaNoiXP2iWlb7XA_YiQx1LyM';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
