import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from "framer-motion";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { useDemoDashboardData } from '@/hooks/useDemoDashboardData';

// The figures that used to live here are now in Supabase (`demo_dashboard_data`),
// loaded by useDemoDashboardData. They were hardcoded in three different shapes and
// disagreed with each other: the spend split summed to 99%, the bar chart showed
// Sales as 1200 while the table showed 21.3M, and Total Spend read $265K when the
// story's budget is $1.2M.

const COLORS = [
  'var(--chart-senary)',    // #3b82f6 -> blue-500
  'var(--chart-quinary)',   // #82ca9d -> green-400  
  'var(--chart-secondary)', // #a855f7 -> purple-500
  'var(--text-muted)'       // #6b7280 -> gray-500
];

const GRADIENT_PAIRS = [
  ['var(--chart-senary)', 'var(--chart-senary)'],
  ['var(--chart-quinary)', 'var(--chart-quinary)'],
  ['var(--chart-secondary)', 'var(--chart-secondary)'],
  ['var(--text-muted)', 'var(--text-muted)']
];

const AllocationChart = ({ title, data }: { title: string; data: { name: string; value: number }[] }) => (
  <div className="backdrop-blur-[2px] bg-background/5 border border-border/10 rounded-xl p-4">
    <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
    <div style={{ width: '100%', height: 340 }}>
      <ResponsiveContainer>
        <PieChart>
          {/* Gradient definitions */}
          <defs>
            {GRADIENT_PAIRS.map(([start, end], idx) => (
              <linearGradient key={idx} id={`allocGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={start} />
                <stop offset="100%" stopColor={end} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            stroke="none"
            strokeWidth={0}
            cornerRadius={4}
            paddingAngle={5}
            dataKey="value"
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
              const RADIAN = Math.PI / 180;
              const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text
                  x={x}
                  y={y}
                  fill="var(--chart-tooltip-text)"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fontSize: 14, fontWeight: 600 }}
                >
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`url(#allocGrad-${index % GRADIENT_PAIRS.length})`} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--chart-tooltip-bg)',
              border: '1px solid var(--chart-tooltip-border)',
              color: 'var(--chart-tooltip-text)',
              borderRadius: '12px',
              backdropFilter: 'blur(12px)',
              padding: '8px 12px'
            }}
            itemStyle={{ color: 'var(--chart-tooltip-text)' }}
            labelStyle={{ color: 'var(--chart-tooltip-text)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-4 space-y-2">
      {data.map((entry, index) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(180deg, ${GRADIENT_PAIRS[index % GRADIENT_PAIRS.length][0]}, ${GRADIENT_PAIRS[index % GRADIENT_PAIRS.length][1]})` }} />
          <span className="text-base font-medium text-foreground">{entry.name}</span>
        </div>
      ))}
    </div>
  </div>
);

const ScenarioComparison = () => {
  const { data: demo, loading, error } = useDemoDashboardData();

  const sc = demo?.scenario_comparison;
  const sa = demo?.spend_allocation;

  const salesForecastData = demo?.sales_forecast?.points ?? [];
  const roiForecastData = demo?.roi_forecast?.points ?? [];

  const currentSpendData = (sa?.channels ?? []).map(c => ({ name: c.name, value: c.current_pct }));
  const optimizedSpendData = (sa?.channels ?? []).map(c => ({ name: c.name, value: c.optimized_pct }));

  // One row per scenario, in $M, so the chart and the table below cannot disagree.
  const scenarioComparisonData = (sc?.scenarios ?? [])
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .map(x => ({
      name: x.label,
      Sales: x.total_sales_m,
      Spend: x.total_spend_m,
      ROI: x.incremental_roi,
    }));

  const fmtM = (v: number) => `$${v.toFixed(2)}M`;
  const scenarios = (sc?.scenarios ?? []).slice().sort((a, b) => a.sort - b.sort);
  const byKey = (k: string) => scenarios.find(x => x.key === k);
  const roiLabel = sc?.roi_label ?? 'Incremental ROI';

  const comparisonTableData = {
    metrics: [
      { metric: 'Total Sales',  ...Object.fromEntries(scenarios.map(x => [x.key, fmtM(x.total_sales_m)])) },
      { metric: 'Media Spend',  ...Object.fromEntries(scenarios.map(x => [x.key, fmtM(x.total_spend_m)])) },
      { metric: roiLabel,       ...Object.fromEntries(scenarios.map(x => [x.key, `${x.incremental_roi.toFixed(1)}x`])) },
      { metric: 'Profit Margin',...Object.fromEntries(scenarios.map(x => [x.key, `${x.profit_margin_pct}%`])) },
    ] as Array<Record<string, string>>,
    channels: Object.keys(byKey('baseline')?.channel_roi ?? {}).map(ch => ({
      channel: ch,
      ...Object.fromEntries(scenarios.map(x => [x.key, `${(x.channel_roi[ch] ?? 0).toFixed(1)}x`])),
    })) as Array<Record<string, string>>,
  };

  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const hoverTint = (label: string | null) => {
    switch (label) {
      case 'Baseline':
        return 'rgba(34,211,238,0.10)'; // cyan tint
      case 'Optimistic':
        return 'rgba(34,197,94,0.10)'; // green tint
      case 'Pessimistic':
        return 'rgba(239,68,68,0.10)'; // red tint
      default:
        return 'rgba(255,255,255,0.06)';
    }
  };
  const parseValue = (valueStr: string) => {
    return parseFloat(valueStr.replace(/[$,%xM]/g, ''));
  };

  // Say so rather than drawing empty axes. These figures come from Supabase; if they
  // cannot be read, a blank chart looks like a result and an invented fallback would be
  // worse still.
  if (loading) {
    return (
      <div className="space-y-8 mt-12 pb-24">
        <h2 className="text-3xl font-bold text-foreground text-glow">Scenario Comparison</h2>
        <div className="h-64 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
      </div>
    );
  }

  if (error || !sc || scenarios.length === 0) {
    return (
      <div className="space-y-8 mt-12 pb-24">
        <h2 className="text-3xl font-bold text-foreground text-glow">Scenario Comparison</h2>
        <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-sm text-muted-foreground">
          Scenario data is unavailable{error ? `: ${error}` : '.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-12 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground text-glow">Scenario Comparison</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((x, i) => {
          const tone =
            x.key === 'optimistic'
              ? { icon: TrendingUp,   text: 'text-green-400', ring: 'border-green-500/30', bg: 'from-green-500/20 to-emerald-500/20', badge: 'border-green-500/30 text-green-400 bg-green-500/10' }
              : x.key === 'pessimistic'
              ? { icon: TrendingDown, text: 'text-red-400',   ring: 'border-red-500/30',   bg: 'from-red-500/20 to-rose-500/20',     badge: 'border-red-500/30 text-red-400 bg-red-500/10' }
              : { icon: Target,       text: 'text-cyan-400',  ring: 'border-cyan-500/30',  bg: 'from-cyan-500/20 to-blue-500/20',    badge: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10' };
          const Icon = tone.icon;
          // Spend relative to Baseline — the badge used to be a hardcoded "+15%" that
          // no longer had to agree with the spend it described.
          const base = byKey('baseline');
          const deltaPct = base ? Math.round((x.total_spend_m / base.total_spend_m - 1) * 100) : 0;

          return (
            <motion.div
              key={x.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${tone.bg} border ${tone.ring}`}>
                      <Icon className={`w-5 h-5 ${tone.text}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{x.label}</h3>
                  </div>
                  <Badge variant="outline" className={tone.badge}>
                    {deltaPct === 0 ? 'Current Spend' : `${deltaPct > 0 ? '+' : ''}${deltaPct}% Spend`}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{fmtM(x.total_sales_m)}</span>
                    <span className="text-sm text-gray-600 dark:text-white/60">Projected Sales</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600 dark:text-white/80">
                      <span>Media Spend:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{fmtM(x.total_spend_m)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-white/80">
                      <span>{roiLabel}:</span>
                      <span className={`font-semibold ${tone.text}`}>{x.incremental_roi.toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-white/80">
                      <span>SF Calls ROI:</span>
                      <span className={`font-semibold ${tone.text}`}>{(x.channel_roi['SF Calls'] ?? 0).toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-white/80">
                      <span>Digital ROI:</span>
                      <span className={`font-semibold ${tone.text}`}>{(x.channel_roi['Digital'] ?? 0).toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Tabs defaultValue="sales_forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-1">
          <TabsTrigger 
            value="sales_forecast" 
            className="rounded-lg hover:bg-white/5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/15 data-[state=active]:to-blue-500/15 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-white/10"
          >
            Sales Forecast
          </TabsTrigger>
          <TabsTrigger 
            value="roi_forecast" 
            className="rounded-lg hover:bg-white/5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/15 data-[state=active]:to-fuchsia-500/15 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-white/10"
          >
            ROI Forecast
          </TabsTrigger>
          <TabsTrigger 
            value="spend_allocation" 
            className="rounded-lg hover:bg-white/5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/15 data-[state=active]:to-green-500/15 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-white/10"
          >
            Spend Allocation
          </TabsTrigger>
          <TabsTrigger 
            value="scenario_comparison" 
            className="rounded-lg hover:bg-white/5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/15 data-[state=active]:to-blue-500/15 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-white/10"
          >
            Scenario Comparison
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sales_forecast" className="mt-6">
            <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sales Forecast</h3>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={salesForecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--chart-axis)' }} />
                        <YAxis 
                          tick={{ fill: 'var(--chart-axis)' }} 
                          domain={[12, 26]}
                          tickFormatter={(value) => `${Number(value).toFixed(1)}M`}
                        />
                        <Tooltip
                          cursor={{ stroke: 'var(--chart-hover-ring)', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{
                                background: 'var(--chart-tooltip-bg)',
                                borderColor: 'var(--chart-tooltip-border)',
                                color: 'var(--chart-tooltip-text)',
                                borderRadius: '8px',
                                backdropFilter: 'blur(10px)'
                            }}
                            formatter={(value, name) => [`${Number(value).toFixed(1)}M`, name]}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="actual" stroke="var(--chart-secondary)" name="Actual Sales" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="baseline" stroke="var(--chart-quinary)" name="Forecast (Baseline)" />
                        <Line type="monotone" dataKey="optimistic" stroke="var(--chart-senary)" name="Forecast (Optimistic)" />
                        <Line type="monotone" dataKey="pessimistic" stroke="var(--chart-quaternary)" name="Forecast (Pessimistic)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </TabsContent>
        <TabsContent value="roi_forecast" className="mt-6">
          <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ROI Forecast</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={roiForecastData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--chart-axis)' }} />
                    <YAxis tickFormatter={(value) => `${value.toFixed(1)}x`} tick={{ fill: 'var(--chart-axis)' }} label={{ value: 'ROI (x)', angle: -90, position: 'insideLeft', fill: 'var(--chart-axis)' }} />
                    <Tooltip
                      cursor={{ stroke: 'var(--chart-hover-ring)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        contentStyle={{
                            background: 'var(--chart-tooltip-bg)',
                            borderColor: 'var(--chart-tooltip-border)',
                            color: 'var(--chart-tooltip-text)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}x`, 'ROI']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sf_calls" stroke="var(--chart-senary)" name="SF Calls ROI" />
                    <Line type="monotone" dataKey="digital" stroke="var(--chart-quinary)" name="Digital ROI" />
                    <Line type="monotone" dataKey="email" stroke="var(--chart-secondary)" name="Email ROI" />
                    <Line type="monotone" dataKey="overall" stroke="var(--chart-tertiary)" name="Overall ROI" strokeDasharray="5 5"/>
                </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        <TabsContent value="spend_allocation" className="mt-6">
          <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <PieChartIcon className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Spend Allocation</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <AllocationChart title="Current Spend Allocation" data={currentSpendData} />
                <AllocationChart title="Optimized Spend Allocation" data={optimizedSpendData} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="scenario_comparison" className="mt-6">
          <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Scenario Comparison</h3>
            </div>
            <ResponsiveContainer width="100%" height={380}>
                <BarChart 
                  data={scenarioComparisonData}
                  margin={{ left: 70, right: 20, top: 20, bottom: 5 }}
                  onMouseMove={(state: { activeLabel?: string } | undefined) => setHoverLabel(state?.activeLabel ?? null)}
                  onMouseLeave={() => setHoverLabel(null)}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--chart-axis)' }} />
                    <YAxis yAxisId="left" orientation="left" stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-axis)' }}>
                      <Label
                        content={({ viewBox }) => {
                          const vb = (viewBox || {}) as { x?: number; y?: number; width?: number; height?: number };
                          const x = (vb.x ?? 0) - 40; // pull slightly left of axis line
                          const y = (vb.y ?? 0) + ((vb.height ?? 0) / 2); // vertical center of chart area
                          return (
                            <text x={x} y={y} fill="var(--chart-axis)" textAnchor="middle" transform={`rotate(-90, ${x}, ${y})`}>
                              Total Sales ($M)
                            </text>
                          );
                        }}
                      />
                    </YAxis>
                    <YAxis yAxisId="right" orientation="right" stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-axis)' }}>
                      <Label
                        content={({ viewBox }) => {
                          const vb = (viewBox || {}) as { x?: number; y?: number; width?: number; height?: number };
                          const x = (vb.x ?? 0) + (vb.width ?? 0) + 40;
                          const y = (vb.y ?? 0) + ((vb.height ?? 0) / 2);
                          return (
                            <text x={x} y={y} fill="var(--chart-axis)" textAnchor="middle" transform={`rotate(90, ${x}, ${y})`}>
                              Media Spend ($M)
                            </text>
                          );
                        }}
                      />
                    </YAxis>
                    <Tooltip
                        cursor={{ fill: hoverTint(hoverLabel), opacity: 1 }}
                        contentStyle={{
                            background: 'var(--chart-tooltip-bg)',
                            borderColor: 'var(--chart-tooltip-border)',
                            color: 'var(--chart-tooltip-text)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)'
                        }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Sales" name="Total Sales ($M)" fill="var(--chart-primary)" className="hover:opacity-90" />
                    <Bar yAxisId="right" dataKey="Spend" name="Media Spend ($M)" fill="var(--chart-secondary)" className="hover:opacity-90" />
                </BarChart>
            </ResponsiveContainer>
            <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Metrics Comparison</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="p-2 text-gray-600 dark:text-white/80">Metric</th>
                                    <th className="p-2 text-gray-600 dark:text-white/80">Baseline</th>
                                    <th className="p-2 text-gray-600 dark:text-white/80">Optimistic</th>
                                    <th className="p-2 text-gray-600 dark:text-white/80">Pessimistic</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonTableData.metrics.map(row => (
                                    <tr key={row.metric} className="border-b border-white/10">
                                        <td className="p-2 font-semibold text-gray-900 dark:text-white">{row.metric}</td>
                                        <td className="p-2 text-gray-600 dark:text-white/80">{row.baseline}</td>
                                        <td className="p-2 text-green-400">{row.optimistic}</td>
                                        <td className="p-2 text-red-400">{row.pessimistic}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Channel Performance by Scenario</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="p-2 text-gray-600 dark:text-white/80">Channel</th>
                                    <th className="p-2 text-gray-600 dark:text-white/80">Baseline</th>
                                    <th className="p-2 text-gray-600 dark:text-white/80">Optimistic</th>
                                    <th className="p-2 text-gray-600 dark:text-white/80">Pessimistic</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonTableData.channels.map(row => (
                                    <tr key={row.channel} className="border-b border-white/10">
                                        <td className="p-2 font-semibold text-gray-900 dark:text-white">{row.channel}</td>
                                        <td className="p-2 text-gray-600 dark:text-white/80">{row.baseline}</td>
                                        <td className="p-2 text-green-400">{row.optimistic}</td>
                                        <td className="p-2 text-red-400">{row.pessimistic}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScenarioComparison; 