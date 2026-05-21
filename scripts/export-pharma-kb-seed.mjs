/**
 * Reads metricsKnowledgeBase from TS and writes JSON for DB seeding.
 * Run: node scripts/export-pharma-kb-seed.mjs
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const mod = await import(join(root, 'src/data/metricsKnowledgeBase.ts'));
const { metricsKnowledgeBase } = mod;

const rows = metricsKnowledgeBase.map((m, i) => ({
  metric_key: m.id,
  sort_order: i,
  card: m,
}));

const out = {
  version: 1,
  source: 'metricsKnowledgeBase.ts',
  rows,
};

writeFileSync(join(root, 'supabase/seed/pharma_sm_metrics_default.json'), JSON.stringify(out, null, 0));
console.log('Wrote supabase/seed/pharma_sm_metrics_default.json', rows.length, 'metrics');
