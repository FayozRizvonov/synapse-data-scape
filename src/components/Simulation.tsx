import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Users, Megaphone, FlaskConical, AlertTriangle, TrendingUp, TrendingDown, Info, Bot } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

const generateForecastData = (reps: number, budget: number) => {
  const data = [];
  let currentRevenue = (reps * 2000 + budget * 0.1) / 12;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < 12; i++) {
    const month = monthNames[i];
    const fluctuation = (Math.random() - 0.5) * 0.1; // -5% to +5% fluctuation
    currentRevenue *= (1 + fluctuation);
    data.push({
      name: month,
      revenue: Math.max(0, currentRevenue)
    });
  }
  return data;
};

const Simulation = () => {
  const [reps, setReps] = useState(45);
  const [budget, setBudget] = useState(9000000);

  const revenue = reps * 2000 + budget * 0.1;
  const forecastData = generateForecastData(reps, budget);

  return (
    <div className="space-y-8 mt-12 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground text-glow">Dynamic Strategy Simulator</h2>
      </div>
      
      <Card className="bg-card/50 border-white/10 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-xl font-semibold text-white">Control Panel</h3>
            
            {/* Sales Force */}
            <Card className="bg-background/30 p-4">
              <Label htmlFor="sales-reps" className="flex items-center gap-2 mb-2 text-white/80">
                <Users className="w-5 h-5 text-primary"/>
                Sales Force Headcount
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="sales-reps"
                  min={10} max={100} step={1}
                  value={[reps]}
                  onValueChange={(value) => setReps(value[0])}
                />
                <span className="font-bold text-lg text-white w-12 text-right">{reps}</span>
              </div>
            </Card>

            {/* Marketing Budget */}
            <Card className="bg-background/30 p-4">
              <Label htmlFor="marketing-budget" className="flex items-center gap-2 mb-2 text-white/80">
                <Megaphone className="w-5 h-5 text-primary"/>
                Target Revenue
              </Label>
               <div className="flex items-center gap-4">
                <Slider
                  id="marketing-budget"
                  min={1000000} max={20000000} step={100000}
                  value={[budget]}
                  onValueChange={(value) => setBudget(value[0])}
                />
              </div>
              <p className="text-right font-bold text-lg text-white mt-2">
                <AnimatedNumber value={budget} formatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
              </p>
            </Card>

             {/* Optimal Range & Reset */}
            <Card className="bg-primary/10 border border-primary/20 p-4 text-center">
                 <p className="text-sm text-white/70">Optimal Range</p>
                 <p className="text-2xl font-bold text-white my-1">40 - 70 reps</p>
                 <Button variant="outline" className="mt-2 border-primary/50 text-white hover:bg-primary/20 hover:text-white">
                     Reset to MMM
                 </Button>
            </Card>

            {/* External Factors */}
            <Card className="bg-background/30 p-4">
                <Label className="flex items-center gap-2 mb-3 text-white/80">
                    <AlertTriangle className="w-5 h-5 text-amber-400"/>
                    External Factors Simulation
                </Label>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="new-competitor" className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4"/> New Competitor
                        </Label>
                        <Switch id="new-competitor" />
                    </div>
                     <div className="flex items-center justify-between">
                        <Label htmlFor="recession" className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4"/> Economic Recession
                        </Label>
                        <Switch id="recession" />
                    </div>
                </div>
            </Card>

            {/* AI Optimization */}
             <Button className="w-full bg-primary/80 hover:bg-primary">
                <Bot className="w-5 h-5 mr-2"/>
                Suggest Optimization
             </Button>

          </div>

          {/* Impact Dashboard */}
          <div className="lg:col-span-2 space-y-6">
             <h3 className="text-xl font-semibold text-white">Impact Dashboard</h3>
             {/* Main KPIs */}
             <div className="grid grid-cols-3 gap-4 text-center">
                 <Card className="bg-background/30 p-4">
                     <p className="text-sm text-muted-foreground">Projected Revenue</p>
                     <p className="text-3xl font-bold text-white">
                        <AnimatedNumber value={revenue} formatter={(val) => `$${(val/1000000).toFixed(2)}M`} />
                    </p>
                 </Card>
                 <Card className="bg-background/30 p-4">
                     <p className="text-sm text-muted-foreground">Projected Profit</p>
                     <p className="text-3xl font-bold text-green-400">
                        <AnimatedNumber value={revenue * 0.21} formatter={(val) => `$${(val/1000000).toFixed(2)}M`} />
                     </p>
                 </Card>
                 <Card className="bg-background/30 p-4">
                     <p className="text-sm text-muted-foreground">Overall ROI</p>
                      <p className="text-3xl font-bold text-amber-400">
                        <AnimatedNumber value={(revenue / budget)} formatter={(val) => `${val.toFixed(2)}x`} />
                     </p>
                 </Card>
             </div>
             {/* Forecast Chart */}
            <Card className="bg-background/30 p-4">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={forecastData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis dataKey="name" tick={{ fill: '#a1a1aa' }} />
                        <YAxis tickFormatter={(val) => `$${(val/1000000).toFixed(2)}M`} tick={{ fill: '#a1a1aa' }} />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(10, 10, 10, 0.8)',
                                borderColor: '#333',
                                color: '#fff'
                            }}
                            formatter={(value: number) => [`$${(value).toLocaleString()}`, 'Projected Revenue']}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Simulation; 