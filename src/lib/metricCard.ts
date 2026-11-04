import type { MetricCard } from '@/data/metricsKnowledgeBase';

/**
 * Runtime validation for metric cards that did not come from our own code.
 *
 * `MetricCard` types `value` as a required `string`, but two of the three sources that
 * produce one are outside the type system's reach:
 *
 *   1. `extractStructuredFromText` in ChatView parses JSON out of the assistant's free
 *      text and hands the result over with `as MetricCard`. A cast asserts; it does not
 *      check. Whatever the model wrote becomes a `MetricCard` as far as TypeScript is
 *      concerned.
 *   2. `message.card` is persisted in Supabase, so a malformed card written once is
 *      replayed on every later load of that conversation.
 *
 * When `value` was missing, `ChatMetricCardEnhanced` evaluated
 * `metric.value.includes('%')` and threw `Cannot read properties of undefined (reading
 * 'includes')` during render. With no error boundary in the app, React unmounted the
 * whole tree — the screen went blank mid-demo.
 *
 * So the cast is the actual defect, and this is the guard that replaces it.
 */

/**
 * Is this value safe to hand to `ChatMetricCardEnhanced`?
 *
 * Requires a `title`, plus either a string `value` or a `chartData` to draw. That
 * mirrors what the previous bare-shape check in `extractStructuredFromText` intended
 * (`p.title && (p.value || p.chartData)`) and so rejects nothing that used to render
 * correctly — but unlike that check it verifies `value` is actually a *string* rather
 * than merely truthy, which is the case that crashed.
 *
 * `id`, `change`, `comparison`, `details` and the rest are deliberately NOT required.
 * They are all either optional-chained or `&&`-guarded at the point of render, so a
 * card missing them degrades instead of throwing, and demanding them here would reject
 * cards that display perfectly well.
 */
export function isRenderableMetricCard(v: unknown): v is MetricCard {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Partial<MetricCard>;
  if (typeof c.title !== 'string' || c.title.trim() === '') return false;
  return typeof c.value === 'string' || isDrawableChart(c.chartData);
}

function isDrawableChart(chart: MetricCard['chartData']): boolean {
  return !!chart && Array.isArray(chart.data) && chart.data.length > 0;
}

/**
 * The card's headline figure, or `null` when it has none.
 *
 * A chart-only card is legitimate — the assistant can reasonably answer with a series
 * and no single number — so this returns `null` rather than a placeholder, and the
 * component omits the figure instead of rendering "NaN" or "undefined".
 */
export function metricValue(metric: MetricCard): string | null {
  return typeof metric.value === 'string' && metric.value.trim() !== ''
    ? metric.value
    : null;
}
