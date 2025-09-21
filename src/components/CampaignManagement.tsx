import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Search, Calendar, Users, Mail, Share2, Smartphone, Monitor, Target, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';





const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// UI-aligned palette (soft tints suitable for dark glass surfaces)
const PALETTE = {
  q1: { start: 'rgba(34,211,238,0.22)', end: 'rgba(6,182,212,0.08)', border: 'rgba(34,211,238,0.35)', hoverStart: 'rgba(34,211,238,0.30)', hoverEnd: 'rgba(6,182,212,0.12)' }, // Cyan
  q2: { start: 'rgba(16,185,129,0.22)', end: 'rgba(5,150,105,0.08)', border: 'rgba(16,185,129,0.35)', hoverStart: 'rgba(16,185,129,0.30)', hoverEnd: 'rgba(5,150,105,0.12)' }, // Emerald
  q3: { start: 'rgba(168,85,247,0.22)', end: 'rgba(124,58,237,0.08)', border: 'rgba(168,85,247,0.35)', hoverStart: 'rgba(168,85,247,0.30)', hoverEnd: 'rgba(124,58,237,0.12)' }, // Violet
  q4: { start: 'rgba(59,130,246,0.22)', end: 'rgba(29,78,216,0.08)', border: 'rgba(59,130,246,0.35)', hoverStart: 'rgba(59,130,246,0.30)', hoverEnd: 'rgba(29,78,216,0.12)' }, // Indigo/Blue
} as const;

const quarterKey = (name: string) => (name.toLowerCase() as 'q1' | 'q2' | 'q3' | 'q4');

const quarterData = [
  {
    name: 'Q1',
    color: '#22d3ee',
    activities: [
      { name: 'HCP Email 1to1', color: '#22d3ee', monthly: [10, 20, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'F2F Calls', color: '#22d3ee', monthly: [5, 10, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Web Virtual Calls', color: '#22d3ee', monthly: [8, 12, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Phone Calls', color: '#22d3ee', monthly: [6, 9, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    ],
  },
  {
    name: 'Q2',
    color: '#10b981',
    activities: [
      { name: 'HCP Email 1to1', color: '#10b981', monthly: [0, 0, 0, 15, 25, 35, 0, 0, 0, 0, 0, 0] },
      { name: 'F2F Calls', color: '#10b981', monthly: [0, 0, 0, 7, 14, 21, 0, 0, 0, 0, 0, 0] },
      { name: 'Web Virtual Calls', color: '#10b981', monthly: [0, 0, 0, 10, 15, 20, 0, 0, 0, 0, 0, 0] },
      { name: 'Phone Calls', color: '#10b981', monthly: [0, 0, 0, 8, 12, 16, 0, 0, 0, 0, 0, 0] },
    ],
  },
  {
    name: 'Q3',
    color: '#a855f7',
    activities: [
      { name: 'HCP Email 1to1', color: '#a855f7', monthly: [0, 0, 0, 0, 0, 0, 20, 30, 25, 0, 0, 0] },
      { name: 'F2F Calls', color: '#a855f7', monthly: [0, 0, 0, 0, 0, 0, 10, 20, 15, 0, 0, 0] },
      { name: 'Web Virtual Calls', color: '#a855f7', monthly: [0, 0, 0, 0, 0, 0, 15, 22, 18, 0, 0, 0] },
      { name: 'Phone Calls', color: '#a855f7', monthly: [0, 0, 0, 0, 0, 0, 12, 18, 14, 0, 0, 0] },
    ],
  },
  {
    name: 'Q4',
    color: '#3b82f6',
    activities: [
      { name: 'HCP Email 1to1', color: '#3b82f6', monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 28, 35] },
      { name: 'F2F Calls', color: '#3b82f6', monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 16, 22] },
      { name: 'Web Virtual Calls', color: '#3b82f6', monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 20, 26] },
      { name: 'Phone Calls', color: '#3b82f6', monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 15, 20] },
    ],
  },
];

const cellStyle = (qName: string, hovered: boolean) => {
  const key = quarterKey(qName);
  const pal = PALETTE[key];
  return {
    background: `linear-gradient(180deg, ${hovered ? pal.hoverStart : pal.start}, ${hovered ? pal.hoverEnd : pal.end})`,
    color: '#e5e7eb',
    textAlign: 'center' as const,
    borderRadius: 6,
    fontWeight: 500,
    padding: '4px 0',
    border: `1px solid ${pal.border}`,
    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
  };
};

