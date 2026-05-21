import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  rollout_pct: number;
  company_ids: string[] | null;
}

/** Simple cache so we don't hit the DB on every render. */
const flagCache = new Map<string, boolean>();

/**
 * Deterministic rollout: stable hash of userId mod 100.
 * Same user always gets the same bucket, so the experience is consistent.
 */
function isInRollout(userId: string, pct: number): boolean {
  if (pct >= 100) return true;
  if (pct <= 0) return false;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return (hash % 100) < pct;
}

/**
 * Returns true if the feature flag is enabled for the current user.
 *
 * Resolution order:
 *   1. Flag must be `enabled = true`
 *   2. If `company_ids` is set, user's company must be in the list
 *   3. User must fall within `rollout_pct` bucket (deterministic by user_id)
 */
export function useFeatureFlag(flagKey: string): boolean {
  const { user, companyId } = useAuth();
  const cacheKey = `${flagKey}:${user?.id ?? 'anon'}`;

  const [isEnabled, setIsEnabled] = useState<boolean>(() => flagCache.get(cacheKey) ?? false);

  useEffect(() => {
    if (!user?.id) return;

    // Return cached value immediately, refresh in background
    if (flagCache.has(cacheKey)) {
      setIsEnabled(flagCache.get(cacheKey)!);
    }

    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('feature_flags')
          .select('key, enabled, rollout_pct, company_ids')
          .eq('key', flagKey)
          .maybeSingle();

        if (error || !data) {
          flagCache.set(cacheKey, false);
          setIsEnabled(false);
          return;
        }

        const flag = data as FeatureFlag;

        if (!flag.enabled) {
          flagCache.set(cacheKey, false);
          setIsEnabled(false);
          return;
        }

        // Company scope check
        if (flag.company_ids && flag.company_ids.length > 0) {
          if (!companyId || !flag.company_ids.includes(companyId)) {
            flagCache.set(cacheKey, false);
            setIsEnabled(false);
            return;
          }
        }

        // Rollout bucket check
        const result = isInRollout(user.id, flag.rollout_pct);
        flagCache.set(cacheKey, result);
        setIsEnabled(result);
      } catch (_) {
        // On any error, fall back to disabled (safe default)
        flagCache.set(cacheKey, false);
        setIsEnabled(false);
      }
    })();
  }, [flagKey, user?.id, companyId, cacheKey]);

  return isEnabled;
}

/** Invalidate the flag cache (call after admin changes a flag). */
export function invalidateFlagCache(): void {
  flagCache.clear();
}
