import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Supabase connection settings.
 *
 * The literal defaults are what actually ship: Vercel has no `.env` (it is
 * gitignored), so `import.meta.env.VITE_*` is undefined there and the value
 * after `||` is what ends up in the bundle. Setting the variables in Vercel
 * overrides them, which is how you would point a deploy at another project.
 *
 * Keep this as a direct `import.meta.env.X || 'literal'`. An earlier version
 * routed it through a small `fromEnv()` helper; because that helper was only
 * ever called with an undefined argument, the optimiser folded it to "always
 * returns undefined" and then removed the `?? fallback` altogether, producing
 * `createClient(undefined, undefined)` and a blank page in production. The
 * inline form survives because Vite substitutes `undefined` and
 * `undefined || 'literal'` collapses to the literal.
 *
 * The publishable key is public by design: it is compiled into the browser
 * bundle and is only useful together with Row Level Security. Never put the
 * secret key (`sb_secret_…`) or the legacy service-role key in this file.
 */
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://thpnkluejymycxmiavjp.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_RZ_1d-ZsaNoiXP2iWlb7XA_YiQx1LyM';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
