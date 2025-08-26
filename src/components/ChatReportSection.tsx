import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Lightbulb, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ReportSectionProps {
  section: {
    title: string;
    short: string;
    full: {
      snapshot: string[];
      chart: {
        type: 'bar' | 'line' | 'pie';
        x: { label: string };
        y: { label: string };
        series: Array<{ name: string; data: number[] }>;
        style: { colors: string[]; height: number };
      };
      recommendations: string[];
    };
  };
  index: number;
}

const ChatReportSection: React.FC<ReportSectionProps> = ({ section, index }) => {
  const renderChart = () => {
    const { chart } = section.full;
    const maxValue = Math.max(...chart.series[0]?.data || [1]);
    const minValue = Math.min(...chart.series[0]?.data || [0]);
    
    return (
      <div className="mt-4 p-4 bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {chart.x.label} vs {chart.y.label}
          </h4>
          <Badge variant="outline" className="text-xs flex-shrink-0 bg-white/20 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-white/30 dark:border-gray-600/50">
            {chart.type.toUpperCase()} CHART
          </Badge>
        </div>
        
        <div className="space-y-4">
          {chart.series.map((series) => (
            <div key={series.name} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm bg-gray-500 dark:bg-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
                  {series.name}
                </span>
              </div>
              
              <div className="relative">
                <div className="flex items-end gap-2 h-32">
                  {series.data.map((value, dataIdx) => {
                    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    const height = Math.max(8, percentage);
                    
                    return (
                      <div key={dataIdx} className="flex-1 flex flex-col items-center h-full">
                        <div className="relative group h-full flex items-end w-full">
                          <div
                            className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80 cursor-pointer"
                            style={{
                              height: `${height}%`,
                              backgroundColor: '#6B7280',
                              minHeight: '8px'
                            }}
                            title={`${value}`}
                          />
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            {value}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                          Q{dataIdx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{Math.round(maxValue)}</span>
                  <span>{Math.round(maxValue * 0.75)}</span>
                  <span>{Math.round(maxValue * 0.5)}</span>
                  <span>{Math.round(maxValue * 0.25)}</span>
                  <span>{Math.round(minValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-white/20 dark:border-gray-700/50">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Data range: {minValue.toFixed(1)} - {maxValue.toFixed(1)}</span>
            <span>Points: {chart.series[0]?.data.length || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-4"
    >
      <Card className="backdrop-blur-[2px] bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white break-words">
                  {section.title}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 break-words leading-relaxed">
                  {section.short}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <CardContent className="pt-0 space-y-4">
            {/* Snapshot Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-gray-700/50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Key Insights
                </h4>
              </div>
              <div className="space-y-3">
                {section.full.snapshot.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/50 shadow-sm">
                    <div className="w-3 h-3 bg-gray-500 dark:bg-gray-400 rounded-full mt-1 flex-shrink-0 shadow-sm" />
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-gray-700/50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Data Visualization
                </h4>
              </div>
              <div className="overflow-x-auto">
                {renderChart()}
              </div>
            </div>

            {/* Recommendations Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-gray-700/50 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Recommendations
                </h4>
              </div>
              <div className="space-y-3">
                {section.full.recommendations.map((recommendation, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/50 shadow-sm">
                    <div className="w-3 h-3 bg-gray-500 dark:bg-gray-400 rounded-full mt-1 flex-shrink-0 shadow-sm" />
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default ChatReportSection;
