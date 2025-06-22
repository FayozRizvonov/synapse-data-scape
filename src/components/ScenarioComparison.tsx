import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const salesForecastData = [
  { name: 'Jan', actual: 120, baseline: 125, optimistic: 125, pessimistic: 125 },
  { name: 'Feb', actual: 135, baseline: 140, optimistic: 140, pessimistic: 140 },
  { name: 'Mar', actual: 145, baseline: 155, optimistic: 155, pessimistic: 155 },
  { name: 'Apr', actual: 160, baseline: 165, optimistic: 165, pessimistic: 165 },
  { name: 'May', actual: 150, baseline: 170, optimistic: 170, pessimistic: 170 },
  { name: 'Jun', actual: 145, baseline: 175, optimistic: 175, pessimistic: 175 },
  { name: 'Jul', baseline: 180, optimistic: 200, pessimistic: 150 },
  { name: 'Aug', baseline: 185, optimistic: 210, pessimistic: 155 },
  { name: 'Sep', baseline: 190, optimistic: 220, pessimistic: 160 },
  { name: 'Oct', baseline: 195, optimistic: 230, pessimistic: 165 },
  { name: 'Nov', baseline: 200, optimistic: 240, pessimistic: 170 },
  { name: 'Dec', baseline: 205, optimistic: 250, pessimistic: 175 },
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
        { metric: 'Total Sales', baseline: '$1.2M', optimistic: '$1.4M', pessimistic: '$1.05M' },
        { metric: 'Total Spend', baseline: '$265K', optimistic: '$305K', pessimistic: '$239K' },
        { metric: 'Overall ROI', baseline: '2.7x', optimistic: '2.9x', pessimistic: '2.4x' },
        { metric: 'Profit Margin', baseline: '18%', optimistic: '21%', pessimistic: '15%' },
    ],
    channels: [
        { channel: 'SF Calls', baseline: '2.4x', optimistic: '2.6x', pessimistic: '2.1x' },
        { channel: 'Digital', baseline: '3.1x', optimistic: '3.4x', pessimistic: '2.8x' },
        { channel: '1-to-1 Email', baseline: '2.1x', optimistic: '2.3x', pessimistic: '1.9x' },
    ]
};

const COLORS = ['#3b82f6', '#82ca9d', '#a855f7', '#6b7280'];

const AllocationChart = ({ title, data }: { title: string; data: typeof currentSpendData }) => (
    <div className="flex flex-col items-center">
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-white/80">{entry.name}</span>
            </div>
        ))}
      </div>
    </div>
);

