-- Fix mmm_runs SELECT policy: authorise through brands, not by comparing
-- project_id to company_id.
--
-- mmm_runs.project_id is a **brands.id** — an MMM project belongs to a brand,
-- and brands are company-owned (brands.company_id).  The original policy
-- compared project_id directly to company_members.company_id, and its fallback
-- clause did the same thing, so neither could ever match a real project id.
-- Effect: no authenticated user could read any run at all; only the service
-- role (which bypasses RLS) could.  It looked permissive and was actually
-- closed, which is why it went unnoticed — nothing queries mmm_runs directly
-- yet, but job-status polling from the frontend would have returned nothing.
--
-- Correct chain:
--   mmm_runs.project_id -> brands.id -> brands.company_id -> company_members
--
-- Only `active` members qualify.  company_members.status is 'active' | 'pending';
-- a pending member must not see runs.
--
-- b.id is cast to text (rather than casting project_id to uuid) because
-- mmm_runs.project_id is a text column and still holds a few non-UUID values
-- from early testing — casting those to uuid would raise instead of simply
-- not matching.

drop policy if exists mmm_runs_select_member on public.mmm_runs;

create policy mmm_runs_select_member
on public.mmm_runs for select
to authenticated
using (
  exists (
    select 1
    from public.brands b
    join public.company_members cm on cm.company_id = b.company_id
    where b.id::text = mmm_runs.project_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  )
);

-- mmm_runs_service_role_all is unchanged: the Celery worker and the API write
-- with the service role key and must keep full access.
