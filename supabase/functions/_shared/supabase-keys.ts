/**
 * Resolve Supabase API keys inside an Edge Function.
 *
 * Supabase is migrating from the legacy `anon` / `service_role` keys (JWTs
 * signed by the project JWT secret) to publishable / secret keys, which are
 * not JWTs and can be rotated independently.
 *
 * The platform injects both generations into the function environment:
 *
 *   legacy : SUPABASE_ANON_KEY          "eyJhbGciOi…"      (plain string)
 *            SUPABASE_SERVICE_ROLE_KEY  "eyJhbGciOi…"      (plain string)
 *   new    : SUPABASE_PUBLISHABLE_KEYS  {"default":"sb_publishable_…"}  (JSON)
 *            SUPABASE_SECRET_KEYS       {"default":"sb_secret_…"}       (JSON)
 *
 * Note the new variables are JSON dictionaries keyed by key name, so a project
 * can run several keys and rotate them one at a time. `default` is the key
 * created by the dashboard's initial migration.
 *
 * These helpers prefer the new keys and fall back to the legacy ones, so the
 * same code works both before and after the legacy keys are deactivated —
 * no flag day, and deactivation stays reversible.
 */

function readKeyDict(varName: string, keyName = 'default'): string | undefined {
  const raw = Deno.env.get(varName);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const value = parsed?.[keyName];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  } catch {
    // A malformed value should not take the function down; fall back instead.
    console.warn(`[supabase-keys] ${varName} is not valid JSON; using the legacy key`);
    return undefined;
  }
}

/** Low-privilege key for user-scoped clients. Respects Row Level Security. */
export function getPublishableKey(keyName = 'default'): string | undefined {
  return readKeyDict('SUPABASE_PUBLISHABLE_KEYS', keyName) ??
    Deno.env.get('SUPABASE_ANON_KEY');
}

/** Full-access key for admin clients. Bypasses RLS — never expose to a browser. */
export function getSecretKey(keyName = 'default'): string | undefined {
  return readKeyDict('SUPABASE_SECRET_KEYS', keyName) ??
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
}

/** Which generation is in use — logged at startup to make revocation verifiable. */
export function keyGeneration(): 'new' | 'legacy' | 'none' {
  if (readKeyDict('SUPABASE_SECRET_KEYS') || readKeyDict('SUPABASE_PUBLISHABLE_KEYS')) return 'new';
  if (Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) return 'legacy';
  return 'none';
}
