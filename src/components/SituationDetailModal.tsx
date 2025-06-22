import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, Download, Share2, DollarSign, TrendingUp, TrendingDown, BarChart3, Clock, Zap, Sun, Users } from 'lucide-react';

interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  comparison: string;
  icon: React.ElementType;
  category: 'key' | 'situation';
  details?: {
    description: string;
    breakdown: Array<{ label: string; value: string; }>;
  };
}

interface SituationDetailModalProps {
  card: MetricCard | null;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data for the chart
const monthlyData = [
  { name: 'J', revenue: 210000 },
  { name: 'F', revenue: 320000 },
  { name: 'M', revenue: 380000 },
  { name: 'A', revenue: 450000 },
  { name: 'M', revenue: 520000 },
  { name: 'J', revenue: 410000 },
  { name: 'J', revenue: 350000 },
  { name: 'A', revenue: 460000 },
  { name: 'S', revenue: 490000 },
  { name: 'O', revenue: 380000 },
  { name: 'N', revenue: 310000 },
  { name: 'D', revenue: 470000 },
];

const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `$${Math.round(value / 1_000)}K`;
    }
    return `$${value}`;
  };

const SituationDetailModal: React.FC<SituationDetailModalProps> = ({ card, children, open, onOpenChange }) => {
  if (!card) return null;

  const externalFactors = [
    { label: 'Market', value: 2, color: 'bg-green-500' },
    { label: 'Compet.', value: 10, color: 'bg-red-500' },
    { label: 'Seasonality', value: 20, color: 'bg-blue-500' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl bg-background border-border p-0">
        <div className="p-6">
            <DialogHeader className='flex flex-row justify-between items-start'>
                <div>
                    <Badge variant="outline" className="mb-2 border-primary text-primary">DIGITAL</Badge>
                    <DialogTitle className="text-2xl font-bold text-white mb-4">{card.title}</DialogTitle>
                    <div className="flex items-center space-x-8 text-white">
                        <div>
                            <p className="text-sm text-white/60">Revenue Attribution</p>
                            <p className="text-xl font-bold">{card.value}</p>
                        </div>
                        <div>
                            <p className="text-sm text-white/60">ROI</p>
                            <p className="text-xl font-bold">{card.change}</p>
                        </div>
                        <div>
                            <p className="text-sm text-white/60">Diminishing Returns Threshold</p>
                            <p className="text-xl font-bold">$150K</p> 
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon"><Download className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon"><Share2 className="w-5 h-5" /></Button>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon"><X className="w-5 h-5" /></Button>
                    </DialogClose>
                </div>
            </DialogHeader>

            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Monthly Revenue Breakdown</h3>
                    <div className='flex items-center gap-2'>
                        <Button variant="outline" size="sm" className="bg-zinc-800">Last 6M</Button>
                        <Button variant="default" size="sm">Last 12M</Button>
                    </div>
                </div>
                <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="name" tick={{ fill: '#a1a1aa' }} axisLine={{ stroke: '#a1a1aa' }} />
                            <YAxis tickFormatter={(value) => formatCurrency(Number(value))} tick={{ fill: '#a1a1aa' }} axisLine={{ stroke: '#a1a1aa' }}/>
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(10, 10, 10, 0.8)',
                                    borderColor: '#333',
                                    color: '#fff',
                                    borderRadius: '0.5rem'
                                }}
                                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                            />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                 {/* Recommended Spend */}
                <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-md"><DollarSign className="w-5 h-5 text-primary"/></div>
                    <div>
                        <p className="text-sm text-white/60">Recommended Spend</p>
                        <p className="text-lg font-bold text-white">$630K</p>
                    </div>
                </div>
                 {/* Optimal Frequency */}
                <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-md"><TrendingUp className="w-5 h-5 text-primary"/></div>
                    <div>
                        <p className="text-sm text-white/60">Optimal Frequency</p>
                        <p className="text-lg font-bold text-white">11/month</p>
                    </div>
                </div>
                 {/* Response Lag */}
                <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-md"><Clock className="w-5 h-5 text-primary"/></div>
                    <div>
                        <p className="text-sm text-white/60">Response Lag</p>
                        <p className="text-lg font-bold text-white">4 weeks</p>
                    </div>
                </div>
                 {/* Decay Rate */}
                <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-md"><TrendingDown className="w-5 h-5 text-primary"/></div>
                    <div>
                        <p className="text-sm text-white/60">Decay Rate</p>
                        <p className="text-lg font-bold text-white">13% monthly</p>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">External Factors Impact</h3>
                <div className="space-y-4">
                    {externalFactors.map(factor => (
                        <div key={factor.label} className="grid grid-cols-6 items-center gap-4">
                            <div className="col-span-1 flex items-center gap-2">
                                {factor.label === 'Market' && <BarChart3 className="w-4 h-4 text-white/60"/>}
                                {factor.label === 'Compet.' && <Users className="w-4 h-4 text-white/60"/>}
                                {factor.label === 'Seasonality' && <Sun className="w-4 h-4 text-white/60"/>}
                                <p className="text-sm text-white/80">{factor.label}</p>
                            </div>
                            <div className="col-span-5 flex items-center gap-4">
                                <Progress value={factor.value} className="h-2" />
                                <p className="text-sm font-bold text-white/80 w-12 text-right">{factor.value}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SituationDetailModal; 