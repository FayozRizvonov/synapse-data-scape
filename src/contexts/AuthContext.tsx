import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'marketing' | 'finance' | 'commercial' | 'gm' | 'commercial_lead' | 'marketing_ops';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  companyId: string | null;
  memberStatus: 'pending' | 'active' | 'declined' | null;
  permissions: {
    can_ai_insights?: boolean;
    can_pharma_sm?: boolean;
    can_history?: boolean;
    can_profile?: boolean;
    can_settings?: boolean;
    can_marketing_optimization_recommendations?: boolean;
    can_key_metrics?: boolean;
    can_channel_impact?: boolean;
    can_model_performance_stats?: boolean;
    can_sales_volume_breakdown?: boolean;
    can_scenario_comparison?: boolean;
    can_dynamic_strategy_simulator?: boolean;
    can_diminishing_return_curves?: boolean;
    can_campaign_management?: boolean;
    can_omnichannel_journey?: boolean;
  } | null;
  isCompanyAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [memberStatus, setMemberStatus] = useState<'pending'|'active'|'declined'|null>(null);
  const [permissions, setPermissions] = useState<AuthContextType['permissions']>(null);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      // Prefer company_members role if exists, fallback to user_roles
      const { data: cm } = await supabase
        .from('company_members')
        .select('id, role, company_id, status')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (cm?.role) {
        setUserRole(cm.role as UserRole);
        setCompanyId(cm.company_id ?? null);
        setIsCompanyAdmin(cm.role === 'admin');
        setMemberStatus((cm as any).status || null);
        if (cm?.id) {
          const { data: perms } = await supabase
            .from('member_permissions')
            .select('*')
            .eq('member_id', cm.id)
            .maybeSingle();
          setPermissions(perms || null);
        } else {
          setPermissions(null);
        }
        return;
      }

      const { data: ur } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (ur?.role) setUserRole(ur.role as UserRole);
      setCompanyId(null);
      setMemberStatus(null);
      setPermissions(null);
      setIsCompanyAdmin(false);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
            setTimeout(() => fetchUserRole(session.user!.id), 0);
          }
        } else {
          setUserRole(null);
          setCompanyId(null);
          setIsCompanyAdmin(false);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) setTimeout(() => fetchUserRole(session.user!.id), 0);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setCompanyId(null);
    setIsCompanyAdmin(false);
  };

  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  const value: AuthContextType = {
    user,
    session,
    userRole,
    companyId,
    memberStatus,
    permissions,
    isCompanyAdmin,
    loading,
    signOut,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};