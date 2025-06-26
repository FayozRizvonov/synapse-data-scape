import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Search, Calendar, BarChart3, Users, Mail, Share2, Smartphone, Monitor, Eye, Folder, Clock, Target, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Campaign {
  id: string;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  color: string;
  initiatives: number;
  channels: number;
}

interface BreakdownItem {
  name: string;
  blocks: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

const CampaignManagement: React.FC = () => {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Client']));
  const [showMoreBreakdown, setShowMoreBreakdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const campaigns: Campaign[] = [
    {
      id: 'q1',
      name: 'Q1 Campaign',
      category: 'Campaigns',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      color: 'var(--campaign-q1)',
      initiatives: 25,
      channels: 4
    },
    {
      id: 'q2',
      name: 'Q2 Campaign',
      category: 'Campaigns',
      startDate: '2024-04-01',
      endDate: '2024-06-30',
      color: 'var(--campaign-q2)',
      initiatives: 30,
      channels: 4
    },
    {
      id: 'q3',
      name: 'Q3 Campaign',
      category: 'Campaigns',
      startDate: '2024-07-01',
      endDate: '2024-09-30',
      color: 'var(--campaign-q3)',
      initiatives: 28,
      channels: 4
    },
    {
      id: 'q4',
      name: 'Q4 Campaign',
      category: 'Campaigns',
      startDate: '2024-10-01',
      endDate: '2024-12-31',
      color: 'var(--campaign-q4)',
      initiatives: 32,
      channels: 4
    }
  ];

  const breakdownData: BreakdownItem[] = [
    { name: 'HCP Email 1to1', blocks: 25, percentage: 35, color: 'var(--channel-email)', icon: <Mail className="w-4 h-4" /> },
    { name: 'F2F Calls', blocks: 20, percentage: 28, color: 'var(--channel-social)', icon: <Users className="w-4 h-4" /> },
    { name: 'Web Virtual Calls', blocks: 15, percentage: 22, color: 'var(--channel-mobile)', icon: <Monitor className="w-4 h-4" /> },
    { name: 'Phone Calls', blocks: 10, percentage: 15, color: 'var(--channel-media)', icon: <Smartphone className="w-4 h-4" /> }
  ];

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // GanttChart компонент
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const quarters = [
    { label: 'Q1', start: 0, end: 2 },
    { label: 'Q2', start: 3, end: 5 },
    { label: 'Q3', start: 6, end: 8 },
    { label: 'Q4', start: 9, end: 11 }
  ];

  function getMonthIndex(dateStr: string) {
    return new Date(dateStr).getMonth();
  }

  function getBarPosition(startDate: string, endDate: string) {
    const start = getMonthIndex(startDate);
    const end = getMonthIndex(endDate);
    return { left: (start / 12) * 100, width: ((end - start + 1) / 12) * 100 };
  }

  const GanttChart: React.FC<{
    campaigns: Campaign[];
    selectedCampaign: Campaign | null;
    setSelectedCampaign: (c: Campaign) => void;
  }> = ({ campaigns, selectedCampaign, setSelectedCampaign }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      {/* Временная шкала */}
      <div className="mb-2 flex">
        {quarters.map(q => (
          <div key={q.label} className="text-center text-xs font-bold text-gray-400" style={{ width: `${((q.end-q.start+1)/12)*100}%` }}>
            {q.label}
          </div>
        ))}
      </div>
      <div className="flex mb-4">
        {months.map(m => (
          <div key={m} className="flex-1 text-center text-xs text-gray-500">
            {m}
          </div>
        ))}
      </div>
      {/* Кампании */}
      <div className="relative h-56">
        {campaigns.map((c, i) => {
          const { left, width } = getBarPosition(c.startDate, c.endDate);
          return (
            <div
              key={c.id}
              className={`absolute flex items-center cursor-pointer transition-all duration-200 ${selectedCampaign?.id === c.id ? 'ring-2 ring-cyan-400 z-10' : ''}`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                top: `${i * 44}px`,
                height: '36px',
                background: c.color,
                borderRadius: '12px',
                boxShadow: selectedCampaign?.id === c.id ? '0 0 0 4px rgba(34,211,238,0.2)' : undefined,
                opacity: 0.95
              }}
              onClick={() => setSelectedCampaign(c)}
            >
              <span className="pl-4 pr-4 py-1 text-white font-semibold text-base truncate w-full">
                {c.name}
              </span>
            </div>
          );
        })}
        {/* Горизонтальные линии */}
        {campaigns.map((_, i) => (
          <div key={i} className="absolute left-0 right-0" style={{ top: `${i * 44 + 36}px`, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
        ))}
      </div>
    </div>
  );

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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Sidebar - Campaign Manager */}
                <div className="lg:col-span-1">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                      <Folder className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Campaign Manager</h3>
                  </div>
                  
                  <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="space-y-2">
                      {/* Client Section */}
                      <div>
                        <button
                          onClick={() => toggleSection('Client')}
                          className="flex items-center w-full text-left p-2 hover:bg-white/10 rounded-md transition-colors"
                        >
                          {expandedSections.has('Client') ? (
                            <ChevronDown className="w-4 h-4 mr-2 text-cyan-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 mr-2 text-cyan-400" />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">Client</span>
                        </button>
                        
                        {expandedSections.has('Client') && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-6 space-y-1"
                          >
                            {/* Campaigns */}
                            <div>
                              <button
                                onClick={() => toggleSection('Campaigns')}
                                className="flex items-center w-full text-left p-1 hover:bg-white/10 rounded text-sm transition-colors"
                              >
                                {expandedSections.has('Campaigns') ? (
                                  <ChevronDown className="w-3 h-3 mr-2 text-cyan-400" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 mr-2 text-cyan-400" />
                                )}
                                <span className="text-gray-700 dark:text-gray-300">Campaigns</span>
                              </button>
                              {expandedSections.has('Campaigns') && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="ml-4 space-y-1"
                                >
                                  {/* Q1 Campaign */}
                                  <div>
                                    <button
                                      onClick={() => toggleSection('Q1')}
                                      className="flex items-center w-full text-left p-1 hover:bg-white/10 rounded text-sm transition-colors"
                                    >
                                      {expandedSections.has('Q1') ? (
                                        <ChevronDown className="w-3 h-3 mr-2 text-cyan-400" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3 mr-2 text-cyan-400" />
                                      )}
                                      <span className="text-gray-600 dark:text-gray-400">Q1 Campaign</span>
                                    </button>
                                    {expandedSections.has('Q1') && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="ml-4 space-y-1"
                                      >
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • HCP Email 1to1
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • F2F Calls
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • Web Virtual Calls
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • Phone Calls
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>

                                  {/* Q2 Campaign */}
                                  <div>
                                    <button
                                      onClick={() => toggleSection('Q2')}
                                      className="flex items-center w-full text-left p-1 hover:bg-white/10 rounded text-sm transition-colors"
                                    >
                                      {expandedSections.has('Q2') ? (
                                        <ChevronDown className="w-3 h-3 mr-2 text-cyan-400" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3 mr-2 text-cyan-400" />
                                      )}
                                      <span className="text-gray-600 dark:text-gray-400">Q2 Campaign</span>
                                    </button>
                                    {expandedSections.has('Q2') && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="ml-4 space-y-1"
                                      >
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • HCP Email 1to1
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • F2F Calls
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • Web Virtual Calls
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • Phone Calls
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>

                                  {/* Q3 Campaign */}
                                  <div>
                                    <button
                                      onClick={() => toggleSection('Q3')}
                                      className="flex items-center w-full text-left p-1 hover:bg-white/10 rounded text-sm transition-colors"
                                    >
                                      {expandedSections.has('Q3') ? (
                                        <ChevronDown className="w-3 h-3 mr-2 text-cyan-400" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3 mr-2 text-cyan-400" />
                                      )}
                                      <span className="text-gray-600 dark:text-gray-400">Q3 Campaign</span>
                                    </button>
                                    {expandedSections.has('Q3') && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="ml-4 space-y-1"
                                      >
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • HCP Email 1to1
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • F2F Calls
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • Web Virtual Calls
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • Phone Calls
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>

                                  {/* Q4 Campaign */}
                                  <div>
                                    <button
                                      onClick={() => toggleSection('Q4')}
                                      className="flex items-center w-full text-left p-1 hover:bg-white/10 rounded text-sm transition-colors"
                                    >
                                      {expandedSections.has('Q4') ? (
                                        <ChevronDown className="w-3 h-3 mr-2 text-cyan-400" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3 mr-2 text-cyan-400" />
                                      )}
                                      <span className="text-gray-600 dark:text-gray-400">Q4 Campaign</span>
                                    </button>
                                    {expandedSections.has('Q4') && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="ml-4 space-y-1"
                                      >
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • HCP Email 1to1
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • F2F Calls
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • Web Virtual Calls
                                        </div>
                                        <div className="p-1 text-xs text-gray-500 dark:text-gray-500 hover:bg-white/10 rounded cursor-pointer transition-colors">
                                          • Phone Calls
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </div>
                            
                            {/* Digital - теперь интегрировано в кварталы */}
                            <div>
                              <button
                                onClick={() => toggleSection('Digital')}
                                className="flex items-center w-full text-left p-1 hover:bg-white/10 rounded text-sm transition-colors"
                              >
                                {expandedSections.has('Digital') ? (
                                  <ChevronDown className="w-3 h-3 mr-2 text-cyan-400" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 mr-2 text-cyan-400" />
                                )}
                                <span className="text-gray-700 dark:text-gray-300">Digital (Integrated)</span>
                              </button>
                              {expandedSections.has('Digital') && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="ml-4 space-y-1"
                                >
                                  <div className="ml-4 p-1 text-sm text-gray-600 dark:text-gray-400">
                                    Integrated into quarterly campaigns
                                  </div>
                                  <div className="ml-4 p-1 text-sm text-gray-600 dark:text-gray-400">
                                    • HCP Email 1to1 (All Quarters)
                                  </div>
                                  <div className="ml-4 p-1 text-sm text-gray-600 dark:text-gray-400">
                                    • Digital Display (Q1-Q4)
                                  </div>
                                  <div className="ml-4 p-1 text-sm text-gray-600 dark:text-gray-400">
                                    • Digital HiiV Social (Q1-Q4)
                                  </div>
                                </motion.div>
                              )}
                            </div>
                            
                            {/* Sales Force - теперь интегрировано в кварталы */}
                            <div>
                              <button
                                onClick={() => toggleSection('Sales Force')}
                                className="flex items-center w-full text-left p-1 hover:bg-white/10 rounded text-sm transition-colors"
                              >
                                {expandedSections.has('Sales Force') ? (
                                  <ChevronDown className="w-3 h-3 mr-2 text-cyan-400" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 mr-2 text-cyan-400" />
                                )}
                                <span className="text-gray-700 dark:text-gray-300">Sales Force (Integrated)</span>
                              </button>
                              {expandedSections.has('Sales Force') && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="ml-4 space-y-1"
                                >
                                  <div className="ml-4 p-1 text-sm text-gray-600 dark:text-gray-400">
                                    Integrated into quarterly campaigns
                                  </div>
                                  <div className="ml-4 p-1 text-sm text-gray-600 dark:text-gray-400">
                                    • F2F Calls (All Quarters)
                                  </div>
                                  <div className="ml-4 p-1 text-sm text-gray-600 dark:text-gray-400">
                                    • Web Virtual Calls (All Quarters)
                                  </div>
                                  <div className="ml-4 p-1 text-sm text-gray-600 dark:text-gray-400">
                                    • Phone Calls (All Quarters)
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content - Campaign List заменяем на GanttChart */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                      <Activity className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Active Campaigns</h3>
                  </div>
                  <GanttChart
                    campaigns={campaigns}
                    selectedCampaign={selectedCampaign}
                    setSelectedCampaign={setSelectedCampaign}
                  />
                </div>

                {/* Right Sidebar - Campaign Insights */}
                <div className="lg:col-span-1">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                      <Eye className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Campaign Insights</h3>
                  </div>
                  
                  <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4">
                    {selectedCampaign ? (
                      <div className="space-y-6">
                        {/* Campaign Header */}
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{selectedCampaign.name}</h4>
                          <Button variant="outline" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium flex items-center border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                            <Eye className="w-4 h-4 mr-1" />
                            View Campaign Insights
                          </Button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg p-3">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCampaign.initiatives}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Initiatives</div>
                          </div>
                          <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg p-3">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCampaign.channels}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Channels</div>
                          </div>
                        </div>

                        {/* Breakdown */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Breakdown</h5>
                          <div className="space-y-3">
                            {(showMoreBreakdown ? breakdownData : breakdownData.slice(0, 4)).map((item) => (
                              <div key={item.name} className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <div className="text-gray-500 dark:text-gray-400">{item.icon}</div>
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.blocks} blocks</span>
                                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className="h-2 rounded-full"
                                      style={{
                                        width: `${item.percentage}%`,
                                        backgroundColor: item.color
                                      }}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{item.percentage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {breakdownData.length > 4 && (
                            <Button
                              variant="outline"
                              onClick={() => setShowMoreBreakdown(!showMoreBreakdown)}
                              className="text-cyan-600 hover:text-cyan-700 text-sm font-medium mt-3 border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                            >
                              {showMoreBreakdown ? 'Show less' : `Show more (${breakdownData.length - 4})`}
                            </Button>
                          )}
                        </div>

                        {/* Details */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Details</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <Folder className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">Category: {selectedCampaign.category}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {new Date(selectedCampaign.startDate).toLocaleDateString()} - {new Date(selectedCampaign.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p>Select a campaign to view insights</p>
                      </div>
                    )}
                  </div>
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