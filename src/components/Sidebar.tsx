
import React from 'react';
import { Home, Settings } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { icon: Home, label: 'AI Insights', active: true },
    { icon: Settings, label: 'Finance' },
    { icon: Settings, label: 'Supply Chain' },
    { icon: Settings, label: 'IT' },
    { icon: Settings, label: 'Pharma S&M' },
    { icon: Settings, label: 'Sustainability' },
    { icon: Settings, label: 'TradeShield' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-card/50 backdrop-blur-lg border-r border-border z-10">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-primary pulse-glow"></div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">v1.0.0</div>
            <div className="text-sm font-medium text-foreground">GSIS Platform</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <li key={index}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    item.active
                      ? 'bg-primary/20 text-primary glow-effect'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.active && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary pulse-glow"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Support Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2">LEARNING & SUPPORT</div>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-300">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-300 mt-1">
          <Settings className="w-4 h-4" />
          <span>Help</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
