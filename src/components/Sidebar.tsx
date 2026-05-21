import React, { useEffect, useState } from 'react';
import { Home, Settings, Stethoscope, Landmark, Server, Shield, ChevronLeft, ChevronRight, MessageSquare, ChevronDown, Cloud, User, Brain } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { CLAIRE_LOGO_SRC } from '@/constants/branding';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const { theme } = useTheme();
  const { isCompanyAdmin, permissions, loading } = useAuth();
  const navigate = useNavigate();
  const menuItems = [
    { icon: Home, label: 'AI Insights', id: 'ai-insights' },
  ];
  const pharmaItem = { icon: Stethoscope, label: 'Pharma S&M', id: 'pharma-sm' };
  const historyItem = { icon: MessageSquare, label: 'Chat History', id: 'chat-history' };
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [recentQuestions, setRecentQuestions] = useState<Array<{ id: string; chat_id: string; content: string; created_at: string }>>([]);

  useEffect(() => {
    let timer: any;
    const fromAny = (supabase as unknown as { from?: (t: string) => any })?.from;
    if (!fromAny) return;

    const load = async () => {
      try {
        const { data }: any = await fromAny('messages')
          .select('id, chat_id, content, created_at')
          .eq('sender', 'user')
          .order('created_at', { ascending: false })
          .limit(6);
        let items = (data as any[])?.map((d) => ({ id: d.id, chat_id: d.chat_id, content: d.content, created_at: d.created_at })) || [];
        if (!items.length) {
          const { data: chats }: any = await fromAny('chats')
            .select('id, title, updated_at')
            .order('updated_at', { ascending: false })
            .limit(6);
          items = (chats as any[])?.map((c) => ({ id: c.id, chat_id: c.id, content: c.title, created_at: c.updated_at })) || [];
        }
        setRecentQuestions(items);
      } catch (_) {}
    };

    if (!loading) {
      load();
      timer = setInterval(load, 5000);
    }

    // realtime updates (best effort)
    let channel: any;
    try {
      channel = (supabase as any).channel('sidebar-recent-q')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
          const m = payload.new as { id: string; chat_id: string; content: string; sender: string; created_at: string };
          if (m.sender !== 'user') return;
          setRecentQuestions(prev => [{ id: m.id, chat_id: m.chat_id, content: m.content, created_at: m.created_at }, ...prev].slice(0, 6));
        })
        .subscribe();
    } catch (_) {}

    return () => {
      if (timer) clearInterval(timer);
      try { (supabase as any).removeChannel?.(channel); } catch (_) {}
    };
  }, [loading]);

  const handleSettingsClick = () => {
    onSectionChange('settings');
  };

  return (
    <div className={`fixed left-0 top-0 h-screen backdrop-blur-[2px] bg-gradient-sidebar dark:bg-gradient-sidebar border-r border-gray-200/50 dark:border-white/10 z-20 md:z-10 transition-all duration-300 ease-in-out shadow-blue-sm ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className={`border-b border-gray-200/50 dark:border-white/10 p-4 ${isCollapsed ? 'py-6' : 'p-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="flex justify-center">
            <div className="rounded-lg overflow-hidden">
              <img src={CLAIRE_LOGO_SRC} alt="CLAIRE Logo" className="w-12 h-12 object-contain" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-xs text-gray-500 dark:text-white/40">v1.0.0</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">CLAIRE AI</div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <div className="absolute -right-3 top-20 backdrop-blur-[2px] bg-white/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-full p-1 shadow-blue-md hover:shadow-blue-lg transition-shadow duration-200 md:block">
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 rounded-full bg-gray-100/80 dark:bg-white/10 hover:bg-gray-200/80 dark:hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-white/60" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-white/60" />
          )}
        </button>
      </div>

      {/* Main menu */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {/* AI Insights (admins always see) */}
        {(isCompanyAdmin || permissions?.can_ai_insights) && menuItems.map((item) => (
          <button
            key={item.id}
            className={`group flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === item.id
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300'
                : 'text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-700 dark:hover:text-cyan-300'
            }`}
            onClick={() => onSectionChange(item.id)}
          >
            {item.icon && <item.icon className="w-5 h-5" />}
            {!isCollapsed && <span className="ml-2">{item.label}</span>}
          </button>
        ))}

        {/* Admin Panel Group (only for company admins) */}
        {isCompanyAdmin && (
          <div className="mt-2">
            <button
              className={`group flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                ['admin-overview','admin-brands','admin-community','admin-clouds','admin-model-control'].includes(activeSection)
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300'
                  : 'text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-700 dark:hover:text-cyan-300'
              }`}
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              title={isCollapsed ? 'Admin Panel' : undefined}
            >
              <Shield className="w-5 h-5" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="ml-2">Admin Panel</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} />
                </div>
              )}
            </button>

            {!isCollapsed && isAdminOpen && (
              <div className="mt-1 ml-7 space-y-1">
                <button
                  className={`group flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === 'admin-overview'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300'
                      : 'text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-700 dark:hover:text-cyan-300'
                  }`}
                  onClick={() => onSectionChange('admin-overview')}
                >
                  <Landmark className="w-4 h-4" />
                  <span className="ml-2">Overview</span>
                </button>
                <button
                  className={`group flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === 'admin-brands'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300'
                      : 'text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-700 dark:hover:text-cyan-300'
                  }`}
                  onClick={() => onSectionChange('admin-brands')}
                >
                  <Server className="w-4 h-4" />
                  <span className="ml-2">Brands</span>
                </button>
                <button
                  className={`group flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === 'admin-clouds'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300'
                      : 'text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-700 dark:hover:text-cyan-300'
                  }`}
                  onClick={() => onSectionChange('admin-clouds')}
                >
                  <Cloud className="w-4 h-4" />
                  <span className="ml-2">Clouds</span>
                </button>
                <button
                  className={`group flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === 'admin-model-control'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300'
                      : 'text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-700 dark:hover:text-cyan-300'
                  }`}
                  onClick={() => onSectionChange('admin-model-control')}
                >
                  <Brain className="w-4 h-4" />
                  <span className="ml-2">Model Control</span>
                </button>
              </div>
            )}
          </div>
        )}
        {/* Pharma S&M */}
        {(isCompanyAdmin || permissions?.can_pharma_sm) && (
        <button
          key={pharmaItem.id}
          className={`group flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === pharmaItem.id
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300'
              : 'text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-700 dark:hover:text-cyan-300'
          }`}
          onClick={() => onSectionChange(pharmaItem.id)}
        >
          {pharmaItem.icon && <pharmaItem.icon className="w-5 h-5" />}
          {!isCollapsed && <span className="ml-2">{pharmaItem.label}</span>}
        </button>
        )}
        {/* Разделитель */}
        <div className="my-4 border-t border-gray-200 dark:border-white/10" />
        {/* История чатов */}
        <button
          key={historyItem.id}
          className={`group flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === historyItem.id
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300'
              : 'text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-700 dark:hover:text-cyan-300'
          }`}
          onClick={() => onSectionChange(historyItem.id)}
        >
          {historyItem.icon && <historyItem.icon className="w-5 h-5" />}
          {!isCollapsed && <span className="ml-2">{historyItem.label}</span>}
        </button>

        {/* Recent user questions */}
        {!isCollapsed && recentQuestions.length > 0 && (
          <div className="ml-9 mt-2 space-y-1">
            {recentQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => navigate(`/chat/${q.chat_id}`)}
                className={`block text-left w-full text-xs px-2 py-1 rounded-md transition-colors ${
                  'text-gray-600 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-700 dark:hover:text-cyan-300'
                }`}
                title={q.content}
              >
                {q.content.length > 42 ? q.content.slice(0, 42) + '…' : q.content}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Support Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 dark:border-white/10">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 dark:text-white/40 mb-2">LEARNING & SUPPORT</div>
        )}
        <button
          onClick={() => onSectionChange('profile')}
          className={`w-full flex items-center py-2 rounded-lg text-sm transition-all duration-300 group relative ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} ${
            activeSection === 'profile'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-gray-900 dark:text-white shadow-blue-lg'
              : 'text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 hover:shadow-blue-sm'
          }`}
          title={isCollapsed ? 'Profile' : undefined}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Profile</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 backdrop-blur-[2px] bg-white/90 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-md text-xs text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 shadow-blue-md">
              Profile
            </div>
          )}
        </button>
        <button
          onClick={handleSettingsClick}
          className={`w-full flex items-center py-2 rounded-lg text-sm transition-all duration-300 group relative ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} ${
            activeSection === 'settings'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-gray-900 dark:text-white shadow-blue-lg'
              : 'text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 hover:shadow-blue-sm'
          }`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 backdrop-blur-[2px] bg-white/90 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-md text-xs text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 shadow-blue-md">
              Settings
            </div>
          )}
        </button>
        <button
          className={`w-full flex items-center py-2 rounded-lg text-sm text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 transition-all duration-300 mt-1 group relative ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} hover:shadow-blue-sm`}
          title={isCollapsed ? 'Help' : undefined}
        >
          <MessageSquare className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Help</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 backdrop-blur-[2px] bg-white/90 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-md text-xs text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 shadow-blue-md">
              Help
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
