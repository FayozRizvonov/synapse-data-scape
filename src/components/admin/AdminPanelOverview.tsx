import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Member = {
  id: string;
  user_id: string;
  role: 'admin' | 'marketing' | 'finance' | 'commercial';
  status: 'pending' | 'active' | 'declined';
};

type Profile = {
  id: string; // user id
  email: string | null;
};

type Permissions = {
  member_id: string;
  can_ai_insights?: boolean;
  can_pharma_sm?: boolean;
  can_profile?: boolean;
  can_settings?: boolean;
};

const AdminPanelOverview: React.FC = () => {
  const { companyId, isCompanyAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [perms, setPerms] = useState<Record<string, Permissions>>({});
  const [brandsCount, setBrandsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = useMemo(() => members.filter(m => m.status === 'pending'), [members]);
  const adminsCount = useMemo(() => members.filter(m => m.role === 'admin').length, [members]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isCompanyAdmin) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Members via RPC (enforced admin scope)
        const { data: mData, error: mErr } = await supabase.rpc('list_company_members');
        if (mErr) throw mErr;
        const m = (mData as any[] | null) ?? [];
        if (!cancelled) setMembers(m as Member[]);

        // Profiles (emails)
        const userIds = m.map((x: any) => x.user_id);
        if (userIds.length > 0) {
          const { data: pData, error: pErr } = await supabase
            .from('profiles')
            .select('id,email')
            .in('id', userIds);
          if (pErr) throw pErr;
          const map: Record<string, Profile> = {};
          (pData ?? []).forEach((p) => { map[p.id] = p as Profile; });
          if (!cancelled) setProfiles(map);
        } else {
          if (!cancelled) setProfiles({});
        }

        // Permissions via RPC for admin's company
        const { data: permData, error: permErr } = await supabase.rpc('list_member_permissions_for_admin');
        if (permErr) throw permErr;
        const pmap: Record<string, Permissions> = {};
        ((permData as any[] | null) ?? []).forEach((row: any) => {
          pmap[row.member_id] = row as Permissions;
        });
        if (!cancelled) setPerms(pmap);

        // Brands count for this company
        if (companyId) {
          const { count } = await supabase
            .from('brands')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', companyId);
          if (!cancelled) setBrandsCount(count ?? 0);
        } else {
          if (!cancelled) setBrandsCount(0);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load admin overview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [companyId, isCompanyAdmin]);

  const togglePermission = async (memberId: string, field: keyof Permissions, value: boolean) => {
    setSaving(memberId + ':' + field);
    try {
      await supabase.rpc('admin_set_permission', {
        p_member_id: memberId,
        p_field: field,
        p_value: value,
      });
      setPerms(prev => ({
        ...prev,
        [memberId]: { ...prev[memberId], [field]: value },
      }));
    } finally {
      setSaving(null);
    }
  };

  if (!isCompanyAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Panel Overview</h1>
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-yellow-200 text-sm">
          You are not a company admin. Ask an admin to grant you admin role to manage members and permissions.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel Overview</h1>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300 mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-sm text-white/60">Users</div>
          <div className="text-2xl font-semibold">{loading ? '—' : members.length}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-sm text-white/60">Brands</div>
          <div className="text-2xl font-semibold">{loading ? '—' : brandsCount}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-sm text-white/60">Admins</div>
          <div className="text-2xl font-semibold">{loading ? '—' : adminsCount}</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 mb-6">
        <div className="px-4 py-3 border-b border-white/10 font-medium">Pending requests</div>
        <div className="p-4 text-sm text-white/70">
          {pending.length === 0 ? 'No pending requests.' : `${pending.length} pending…`}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 font-medium">Members</div>
        <div className="divide-y divide-white/10">
          {members.map(m => (
            <div key={m.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm">{profiles[m.user_id]?.email ?? m.user_id}</div>
                  <div className="text-xs text-white/50">{m.role} • {m.status}</div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-cyan-400"
                      checked={!!perms[m.id]?.can_ai_insights}
                      onChange={(e) => togglePermission(m.id, 'can_ai_insights', e.target.checked)}
                      disabled={saving !== null}
                    />
                    AI Insights
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-cyan-400"
                      checked={!!perms[m.id]?.can_pharma_sm}
                      onChange={(e) => togglePermission(m.id, 'can_pharma_sm', e.target.checked)}
                      disabled={saving !== null}
                    />
                    Pharma S&M
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-cyan-400"
                      checked={!!perms[m.id]?.can_settings}
                      onChange={(e) => togglePermission(m.id, 'can_settings', e.target.checked)}
                      disabled={saving !== null}
                    />
                    Settings
                  </label>
                </div>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="p-4 text-sm text-white/60">No members found for your company.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanelOverview;