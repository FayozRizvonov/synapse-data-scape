-- RPC for company admins to see members of their company
create or replace function public.list_company_members()
returns setof public.company_members
language sql
security definer
set search_path = public
as $$
  select cm.*
  from public.company_members cm
  where exists (
    select 1 from public.company_members a
    where a.company_id = cm.company_id
      and a.user_id = auth.uid()
      and a.role = 'admin'
  );
$$;

-- (Optional) helper to check admin status
create or replace function public.is_company_admin(p_company uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.company_members a
    where a.company_id = p_company
      and a.user_id = auth.uid()
      and a.role = 'admin'
  );
$$;



