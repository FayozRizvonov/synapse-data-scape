/**
 * The project the demo UI reads from.
 *
 * `project_id` is a `uuid` and must be a real `brands.id` — this one is registered
 * as the brand "CLAIRE Demo Project". Passing anything non-UUID (the old `'1'`)
 * makes Postgres reject the query outright with `22P02 invalid input syntax for
 * type uuid`, so the dashboard renders no model metrics at all rather than failing
 * visibly.
 *
 * Override per-environment with `VITE_DEMO_PROJECT_ID`.
 */
export const DEMO_PROJECT_ID =
  import.meta.env.VITE_DEMO_PROJECT_ID || '550e8400-e29b-41d4-a716-446655440000';

/** A `project_id` is only usable if Postgres will accept it as a uuid. */
export function isValidProjectId(id: unknown): id is string {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}
