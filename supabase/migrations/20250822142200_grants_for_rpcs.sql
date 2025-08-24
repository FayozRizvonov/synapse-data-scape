grant execute on function public.admin_set_permission(uuid, text, boolean) to authenticated;
grant execute on function public.list_pending_members() to authenticated;
grant execute on function public.list_company_members() to authenticated;
grant execute on function public.admin_approve_member(uuid, boolean) to authenticated;