const CampaignManager: React.FC<{
  expanded: Set<string>;
  toggle: (q: string) => void;
  hoveredActivity: { quarter: string; activity: string } | null;
  setHoveredActivity: (activity: { quarter: string; activity: string } | null) => void;
}> = ({ expanded, toggle, hoveredActivity, setHoveredActivity }) => (
  <div className="w-full max-w-xs min-w-[220px]">
    <ul className="space-y-2" style={{ marginTop: '55px' }}>
      {quarterData.map((q) => (
        <li key={q.name}>
          <button
            className="flex items-center w-full text-left py-2 px-3 rounded-lg transition-colors duration-200 hover:bg-white/10 focus:outline-none"
            style={{ color: PALETTE[quarterKey(q.name)].border, fontWeight: 600, fontSize: 16 }}
            onClick={() => toggle(q.name)}
          >
            {expanded.has(q.name) ? (
              <ChevronDown className="w-5 h-5 mr-2 text-white" />
            ) : (
              <ChevronRight className="w-5 h-5 mr-2 text-white" />
            )}
            {q.name} Campaign
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{
              maxHeight: expanded.has(q.name) ? 200 : 0,
              opacity: expanded.has(q.name) ? 1 : 0,
              transition: 'max-height 0.3s, opacity 0.3s',
            }}
          >
            {expanded.has(q.name) && (
              <ul className="ml-8 mt-1 space-y-1">
                {q.activities.map((act) => (
                  <li 
                    key={act.name} 
                    className="text-xs text-gray-300 py-0.5 cursor-pointer hover:text-white transition-colors duration-200"
                    onMouseEnter={() => setHoveredActivity({ quarter: q.name, activity: act.name })}
                    onMouseLeave={() => setHoveredActivity(null)}
                  >
                    • {act.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const ActiveCampaignsTable: React.FC<{
  expanded: Set<string>;
  hoveredActivity: { quarter: string; activity: string } | null;
}> = ({ expanded, hoveredActivity }) => (
  <div className="w-full">
    <table style={{ borderCollapse: 'collapse', minWidth: 700, width: '100%' }}>
      <thead>
        <tr>
          {months.map((m) => (
            <th key={m} style={{ textAlign: 'center', padding: 8, color: '#fff', fontWeight: 600 }}>{m}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {quarterData.map((q) => {
          const isExpanded = expanded.has(q.name);
          const pal = PALETTE[quarterKey(q.name)];
          return (
            <React.Fragment key={q.name}>
              {/* Parent row */}
              <tr style={{ background: pal.start, transition: 'background 0.3s' }}>
                <td colSpan={months.length}
                  style={{
                    background: `linear-gradient(180deg, ${pal.start}, ${pal.end})`,
                    color: '#ffffff',
                    textAlign: 'center',
                    borderRadius: 8,
                    border: `1px solid ${pal.border}`,
                    fontWeight: 500,
                    fontSize: 14,
                    padding: '4px 0',
                    letterSpacing: 1,
                    transition: 'background 0.3s',
                  }}
                >
                  {q.name} campaign
                </td>
              </tr>
              {/* Child rows */}
              {isExpanded && q.activities.map((act) => {
                const isHovered = hoveredActivity && hoveredActivity.quarter === q.name && hoveredActivity.activity === act.name;
                return (
                  <tr key={q.name + '-' + act.name} style={{ backgroundColor: 'transparent' }}>
                    {act.monthly.map((val, i) => (
                      <td
                        key={i}
                        style={{
                          ...(val > 0 ? cellStyle(q.name, !!isHovered) : { background: 'transparent' }),
                          color: val > 0 ? (isHovered ? '#ffffff' : '#e5e7eb') : 'transparent',
                          fontWeight: val > 0 ? (isHovered ? 600 : 500) : 400,
                          fontSize: 13,
                          borderTop: val > 0 ? `1px solid ${pal.border}` : 'none'
                        }}
                        className="transition-all duration-200 pl-8"
                      >
                        {val > 0 ? val : ''}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  </div>
);

const CampaignManagement: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [hoveredActivity, setHoveredActivity] = useState<{ quarter: string; activity: string } | null>(null);



  const toggle = (q: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(q)) {
        next.delete(q);
      } else {
        next.add(q);
      }
      return next;
    });
  };

  return (
    <div className="space-y-8 mt-12 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Target className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-foreground text-glow">Campaign Management</h2>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="border-cyan-500/50 text-gray-900 dark:text-white hover:bg-cyan-500/20 hover:text-white"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          {isCollapsed ? 'Expand' : 'Collapse'}
        </Button>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex flex-row gap-8 items-start">
                {/* Left Sidebar - Campaign Manager */}
                <div style={{ minWidth: 260, maxWidth: 320, flexShrink: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                      <Target className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Campaign Manager</h3>
                  </div>
                  <CampaignManager expanded={expanded} toggle={toggle} hoveredActivity={hoveredActivity} setHoveredActivity={setHoveredActivity} />
                </div>

                {/* Main Content - Active Campaigns Table */}
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                      <Activity className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Active Campaigns</h3>
                  </div>
                  <ActiveCampaignsTable expanded={expanded} hoveredActivity={hoveredActivity} />
                </div>


              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignManagement; 