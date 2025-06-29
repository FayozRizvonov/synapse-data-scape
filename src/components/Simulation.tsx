import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users, Megaphone, FlaskConical, AlertTriangle, TrendingUp, TrendingDown, Info, Bot, Target, DollarSign, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedRadialChart } from './AnimatedRadialChart';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const revenue = budget;
  const forecastData = generateForecastData(reps, budget);

  return (
    <div className="space-y-8 mt-12 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground text-glow">Dynamic Strategy Simulator</h2>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Control Panel */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                      <Target className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Control Panel</h3>
                  </div>
                  
                  {/* Sales Force */}
                  <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4">
                    <Label htmlFor="sales-reps" className="flex items-center gap-2 mb-2 text-gray-600 dark:text-white/80">
                      <Users className="w-5 h-5 text-cyan-400"/>
                      Sales Force Headcount
                    </Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="sales-reps"
                        min={10} max={100} step={1}
                        value={[reps]}
                        onValueChange={(value) => setReps(value[0])}
                        className="flex-1"
                      />
                      <span className="font-bold text-lg text-gray-900 dark:text-white w-12 text-right">{reps}</span>
                    </div>
                  </div>

                  {/* Marketing Budget */}
                  <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4">
                    <Label htmlFor="marketing-budget" className="flex items-center gap-2 mb-2 text-gray-600 dark:text-white/80">
                      <Megaphone className="w-5 h-5 text-cyan-400"/>
                      Target Revenue
                    </Label>
                     <div className="flex items-center gap-4">
                      <Slider
                        id="marketing-budget"
                        min={1000000} max={20000000} step={100000}
                        value={[budget]}
                        onValueChange={(value) => setBudget(value[0])}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-right font-bold text-lg text-gray-900 dark:text-white mt-2">
                      <AnimatedNumber value={budget} formatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
                    </p>
                  </div>

                   {/* Optimal Range & Reset */}
                  <div className="backdrop-blur-[2px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4 text-center">
                       <p className="text-sm text-gray-600 dark:text-white/70">Optimal Range</p>
                       <p className="text-2xl font-bold text-gray-900 dark:text-white my-1">40 - 70 reps</p>
                       <Button variant="outline" className="mt-2 border-cyan-500/50 text-gray-900 dark:text-white hover:bg-cyan-500/20 hover:text-white">
                           Reset to MMM
                       </Button>
                  </div>

                  {/* External Factors */}
                  <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4">
                      <Label className="flex items-center gap-2 mb-3 text-gray-600 dark:text-white/80">
                          <AlertTriangle className="w-5 h-5 text-amber-400"/>
                          External Factors Simulation
                      </Label>
                      <div className="space-y-3">
                          <div className="flex items-center justify-between">
                              <Label htmlFor="new-competitor" className="flex items-center gap-2 text-gray-600 dark:text-white/80">
                                  <TrendingDown className="w-4 h-4"/> New Competitor
                              </Label>
                              <Switch id="new-competitor" />
                          </div>
                           <div className="flex items-center justify-between">
                              <Label htmlFor="recession" className="flex items-center gap-2 text-gray-600 dark:text-white/80">
                                  <TrendingDown className="w-4 h-4"/> Economic Recession
                              </Label>
                              <Switch id="recession" />
                          </div>
                      </div>
                  </div>

                  {/* AI Optimization */}
                   <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-gray-900 dark:text-white">
                      <Bot className="w-5 h-5 mr-2"/>
                      Suggest Optimization
                   </Button>

                </div>

                {/* Impact Dashboard */}
                <div className="lg:col-span-2 space-y-6">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                       <Activity className="w-5 h-5 text-cyan-400" />
                     </div>
                     <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Impact Dashboard</h3>
                   </div>
                   {/* Main KPIs */}
                   <div className="grid grid-cols-3 gap-4 text-center">
                       <motion.div
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.4 }}
                       >
                         <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4">
                           <p className="text-sm text-gray-600 dark:text-white/70">Projected Revenue</p>
                           <p className="text-3xl font-bold text-gray-900 dark:text-white">
                              <AnimatedNumber value={revenue} formatter={(val) => `$${(val/1000000).toFixed(2)}M`} />
                          </p>
                         </div>
                       </motion.div>
                       <motion.div
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.4, delay: 0.1 }}
                       >
                         <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4">
                           <p className="text-sm text-gray-600 dark:text-white/70">Projected Profit</p>
                           <p className="text-3xl font-bold text-green-400">
                              <AnimatedNumber value={revenue * 0.21} formatter={(val) => `$${(val/1000000).toFixed(2)}M`} />
                           </p>
                         </div>
                       </motion.div>
                       <motion.div
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.4, delay: 0.2 }}
                       >
                         <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4">
                           <p className="text-sm text-gray-600 dark:text-white/70">Overall ROI</p>
                            <p className="text-3xl font-bold text-amber-400">
                              <AnimatedNumber value={(revenue / budget)} formatter={(val) => `${val.toFixed(2)}x`} />
                           </p>
                         </div>
                       </motion.div>
                   </div>
                   {/* Forecast Chart */}
                  <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Forecast</h3>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={forecastData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--chart-senary)" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="var(--chart-senary)" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                          <XAxis 
                            dataKey="name" 
                            stroke="var(--chart-axis)"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="var(--chart-axis)"
                            fontSize={12}
                            tickFormatter={(value) => `$${(value/1000000).toFixed(1)}M`}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'var(--chart-tooltip-bg)',
                              border: '1px solid var(--chart-tooltip-border)',
                              borderRadius: '8px',
                              color: 'var(--chart-tooltip-text)',
                              backdropFilter: 'blur(10px)'
                            }}
                            formatter={(value: number) => [`$${(value/1000000).toFixed(2)}M`, 'Revenue']}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--chart-senary)"
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Animated Radial Chart for Number of Salesforce */}
                    <div className="flex flex-col items-center mt-8">
                      <span className="text-md font-semibold text-gray-900 dark:text-white mb-2">Number of Salesforce</span>
                      <AnimatedRadialChart 
                        value={Math.min(100, Math.round((revenue / 20000000) * 100))}
                        size={350}
                        duration={1.2}
                        showLabels={true}
                      />
                    </div>
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

export default Simulation; 