const ScenarioComparison = () => {
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
        <Card className="bg-primary/10 border-2 border-primary shadow-2xl shadow-primary/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">Baseline</CardTitle>
              <Badge variant="outline" className="border-primary text-primary">Current Plan</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-white">$1.2M</p>
            <p className="text-sm text-white/70">Projected Sales</p>
            <div className="mt-4 flex justify-between text-white/90">
              <span>SF Calls ROI:</span>
              <span className="font-semibold">2.4x</span>
            </div>
            <div className="flex justify-between text-white/90">
              <span>Digital ROI:</span>
              <span className="font-semibold">3.1x</span>
            </div>
          </CardContent>
        </Card>

        {/* Optimistic Card */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Optimistic</CardTitle>
              <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">+15% Spend</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">$1.4M</p>
            <p className="text-sm text-muted-foreground">Projected Sales</p>
            <div className="mt-4 flex justify-between">
              <span>SF Calls ROI:</span>
              <span className="font-semibold">2.6x</span>
            </div>
            <div className="flex justify-between">
              <span>Digital ROI:</span>
              <span className="font-semibold">3.4x</span>
            </div>
          </CardContent>
        </Card>

        {/* Pessimistic Card */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pessimistic</CardTitle>
              <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">-10% Spend</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">$1.05M</p>
            <p className="text-sm text-muted-foreground">Projected Sales</p>
            <div className="mt-4 flex justify-between">
              <span>SF Calls ROI:</span>
              <span className="font-semibold">2.1x</span>
            </div>
            <div className="flex justify-between">
              <span>Digital ROI:</span>
              <span className="font-semibold">2.8x</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales_forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-white/10">
          <TabsTrigger value="sales_forecast">Sales Forecast</TabsTrigger>
          <TabsTrigger value="roi_forecast">ROI Forecast</TabsTrigger>
          <TabsTrigger value="spend_allocation">Spend Allocation</TabsTrigger>
          <TabsTrigger value="scenario_comparison">Scenario Comparison</TabsTrigger>
        </TabsList>
        <TabsContent value="sales_forecast" className="mt-6">
            <Card className="bg-card/50 border-white/10 p-6">
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={salesForecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis dataKey="name" tick={{ fill: '#a1a1aa' }} />
                        <YAxis tick={{ fill: '#a1a1aa' }} label={{ value: 'Sales (in thousands)', angle: -90, position: 'insideLeft', fill: '#a1a1aa' }} />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(10, 10, 10, 0.8)',
                                borderColor: '#333',
                                color: '#fff'
                            }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="actual" stroke="#8884d8" name="Actual Sales" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="baseline" stroke="#82ca9d" name="Forecast (Baseline)" />
                        <Line type="monotone" dataKey="optimistic" stroke="#3b82f6" name="Forecast (Optimistic)" />
                        <Line type="monotone" dataKey="pessimistic" stroke="#ef4444" name="Forecast (Pessimistic)" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </TabsContent>
        <TabsContent value="roi_forecast" className="mt-6">
          <Card className="bg-card/50 border-white/10 p-6">
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={roiForecastData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#a1a1aa' }} />
                    <YAxis tickFormatter={(value) => `${value.toFixed(1)}x`} tick={{ fill: '#a1a1aa' }} label={{ value: 'ROI (x)', angle: -90, position: 'insideLeft', fill: '#a1a1aa' }} />
                    <Tooltip
                        contentStyle={{
                            background: 'rgba(10, 10, 10, 0.8)',
                            borderColor: '#333',
                            color: '#fff'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}x`, 'ROI']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sf_calls" stroke="#3b82f6" name="SF Calls ROI" />
                    <Line type="monotone" dataKey="digital" stroke="#82ca9d" name="Digital ROI" />
                    <Line type="monotone" dataKey="email" stroke="#a855f7" name="Email ROI" />
                    <Line type="monotone" dataKey="overall" stroke="#f59e0b" name="Overall ROI" strokeDasharray="5 5"/>
                </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
        <TabsContent value="spend_allocation" className="mt-6">
          <Card className="bg-card/50 border-white/10 p-6">
            <div className="grid md:grid-cols-2 gap-8">
                <AllocationChart title="Current Spend Allocation" data={currentSpendData} />
                <AllocationChart title="Optimized Spend Allocation" data={optimizedSpendData} />
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="scenario_comparison" className="mt-6">
          <Card className="bg-card/50 border-white/10 p-6">
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={scenarioComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#a1a1aa' }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tick={{ fill: '#a1a1aa' }} label={{ value: 'Value (Sales & Spend in $K)', angle: -90, position: 'insideLeft', fill: '#a1a1aa' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{ fill: '#a1a1aa' }} />
                    <Tooltip
                        contentStyle={{
                            background: 'rgba(10, 10, 10, 0.8)',
                            borderColor: '#333',
                            color: '#fff'
                        }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Sales" fill="#3b82f6" />
                    <Bar yAxisId="left" dataKey="Spend" fill="#82ca9d" />
                    <Line yAxisId="right" type="monotone" dataKey="ROI" stroke="#f59e0b" />
                </BarChart>
            </ResponsiveContainer>
            <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Key Metrics Comparison</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="p-2 text-white/80">Metric</th>
                                    <th className="p-2 text-white/80">Baseline</th>
                                    <th className="p-2 text-white/80">Optimistic</th>
                                    <th className="p-2 text-white/80">Pessimistic</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonTableData.metrics.map(row => (
                                    <tr key={row.metric} className="border-b border-white/10">
                                        <td className="p-2 font-semibold text-white">{row.metric}</td>
                                        <td className="p-2 text-white/80">{row.baseline}</td>
                                        <td className="p-2 text-green-400">{row.optimistic}</td>
                                        <td className="p-2 text-red-400">{row.pessimistic}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Channel Performance by Scenario</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="p-2 text-white/80">Channel</th>
                                    <th className="p-2 text-white/80">Baseline</th>
                                    <th className="p-2 text-white/80">Optimistic</th>
                                    <th className="p-2 text-white/80">Pessimistic</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonTableData.channels.map(row => (
                                    <tr key={row.channel} className="border-b border-white/10">
                                        <td className="p-2 font-semibold text-white">{row.channel}</td>
                                        <td className="p-2 text-white/80">{row.baseline}</td>
                                        <td className="p-2 text-green-400">{row.optimistic}</td>
                                        <td className="p-2 text-red-400">{row.pessimistic}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScenarioComparison; 