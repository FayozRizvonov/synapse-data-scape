-- Replace pending members RPC to include email
create or replace function public.list_pending_members()
returns table (
  id uuid,
  user_id uuid,
  company_id uuid,
  role public.app_role,
  status public.member_status,
  created_at timestamptz,
  email text
)
language sql
security definer
set search_path = public
as $$
  select cm.id, cm.user_id, cm.company_id, cm.role, cm.status, cm.created_at, p.email
  from public.company_members cm
  left join public.profiles p on p.id = cm.user_id
  where cm.status = 'pending'
    and exists (
      select 1 from public.company_members a
      where a.company_id = cm.company_id
        and a.user_id = auth.uid()
        and a.role = 'admin'
    );
$$;


