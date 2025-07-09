import React, { useState } from 'react';
import { Home, Settings, Stethoscope, Landmark, Truck, Server, Leaf, Shield, ChevronLeft, ChevronRight, LifeBuoy, Palette, Clock, MessageSquare } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

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
  const menuItems = [
    { icon: Home, label: 'AI Insights', id: 'ai-insights' },
    { icon: Stethoscope, label: 'Pharma S&M', id: 'pharma-sm' },
  ];
  const historyItem = { icon: MessageSquare, label: 'History of chats', id: 'chat-history' };

  const handleSettingsClick = () => {
    onSectionChange('settings');
  };

  return (
    <div className={`fixed left-0 top-0 h-screen backdrop-blur-[2px] bg-gradient-sidebar dark:bg-gradient-sidebar border-r border-gray-200/50 dark:border-white/10 z-10 transition-all duration-300 ease-in-out shadow-blue-sm ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className={`border-b border-gray-200/50 dark:border-white/10 p-4 ${isCollapsed ? 'py-6' : 'p-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="flex justify-center">
            <div className="rounded-lg overflow-hidden">
              <img src="/images/logo-trigma.png" alt="Trigma Logo" className="w-12 h-12 object-contain" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-xs text-gray-500 dark:text-white/40">v1.0.0</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Trigma AI</div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <div className="absolute -right-3 top-20 backdrop-blur-[2px] bg-white/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-full p-1 shadow-blue-md hover:shadow-blue-lg transition-shadow duration-200">
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
        {menuItems.map((item) => (
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
            {!isCollapsed && item.label}
          </button>
        ))}
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
          {!isCollapsed && historyItem.label}
        </button>
      </nav>

      {/* Support Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 dark:border-white/10">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 dark:text-white/40 mb-2">LEARNING & SUPPORT</div>
        )}
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
          <LifeBuoy className="w-5 h-5 flex-shrink-0" />
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
