#!/usr/bin/env node
/**
 * Regenerate src/data/pharmaSmFallback.ts from the live `get_pharma_sm_metrics_merged`.
 *
 *   node scripts/generate-pharma-sm-fallback.mjs
 *
 * The fallback exists so a Supabase blip during a client demo shows correct figures
 * instead of an error panel. It is GENERATED, never hand-edited: a hand-maintained copy of
 * reconciled numbers is exactly what produced the $20.8M-vs-$21.3M split this replaced.
 *
 * Re-run it whenever the function or its inputs change, and commit the result. The script
 * refuses to write a snapshot that fails the identities the cards are supposed to satisfy,
 * so a broken function cannot be baked into the bundle.
 *
 * Credentials: SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY from the environment, else the
 * literals in src/integrations/supabase/client.ts. The publishable key is public by design
 * (it ships in the bundle), so this needs no secret.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const CLIENT = 'src/integrations/supabase/client.ts';
const OUT = 'src/data/pharmaSmFallback.ts';

function fromClientFile(re) {
  const m = readFileSync(CLIENT, 'utf8').match(re);
  return m?.[0] ?? null;
}

const url =
  process.env.SUPABASE_URL ?? fromClientFile(/https:\/\/[a-z0-9]+\.supabase\.co/);
const key =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? fromClientFile(/sb_publishable_[A-Za-z0-9_-]+/);

if (!url || !key) {
  console.error(`Could not resolve Supabase URL/key from env or ${CLIENT}`);
  process.exit(1);
}

const res = await fetch(`${url}/rest/v1/rpc/get_pharma_sm_metrics_merged`, {
  method: 'POST',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ p_company_id: null, p_brand_id: null }),
});

if (!res.ok) {
  console.error(`RPC failed: HTTP ${res.status} ${await res.text()}`);
  process.exit(1);
}

const rows = await res.json();
if (!Array.isArray(rows) || rows.length === 0) {
  console.error('RPC returned no rows; refusing to generate an empty fallback.');
  process.exit(1);
}

const cards = rows.sort((a, b) => a.sort_order - b.sort_order).map((r) => r.card);

// ---------------------------------------------------------------------------
// Refuse to bake in a snapshot that does not reconcile.
// ---------------------------------------------------------------------------
const money = (id) => {
  const c = cards.find((x) => x.id === id);
  if (!c) throw new Error(`card ${id} missing`);
  return Number(c.value.replace(/[$M]/g, ''));
};

const failures = [];
const total = money('total-sales');
const four = ['base-sales', 'seasonality', 'trend', 'incremental'].reduce(
  (s, id) => s + money(id),
  0,
);
if (Math.abs(four - total) > 0.005) {
  failures.push(`base+seasonality+trend+incremental = ${four.toFixed(2)}, total = ${total.toFixed(2)}`);
}

const chanSum = cards
  .filter((c) => c.id.startsWith('channel-'))
  .reduce((s, c) => s + Number(c.value.replace(/[$M]/g, '')), 0);
if (Math.abs(chanSum - money('incremental')) > 0.005) {
  failures.push(`channels = ${chanSum.toFixed(2)}, incremental = ${money('incremental').toFixed(2)}`);
}

const quarters = (cards.find((c) => c.id === 'total-sales')?.details?.breakdown ?? [])
  .filter((b) => /^Q\d Sales$/.test(b.label))
  .reduce((s, b) => s + Number(b.value.replace(/[$M]/g, '')), 0);
if (Math.abs(quarters - total) > 0.005) {
  failures.push(`quarters = ${quarters.toFixed(2)}, total = ${total.toFixed(2)}`);
}

for (const c of cards) {
  if (/\+-|\+\+|--/.test(c.change ?? '')) failures.push(`${c.id} has a malformed change "${c.change}"`);
}

if (failures.length) {
  console.error('Refusing to generate: the live function does not reconcile.');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

const header = `// GENERATED FILE -- DO NOT EDIT BY HAND.
//
// Regenerate with:  node scripts/generate-pharma-sm-fallback.mjs
//
// A snapshot of \`get_pharma_sm_metrics_merged\`, used only when that call fails. It exists so
// a Supabase blip during a client demo renders correct figures rather than an error panel.
//
// It is generated, not written, because a hand-maintained copy of reconciled numbers is
// precisely what produced the defect this whole path replaced: the assistant reporting a
// $20.8M total with a $39.5M quarterly breakdown beside a dashboard showing $21.3M. The
// generator asserts the identities below before writing, so a snapshot that does not add up
// cannot reach the bundle.
//
// Snapshot taken: ${new Date().toISOString().slice(0, 10)}
// Verified at generation time:
//   base + seasonality + trend + incremental = ${four.toFixed(2)} = total ${total.toFixed(2)}
//   channel contributions                    = ${chanSum.toFixed(2)} = incremental
//   Q1..Q4                                   = ${quarters.toFixed(2)} = total
//
// Being a snapshot, it goes stale the moment the database changes. When it is used at
// runtime the hook logs a warning, so a silent fallback cannot masquerade as live data.

import type { MetricCard } from '@/data/metricsKnowledgeBase';

export const PHARMA_SM_FALLBACK_SNAPSHOT_DATE = '${new Date().toISOString().slice(0, 10)}';

export const pharmaSmFallbackCards: MetricCard[] = `;

writeFileSync(OUT, header + JSON.stringify(cards, null, 2) + ';\n');
console.log(`Wrote ${OUT} with ${cards.length} cards.`);
console.log(`  base+seasonality+trend+incremental = ${four.toFixed(2)} = total ${total.toFixed(2)}`);
console.log(`  channels = ${chanSum.toFixed(2)} = incremental`);
console.log(`  quarters = ${quarters.toFixed(2)} = total`);
