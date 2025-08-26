import React, { useState } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// Utility to generate smooth diminishing curves for demonstration
const generateDiminishingData = () => {
  const maxSpend = 850000; // max x value from screenshot
  const channels = [
    { key: 'sf_calls', label: 'SF Calls', color: 'var(--chart-primary)', k: 1.2, max: 90000 },
    { key: 'digital', label: 'Digital', color: 'var(--chart-quaternary)', k: 0.8, max: 65000 },
    { key: 'email', label: 'Email', color: 'var(--chart-tertiary)', k: 0.6, max: 50000 },
    { key: 'other', label: 'Other', color: 'var(--chart-quinary)', k: 0.4, max: 30000 },
  ];
  const points = 120;
  const data: Record<string, number>[] = [];
  for (let i = 0; i < points; i++) {
    const spend = (i / (points - 1)) * maxSpend;
    const row: Record<string, number> = { spend };
    channels.forEach(({ key, k, max }) => {
      row[key] = max * (1 - Math.exp(-(k * spend) / maxSpend));
    });
    data.push(row);
  }
  return { data, channels };
};

// Utility to create stacked share-of-spend data for 100% stacked area
const generateBudgetShareData = () => {
  const maxSpend = 2000000;
  const steps = 80;
  interface BudgetShare { totalSpend: number; sf_calls: number; digital: number; email: number; other: number; }
  const data: BudgetShare[] = [];
  for (let i = 0; i < steps; i++) {
    const spend = (i / (steps - 1)) * maxSpend;
    // simplistic allocation rules that slowly shift shares
    const sfShare = Math.max(0.1, 0.6 - 0.3 * (i / (steps - 1)));
    const digitalShare = Math.max(0.1, 0.25 + 0.25 * (i / (steps - 1)));
    const emailShare = Math.max(0.05, 0.1 - 0.02 * (i / (steps - 1)));
    const otherShare = 1 - sfShare - digitalShare - emailShare;
    data.push({
      totalSpend: spend,
      sf_calls: sfShare,
      digital: digitalShare,
      email: emailShare,
      other: otherShare,
    });
  }
  return data;
};

const { data: diminishingData, channels: diminishingChannels } = generateDiminishingData();
const budgetShareData = generateBudgetShareData();

    // Channel colors — in Sales Volume Breakdown style
const CHANNEL_TOKENS: Record<string, string> = {
  sf_calls: 'var(--chart-primary)',
  digital: 'var(--chart-quaternary)',
  email: 'var(--chart-tertiary)',
  other: 'var(--chart-quinary)'
};

const TailoredPresentation: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [diminishingCollapsed, setDiminishingCollapsed] = useState(false);
  const [budgetCollapsed, setBudgetCollapsed] = useState(false);
  const { theme } = useTheme();
  const getColor = (key: string) => CHANNEL_TOKENS[key as keyof typeof CHANNEL_TOKENS];

  return (
    <div className="space-y-8 mt-12 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground text-glow">
          Diminishing return curves
        </h2>
        <Button
          variant="outline"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="border-accent/50 text-foreground hover:bg-accent/20 hover:text-accent-foreground"
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

      {/* Diminishing Curves Chart */}
      <div className="backdrop-blur-[2px] bg-background/5 border border-border/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Diminishing Curves for Each Channel
          </h3>
          <Button
            variant="ghost"
            onClick={() => setDiminishingCollapsed(!diminishingCollapsed)}
            className="text-foreground hover:bg-accent/20 p-2"
          >
            {diminishingCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {!diminishingCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={diminishingData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis
                      dataKey="spend"
                      stroke="var(--chart-axis)"
                      fontSize={12}
                      tickFormatter={(v) => `${(v / 1000).toLocaleString()}K`}
                      label={{ value: 'Spend', position: 'insideBottomRight', offset: -8, fill: 'var(--chart-axis)', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="var(--chart-axis)"
                      fontSize={12}
                      tickFormatter={(v) => v.toLocaleString()}
                      label={{ value: 'Sales Value', angle: -90, position: 'insideLeft', fill: 'var(--chart-axis)', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--chart-tooltip-bg)',
                        border: '1px solid var(--chart-tooltip-border)',
                        borderRadius: '8px',
                        color: 'var(--chart-tooltip-text)',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value: number) => value.toLocaleString()}
                    />
                    <Legend />
                    {/* Gradients for diminishing curves area fill */}
                    <defs>
                      {diminishingChannels.map((ch) => (
                        <linearGradient key={ch.key} id={`dimGrad-${ch.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={getColor(ch.key)} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={getColor(ch.key)} stopOpacity={0.05} />
                        </linearGradient>
                      ))}
                    </defs>
                    {diminishingChannels.map((ch) => (
                      <Line
                        key={ch.key}
                        type="monotone"
                        dataKey={ch.key}
                        stroke={getColor(ch.key)}
                        dot={false}
                        strokeWidth={2}
                      />
                    ))}
                    {/* Area shadows */}
                    {diminishingChannels.map((ch) => (
                       <Area
                         key={ch.key + '-area'}
                         type="monotone"
                         dataKey={ch.key}
                         stroke="none"
                         fill={`url(#dimGrad-${ch.key})`}
                         fillOpacity={1}
                       />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Total Media Budget Share Chart */}
      <div className="backdrop-blur-[2px] bg-background/5 border border-border/10 rounded-2xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Total Media Budget
          </h3>
          <Button
            variant="ghost"
            onClick={() => setBudgetCollapsed(!budgetCollapsed)}
            className="text-foreground hover:bg-accent/20 p-2"
          >
            {budgetCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {!budgetCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={budgetShareData} stackOffset="expand" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis
                      dataKey="totalSpend"
                      stroke="var(--chart-axis)"
                      fontSize={12}
                      tickFormatter={(v) => (v / 1000000).toFixed(1) + 'M'}
                      label={{ value: 'Total Spend', position: 'insideBottomRight', offset: -8, fill: 'var(--chart-axis)', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="var(--chart-axis)"
                      fontSize={12}
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--chart-tooltip-bg)',
                        border: '1px solid var(--chart-tooltip-border)',
                        borderRadius: '8px',
                        color: 'var(--chart-tooltip-text)',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value: number, name: string) => [ (value * 100).toFixed(1) + '%', name ] }
                    />
                    <Legend formatter={(value) => value.replace('_', ' ').toUpperCase()} />
                    {/* Gradients for channel fill */}
                    <defs>
                      {Object.keys(CHANNEL_TOKENS).map((key) => (
                        <linearGradient key={key} id={`areaGrad-${key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={getColor(key)} stopOpacity={0.9} />
                          <stop offset="95%" stopColor={getColor(key)} stopOpacity={0.1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Area type="monotone" dataKey="sf_calls" stackId="1" stroke={getColor('sf_calls')} fill="url(#areaGrad-sf_calls)" name="SF Calls" />
                    <Area type="monotone" dataKey="digital" stackId="1" stroke={getColor('digital')} fill="url(#areaGrad-digital)" name="Digital" />
                    <Area type="monotone" dataKey="email" stackId="1" stroke={getColor('email')} fill="url(#areaGrad-email)" name="Email" />
                    <Area type="monotone" dataKey="other" stackId="1" stroke={getColor('other')} fill="url(#areaGrad-other)" name="Other" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TailoredPresentation; 