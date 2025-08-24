-- RPC for admins to list pending members of their company
create or replace function public.list_pending_members()
returns setof public.company_members
language sql
security definer
set search_path = public
as $$
  select cm.*
  from public.company_members cm
  where cm.status = 'pending'
    and exists (
      select 1 from public.company_members a
      where a.company_id = cm.company_id
        and a.user_id = auth.uid()
        and a.role = 'admin'
    );
$$;




