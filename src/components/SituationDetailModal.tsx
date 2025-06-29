import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { X, Download, Share2, DollarSign, TrendingUp, TrendingDown, BarChart3, Users } from 'lucide-react';
import { MetricCard } from '@/data/metricsKnowledgeBase';
import { useTheme } from '@/hooks/useTheme';

interface SituationDetailModalProps {
  card: MetricCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

const SituationDetailModal: React.FC<SituationDetailModalProps> = ({ 
  card, 
  open, 
  onOpenChange,
  children 
}) => {
  const { theme } = useTheme();
  
  if (!card) return null;

  const handleShare = () => {
    const shareText = `${card.title}: ${card.value} (${card.change} ${card.comparison})`;
    if (navigator.share) {
      navigator.share({
        title: card.title,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  const handleDownload = () => {
    const data = {
      title: card.title,
      value: card.value,
      change: card.change,
      comparison: card.comparison,
      description: card.details?.description,
      breakdown: card.details?.breakdown,
      chartData: card.chartData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.id}-detailed-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getChartTitle = (card: MetricCard) => {
    if (!card.chartData) return '';
    if (card.id === 'base-sales' || card.id === 'seasonality') return 'Historical Impact';
    if (card.id === 'page-visit-exchange' || card.id === 'digital-display' || card.id === 'digital-video') return 'Monthly Revenue Breakdown';
    return 'Performance Chart';
  };

  const renderExtraBreakdown = (card: MetricCard) => {
    if (!card.details?.breakdown) return null;
    // Example: show recommended spend, decay rate, etc. as separate rows
    const spend = card.details.breakdown.find(b => b.label.toLowerCase().includes('spend'));
    const freq = card.details.breakdown.find(b => b.label.toLowerCase().includes('frequency'));
    const lag = card.details.breakdown.find(b => b.label.toLowerCase().includes('lag'));
    const decay = card.details.breakdown.find(b => b.label.toLowerCase().includes('decay'));
    const seasonality = card.details.breakdown.find(b => b.label.toLowerCase().includes('seasonality'));
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
        {spend && (
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-100/80 dark:bg-white/10">
            <span className="text-sm text-gray-600 dark:text-white/60">Recommended Spend</span>
            <span className="font-semibold text-gray-900 dark:text-white">{spend.value}</span>
          </div>
        )}
        {freq && (
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-100/80 dark:bg-white/10">
            <span className="text-sm text-gray-600 dark:text-white/60">Optimal Frequency</span>
            <span className="font-semibold text-gray-900 dark:text-white">{freq.value}</span>
          </div>
        )}
        {lag && (
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-100/80 dark:bg-white/10">
            <span className="text-sm text-gray-600 dark:text-white/60">Response Lag</span>
            <span className="font-semibold text-gray-900 dark:text-white">{lag.value}</span>
          </div>
        )}
        {decay && (
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-100/80 dark:bg-white/10">
            <span className="text-sm text-gray-600 dark:text-white/60">Decay Rate</span>
            <span className="font-semibold text-gray-900 dark:text-white">{decay.value}</span>
          </div>
        )}
        {seasonality && (
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-100/80 dark:bg-white/10">
            <span className="text-sm text-gray-600 dark:text-white/60">Seasonality</span>
            <span className="font-semibold text-gray-900 dark:text-white">{seasonality.value}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-[2px] bg-white/90 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-2xl p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 dark:from-cyan-500/20 dark:to-blue-500/20 border border-blue-500/30 dark:border-cyan-500/30">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {card.title}
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-white/60">
                {card.category === 'key' ? 'Key Metric' : card.category === 'situation' ? 'Situation Analysis' : 'Scenario Comparison'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare} className="hover:bg-gray-100/80 dark:hover:bg-white/10">
              <Share2 className="w-4 h-4 text-gray-600 dark:text-white/80" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} className="hover:bg-gray-100/80 dark:hover:bg-white/10">
              <Download className="w-4 h-4 text-gray-600 dark:text-white/80" />
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100/80 dark:hover:bg-white/10">
                <X className="w-4 h-4 text-gray-600 dark:text-white/80" />
              </Button>
            </DialogClose>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="backdrop-blur-[2px] bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span className="text-sm text-gray-600 dark:text-white/60">Current Value</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
            </div>
            <div className="backdrop-blur-[2px] bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {card.changeType === 'positive' ? (
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <span className="text-sm text-gray-600 dark:text-white/60">Change</span>
              </div>
              <div className={`text-2xl font-bold ${card.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{card.change}</div>
              <div className="text-xs text-gray-500 dark:text-white/40">{card.comparison}</div>
            </div>
            <div className="backdrop-blur-[2px] bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span className="text-sm text-gray-600 dark:text-white/60">Category</span>
              </div>
              <div className="text-lg font-semibold text-blue-600 dark:text-cyan-400 capitalize">
                {card.category === 'situation' ? 'Spend' : card.category}
              </div>
            </div>
          </div>

          {/* Description */}
          {card.details?.description && (
            <div className="backdrop-blur-[2px] bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl p-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-gray-700 dark:text-white/70">{card.details.description}</p>
            </div>
          )}

          {/* Breakdown */}
          {card.details?.breakdown && (
            <div className="backdrop-blur-[2px] bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl p-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Detailed Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {card.details.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-white/80 dark:bg-white/10">
                    <span className="text-sm text-gray-600 dark:text-white/60">{item.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart */}
          {card.chartData && (
            <div className="backdrop-blur-[2px] bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl p-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{getChartTitle(card)}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={card.chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-stroke)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--chart-axis-color)', fontWeight: 600, fontSize: 13 }} />
                    <YAxis tick={{ fill: 'var(--chart-axis-color)', fontWeight: 600, fontSize: 13 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--chart-tooltip-bg)',
                        borderColor: 'var(--chart-primary-color)',
                        color: 'var(--chart-tooltip-text)',
                        borderRadius: '8px',
                        fontSize: 14,
                        boxShadow: 'var(--chart-tooltip-shadow)',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value: number) => [`$${(value/1000).toFixed(1)}K`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="var(--chart-primary-color)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Extra breakdown for digital/modal cards */}
          {renderExtraBreakdown(card)}

          {/* Insights */}
          <div className="backdrop-blur-[2px] bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl p-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Key Insights</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${card.changeType === 'positive' ? 'bg-green-600 dark:bg-green-400' : 'bg-red-600 dark:bg-red-400'} rounded-full`}></div>
                <span className="text-sm text-gray-700 dark:text-white/70">
                  {card.changeType === 'positive' ? 'Positive trend' : 'Negative trend'} with {card.change} change
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-white/70">
                  {card.comparison} comparison shows market performance
                </span>
              </div>
              {card.details?.breakdown && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-white/70">
                    Detailed breakdown available with {card.details.breakdown.length} key metrics
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SituationDetailModal; 