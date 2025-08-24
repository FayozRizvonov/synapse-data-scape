-- Return permissions for all members in the admin's company
create or replace function public.list_member_permissions_for_admin()
returns setof public.member_permissions
language sql
security definer
set search_path = public
as $$
  select mp.*
  from public.member_permissions mp
  join public.company_members target on target.id = mp.member_id
  join public.company_members admin on admin.company_id = target.company_id
    and admin.user_id = auth.uid()
    and admin.role = 'admin';
$$;

grant execute on function public.list_member_permissions_for_admin() to authenticated;


