import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

interface MemberRow {
  id: string;
  user_id: string;
  company_id: string;
  role: 'admin' | 'marketing' | 'finance' | 'commercial' | 'gm' | 'commercial_lead' | 'marketing_ops';
  status?: 'pending' | 'active' | 'declined';
  created_at: string;
  email: string | null;
  permissions?: {
    id: string;
    member_id: string;
    can_ai_insights: boolean;
    can_pharma_sm: boolean;
    can_history: boolean;
    can_profile: boolean;
    can_settings: boolean;
    can_marketing_optimization_recommendations?: boolean;
    can_key_metrics?: boolean;
    can_channel_impact?: boolean;
    can_model_performance_stats?: boolean;
    can_sales_volume_breakdown?: boolean;
    can_scenario_comparison?: boolean;
    can_dynamic_strategy_simulator?: boolean;
    can_diminishing_return_curves?: boolean;
    can_campaign_management?: boolean;
  } | null;
}

const AdminPanelOverview: React.FC = () => {
  const { isCompanyAdmin, companyId } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [pendingMembers, setPendingMembers] = useState<MemberRow[]>([]);
  const [brandsCount, setBrandsCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    // members via RPC (now includes email)
    const { data: cm } = await supabase.rpc('list_company_members');
    if (cm) {
      const ids = cm.map((m: any) => m.id);
      if (ids.length > 0) {
        // Fetch permissions with admin RPC to bypass RLS filtering
        const { data: perms } = await supabase.rpc('list_member_permissions_for_admin');
        const permMap = new Map((perms || []).map((p: any) => [p.member_id, p]));
        setMembers(cm.map((m: any) => ({ ...m, permissions: permMap.get(m.id) || null })));
      } else {
        setMembers(cm);
      }
    }
    if (companyId) {
      const { count } = await supabase
        .from('brands')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      setBrandsCount(count || 0);

      // Prefer RPC that enforces admin-of-company and ignores RLS issues
      const { data: pend } = await supabase.rpc('list_pending_members');
      const pending = (pend || []) as MemberRow[];
      setPendingMembers(pending);
    }
    setLoading(false);
  };

  const approve = async (id: string, approve: boolean) => {
    await supabase.rpc('admin_approve_member', { p_member: id, p_approve: approve });
    load();
  };

  useEffect(() => { load(); }, [companyId]);

  const updateRole = async (memberId: string, role: MemberRow['role']) => {
    await supabase.from('company_members').update({ role }).eq('id', memberId);
    load();
  };

  const updatePerm = async (memberId: string, fieldKey: keyof NonNullable<MemberRow['permissions']>, value: boolean) => {
    // Optimistic UI update so toggles respond immediately
    setMembers(prev => prev.map(m =>
      m.id === memberId
        ? { ...m, permissions: { ...(m.permissions || {} as any), [fieldKey]: value } as any }
        : m
    ));

    // Use admin RPC to bypass RLS safely
    const field = String(fieldKey);
    await supabase.rpc('admin_set_permission', {
      p_member_id: memberId,
      p_field: field,
      p_value: value,
    });

    // Refetch just this member's permissions to avoid flicker
    const { data: freshPerms } = await supabase.rpc('list_member_permissions_for_admin');
    const freshMap = new Map((freshPerms || []).map((p: any) => [p.member_id, p]));
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, permissions: freshMap.get(memberId) || m.permissions || null } : m));
  };

  // chart data: brands by week
  const [brandSeries, setBrandSeries] = useState<{ date: string; brands: number }[]>([]);
  useEffect(() => {
    const loadSeries = async () => {
      if (!companyId) return;
      const { data } = await supabase
        .from('brands')
        .select('created_at')
        .eq('company_id', companyId)
        .order('created_at');
      const byWeek = new Map<string, number>();
      (data || []).forEach((b: any) => {
        const d = new Date(b.created_at);
        const key = `${d.getFullYear()}-W${Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7)}`;
        byWeek.set(key, (byWeek.get(key) || 0) + 1);
      });
      const series = Array.from(byWeek.entries()).map(([date, brands]) => ({ date, brands }));
      setBrandSeries(series);
    };
    loadSeries();
  }, [companyId, members.length, brandsCount]);

  const chartConfig = useMemo(() => ({ brands: { label: 'Brands', color: 'hsl(var(--chart-primary, var(--ring)))' } }), []);

  if (!isCompanyAdmin) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="text-sm text-muted-foreground">Company administrator rights are required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/70">Users</div>
          <div className="text-2xl font-semibold">{members.length}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/70">Brands</div>
          <div className="text-2xl font-semibold">{brandsCount}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/70">Admins</div>
          <div className="text-2xl font-semibold">{members.filter(m => m.role === 'admin').length}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 text-sm text-white/70">Brand creations per week</div>
        <ChartContainer config={chartConfig} className="h-64">
          <AreaChart data={brandSeries} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area dataKey="brands" type="natural" fill="var(--color-brands)" stroke="var(--color-brands)" fillOpacity={0.2} />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Pending requests */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 text-sm text-white/70">Pending requests</div>
        <div className="space-y-2">
          {pendingMembers.length === 0 && (
            <div className="text-xs text-muted-foreground">No pending requests.</div>
          )}
          {pendingMembers.map((m) => (
            <div key={m.id} className="flex items-center justify-between border border-white/10 rounded-md p-2">
              <div className="text-xs font-mono">{m.email || m.user_id}</div>
              <div className="flex gap-2">
                <Button variant="glassAccent" size="sm" onClick={() => approve(m.id, true)}>Approve</Button>
                <Button variant="ghost" size="sm" onClick={() => approve(m.id, false)}>Decline</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Members table (desktop) */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">AI Insights</th>
              <th className="text-left p-3">Pharma S&M</th>
              <th className="hidden lg:table-cell text-left p-3">History</th>
              <th className="hidden lg:table-cell text-left p-3">Profile</th>
              <th className="hidden lg:table-cell text-left p-3">Settings</th>
              <th className="hidden xl:table-cell text-left p-3">Marketing Optimization Recs</th>
              <th className="hidden xl:table-cell text-left p-3">Key Metrics</th>
              <th className="hidden xl:table-cell text-left p-3">Channel Impact</th>
              <th className="hidden xl:table-cell text-left p-3">Model Performance Stats</th>
              <th className="hidden 2xl:table-cell text-left p-3">Sales Volume Breakdown</th>
              <th className="hidden 2xl:table-cell text-left p-3">Scenario Comparison</th>
              <th className="hidden 2xl:table-cell text-left p-3">Dynamic Strategy Simulator</th>
              <th className="hidden 2xl:table-cell text-left p-3">Diminishing Return Curves</th>
              <th className="hidden 2xl:table-cell text-left p-3">Campaign Management</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-white/10">
                <td className="p-3 font-mono text-xs whitespace-nowrap">{m.email || m.user_id}</td>
                <td className="p-3">
                  <Select value={m.role} onValueChange={(v) => updateRole(m.id, v as any)}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial">commercial</SelectItem>
                      <SelectItem value="marketing">marketing</SelectItem>
                      <SelectItem value="finance">finance</SelectItem>
                      <SelectItem value="gm">gm</SelectItem>
                      <SelectItem value="commercial_lead">commercial_lead</SelectItem>
                      <SelectItem value="marketing_ops">marketing_ops</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3"><span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5">{m.status || 'active'}</span></td>
                <td className="p-3"><Switch checked={!!m.permissions?.can_ai_insights} onCheckedChange={(v) => updatePerm(m.id, 'can_ai_insights', v)} /></td>
                <td className="p-3"><Switch checked={!!m.permissions?.can_pharma_sm} onCheckedChange={(v) => updatePerm(m.id, 'can_pharma_sm', v)} /></td>
                <td className="hidden lg:table-cell p-3"><Switch checked={!!m.permissions?.can_history} onCheckedChange={(v) => updatePerm(m.id, 'can_history', v)} /></td>
                <td className="hidden lg:table-cell p-3"><Switch checked={!!m.permissions?.can_profile} onCheckedChange={(v) => updatePerm(m.id, 'can_profile', v)} /></td>
                <td className="hidden lg:table-cell p-3"><Switch checked={!!m.permissions?.can_settings} onCheckedChange={(v) => updatePerm(m.id, 'can_settings', v)} /></td>
                <td className="hidden xl:table-cell p-3"><Switch checked={!!m.permissions?.can_marketing_optimization_recommendations} onCheckedChange={(v) => updatePerm(m.id, 'can_marketing_optimization_recommendations', v)} /></td>
                <td className="hidden xl:table-cell p-3"><Switch checked={!!m.permissions?.can_key_metrics} onCheckedChange={(v) => updatePerm(m.id, 'can_key_metrics', v)} /></td>
                <td className="hidden xl:table-cell p-3"><Switch checked={!!m.permissions?.can_channel_impact} onCheckedChange={(v) => updatePerm(m.id, 'can_channel_impact', v)} /></td>
                <td className="hidden xl:table-cell p-3"><Switch checked={!!m.permissions?.can_model_performance_stats} onCheckedChange={(v) => updatePerm(m.id, 'can_model_performance_stats', v)} /></td>
                <td className="hidden 2xl:table-cell p-3"><Switch checked={!!m.permissions?.can_sales_volume_breakdown} onCheckedChange={(v) => updatePerm(m.id, 'can_sales_volume_breakdown', v)} /></td>
                <td className="hidden 2xl:table-cell p-3"><Switch checked={!!m.permissions?.can_scenario_comparison} onCheckedChange={(v) => updatePerm(m.id, 'can_scenario_comparison', v)} /></td>
                <td className="hidden 2xl:table-cell p-3"><Switch checked={!!m.permissions?.can_dynamic_strategy_simulator} onCheckedChange={(v) => updatePerm(m.id, 'can_dynamic_strategy_simulator', v)} /></td>
                <td className="hidden 2xl:table-cell p-3"><Switch checked={!!m.permissions?.can_diminishing_return_curves} onCheckedChange={(v) => updatePerm(m.id, 'can_diminishing_return_curves', v)} /></td>
                <td className="hidden 2xl:table-cell p-3"><Switch checked={!!m.permissions?.can_campaign_management} onCheckedChange={(v) => updatePerm(m.id, 'can_campaign_management', v)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Members list (mobile) */}
      <div className="md:hidden space-y-3">
        {members.map((m) => (
          <div key={m.id} className="border border-white/10 rounded-lg bg-white/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono text-xs break-all">{m.email || m.user_id}</div>
              <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5 whitespace-nowrap">{m.status || 'active'}</span>
            </div>
            <div className="mt-2">
              <Select value={m.role} onValueChange={(v) => updateRole(m.id, v as any)}>
                <SelectTrigger className="w-full bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial">commercial</SelectItem>
                  <SelectItem value="marketing">marketing</SelectItem>
                  <SelectItem value="finance">finance</SelectItem>
                  <SelectItem value="gm">gm</SelectItem>
                  <SelectItem value="commercial_lead">commercial_lead</SelectItem>
                  <SelectItem value="marketing_ops">marketing_ops</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between text-xs">
                <span>AI Insights</span>
                <Switch checked={!!m.permissions?.can_ai_insights} onCheckedChange={(v) => updatePerm(m.id, 'can_ai_insights', v)} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Pharma S&M</span>
                <Switch checked={!!m.permissions?.can_pharma_sm} onCheckedChange={(v) => updatePerm(m.id, 'can_pharma_sm', v)} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Profile</span>
                <Switch checked={!!m.permissions?.can_profile} onCheckedChange={(v) => updatePerm(m.id, 'can_profile', v)} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Settings</span>
                <Switch checked={!!m.permissions?.can_settings} onCheckedChange={(v) => updatePerm(m.id, 'can_settings', v)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Button variant="glassAccent" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
      </div>
    </div>
  );
};

export default AdminPanelOverview;
