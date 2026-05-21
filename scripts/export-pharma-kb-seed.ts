/**
 * Run: npx tsx scripts/export-pharma-kb-seed.ts
 * Writes supabase/seed/pharma_sm_metrics_default.json for global (platform) metric defaults.
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { metricsKnowledgeBase } from '../src/data/metricsKnowledgeBase';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const rows = metricsKnowledgeBase.map((m, i) => ({
  metric_key: m.id,
  sort_order: i,
  card: m,
}));

writeFileSync(
  join(root, 'supabase/seed/pharma_sm_metrics_default.json'),
  JSON.stringify({ version: 1, source: 'metricsKnowledgeBase.ts', rows }, null, 0),
);
console.log('Wrote supabase/seed/pharma_sm_metrics_default.json', rows.length, 'metrics');
