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

// Values in $M (e.g., 12 => $12M)
const salesForecastData = [
  // Actuals: 12 → 17 through Jun
  { name: 'Jan', actual: 12, baseline: 12.5, optimistic: 12.5, pessimistic: 12.5 },
  { name: 'Feb', actual: 13, baseline: 14.0, optimistic: 14.0, pessimistic: 14.0 },
  { name: 'Mar', actual: 14, baseline: 15.5, optimistic: 15.5, pessimistic: 15.5 },
  { name: 'Apr', actual: 15, baseline: 16.5, optimistic: 16.5, pessimistic: 16.5 },
  { name: 'May', actual: 16, baseline: 17.0, optimistic: 17.0, pessimistic: 17.0 },
  { name: 'Jun', actual: 17, baseline: 17.5, optimistic: 17.5, pessimistic: 17.5 },
  // Forecasts start in Jul: Baseline to 21, Optimistic to 25.5, Pessimistic to ~15.5 by Dec
  { name: 'Jul', actual: 13.5, baseline: 18.0, optimistic: 20.5, pessimistic: 13.5 },
  { name: 'Aug', actual: 14.0, baseline: 18.5, optimistic: 21.5, pessimistic: 14.0 },
  { name: 'Sep', actual: 14.5, baseline: 19.0, optimistic: 22.5, pessimistic: 14.5 },
  { name: 'Oct', actual: 15.0, baseline: 19.5, optimistic: 23.5, pessimistic: 15.0 },
  { name: 'Nov', actual: 15.5, baseline: 20.0, optimistic: 24.5, pessimistic: 15.2 },
  { name: 'Dec', actual: 16.0, baseline: 20.5, optimistic: 25.5, pessimistic: 15.5 },
];

const roiForecastData = [
    { name: 'Jul', sf_calls: 2.4, digital: 3.1, email: 2.1, overall: 2.7 },
    { name: 'Aug', sf_calls: 2.5, digital: 3.2, email: 2.2, overall: 2.8 },
    { name: 'Sep', sf_calls: 2.6, digital: 3.3, email: 2.3, overall: 2.9 },
    { name: 'Oct', sf_calls: 2.7, digital: 3.4, email: 2.4, overall: 3.0 },
    { name: 'Nov', sf_calls: 2.8, digital: 3.5, email: 2.5, overall: 3.1 },
    { name: 'Dec', sf_calls: 2.9, digital: 3.6, email: 2.6, overall: 3.2 },
];

const currentSpendData = [
    { name: 'SF Calls', value: 45 },
    { name: 'Digital', value: 30 },
    { name: '1-to-1 Email', value: 15 },
    { name: 'Other', value: 9 },
];

const optimizedSpendData = [
    { name: 'SF Calls', value: 50 },
    { name: 'Digital', value: 33 },
    { name: '1-to-1 Email', value: 10 },
    { name: 'Other', value: 7 },
];

const scenarioComparisonData = [
    { name: 'Baseline', Sales: 1200, Spend: 265, ROI: 2.7 },
    { name: 'Optimistic', Sales: 1400, Spend: 305, ROI: 2.9 },
    { name: 'Pessimistic', Sales: 1050, Spend: 239, ROI: 2.4 },
];

const comparisonTableData = {
    metrics: [
        { metric: 'Total Sales', baseline: '21.3', optimistic: '24.5M', pessimistic: '19.17M' },
        { metric: 'Total Spend', baseline: '$265K', optimistic: '$305K', pessimistic: '$239K' },
        { metric: 'Overall ROI', baseline: '2.7x', optimistic: '2.9x', pessimistic: '2.4x' },
        { metric: 'Profit Margin', baseline: '18%', optimistic: '21%', pessimistic: '15%' },
    ],
    channels: [
        { channel: 'SF Calls', baseline: '2.4x', optimistic: '2.6x', pessimistic: '2.1x' },
        { channel: 'Digital', baseline: '3.1x', optimistic: '3.4x', pessimistic: '2.8x' },
        { channel: '1-to-1 Email', baseline: '2.1x', optimistic: '2.3x', pessimistic: '1.9x' },
        { channel: 'Web Virtual Calls', baseline: '2.5x', optimistic: '2.8x', pessimistic: '2.0x' },
    ]
};

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

const AllocationChart = ({ title, data }: { title: string; data: typeof currentSpendData }) => (
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

  return (
    <div className="space-y-8 mt-12 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground text-glow">Scenario Comparison</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Baseline Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current</h3>
              </div>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">0.7M Spend</Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">$21.3M</span>
                <span className="text-sm text-gray-600 dark:text-white/60">Actual Sales</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-white/80">
                  <span>SF Calls ROI:</span>
                  <span className="font-semibold text-cyan-400">2.4x</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-white/80">
                  <span>Digital ROI:</span>
                  <span className="font-semibold text-cyan-400">3.1x</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Optimistic Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Optimistic</h3>
              </div>
              <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">+15% Spend</Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">$24.5M</span>
                <span className="text-sm text-gray-600 dark:text-white/60">Projected Sales</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-white/80">
                  <span>SF Calls ROI:</span>
                  <span className="font-semibold text-green-400">2.6x</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-white/80">
                  <span>Digital ROI:</span>
                  <span className="font-semibold text-green-400">3.4x</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pessimistic Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pessimistic</h3>
              </div>
              <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10">-10% Spend</Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">$19.17M</span>
                <span className="text-sm text-gray-600 dark:text-white/60">Projected Sales</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-white/80">
                  <span>SF Calls ROI:</span>
                  <span className="font-semibold text-red-400">2.1x</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-white/80">
                  <span>Digital ROI:</span>
                  <span className="font-semibold text-red-400">2.8x</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
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
                              Value (Sales Volume & Spend in $K)
                            </text>
                          );
                        }}
                      />
                    </YAxis>
                    <YAxis yAxisId="right" orientation="right" stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-axis)' }} />
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
                    <Legend formatter={(value) => (value === 'Sales' ? 'Sales Volume' : value)} />
                    <Bar yAxisId="left" dataKey="Sales" name="Sales Volume" fill="var(--chart-primary)" className="hover:opacity-90" />
                    <Bar yAxisId="left" dataKey="Spend" fill="var(--chart-secondary)" className="hover:opacity-90" />
                    <Line yAxisId="right" type="monotone" dataKey="ROI" stroke="var(--metric-key)" />
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