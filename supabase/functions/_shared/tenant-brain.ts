// deno-lint-ignore-file
// Shared helpers for Edge Functions: resolve tenant + load Company Brain (RLS-safe with user JWT)
// @ts-expect-error - SupabaseClient from remote import
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getCompanyIdForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("company_members lookup:", error.message);
    return null;
  }
  return (data as { company_id?: string } | null)?.company_id ?? null;
}

export type BrainRow = {
  domain: string;
  title: string;
  content: string;
  status: string;
};

export async function fetchApprovedCompanyBrain(
  supabase: SupabaseClient,
  companyId: string,
  brandId?: string | null,
): Promise<BrainRow[]> {
  let q = supabase
    .from("company_brain_entries")
    .select("domain, title, content, status")
    .eq("company_id", companyId)
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(30);
  if (brandId) {
    q = q.eq("brand_id", brandId);
  }
  const { data, error } = await q;
  if (error) {
    console.warn("company_brain_entries:", error.message);
    return [];
  }
  return (data as BrainRow[]) || [];
}

export function formatBrainSystemMessage(rows: BrainRow[], maxChars = 8000): string {
  if (!rows.length) return "";
  const payload = JSON.stringify(rows);
  const body = payload.length > maxChars
    ? payload.slice(0, maxChars) + "…"
    : payload;
  return "COMPANY_BRAIN (approved organizational knowledge; JSON array). " +
    "Use when consistent with Pharma SM and label conflicts explicitly.\n" +
    body;
}

/** RPC-backed Pharma S&M cards merged with global defaults (RLS + JWT). */
export async function fetchPharmaSmMetricsMergedRows(
  supabase: SupabaseClient,
  companyId: string | null,
  brandId: string | null,
): Promise<Array<{ metric_key: string; card: Record<string, unknown>; sort_order: number }>> {
  const { data, error } = await supabase.rpc("get_pharma_sm_metrics_merged", {
    p_company_id: companyId,
    p_brand_id: brandId,
  });
  if (error) {
    console.warn("get_pharma_sm_metrics_merged:", error.message);
    return [];
  }
  const rows = (data as Array<{ metric_key: string; card: Record<string, unknown>; sort_order: number }> | null) ||
    [];
  return rows.sort((a, b) => a.sort_order - b.sort_order);
}

/** Compact shape for PHARMA_SM_DATASET system messages (matches client kb payload). */
export function pharmaMergedRowsToCompactKb(
  rows: Array<{ card: Record<string, unknown> }>,
): unknown[] {
  return rows.map(({ card: c }) => ({
    id: c.id,
    title: c.title,
    value: c.value,
    change: c.change,
    changeType: c.changeType,
    comparison: c.comparison,
    description: c.description,
    details: c.details,
    chartData: c.chartData,
    keywords: c.keywords,
    category: c.category,
  }));
}
