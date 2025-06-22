import React, { useState } from 'react';
import { Home, Settings, Stethoscope, Landmark, Truck, Server, Leaf, Shield, ChevronLeft, ChevronRight, LifeBuoy } from 'lucide-react';

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
  const menuItems = [
    { icon: Home, label: 'AI Insights', id: 'ai-insights' },
    { icon: Landmark, label: 'Finance', id: 'finance' },
    { icon: Truck, label: 'Supply Chain', id: 'supply-chain' },
    { icon: Server, label: 'IT', id: 'it' },
    { icon: Stethoscope, label: 'Pharma S&M', id: 'pharma-sm' },
    { icon: Leaf, label: 'Sustainability', id: 'sustainability' },
    { icon: Shield, label: 'TradeShield', id: 'tradeshield' },
  ];

  return (
    <div className={`fixed left-0 top-0 h-screen bg-card/50 backdrop-blur-lg border-r border-border z-10 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className={`border-b border-border p-4 ${isCollapsed ? 'py-6' : 'p-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src="/images/gsisai_logo.png" alt="GSIS AI Logo" className="w-7 h-7 object-contain" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">v1.0.0</div>
              <div className="text-sm font-medium text-foreground">GSIS Platform</div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <div className="absolute -right-3 top-20 bg-card border border-border rounded-full p-1 shadow-lg">
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors duration-200"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-primary" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-primary" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={index}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group relative ${
                    isCollapsed ? 'justify-center' : 'gap-3 px-3'
                  } ${
                    isActive
                      ? 'bg-primary/20 text-primary glow-effect'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-primary pulse-glow flex-shrink-0"></div>
                      )}
                    </>
                  )}
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-md text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                      {item.label}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Support Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground mb-2">LEARNING & SUPPORT</div>
        )}
        <button
          className={`w-full flex items-center py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-300 group relative ${isCollapsed ? 'justify-center' : 'gap-3 px-3'}`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-md text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
              Settings
            </div>
          )}
        </button>
        <button
          className={`w-full flex items-center py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-300 mt-1 group relative ${isCollapsed ? 'justify-center' : 'gap-3 px-3'}`}
          title={isCollapsed ? 'Help' : undefined}
        >
          <LifeBuoy className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Help</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-md text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
              Help
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
