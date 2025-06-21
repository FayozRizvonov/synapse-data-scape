
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Search } from 'lucide-react';

interface CompactSearchProps {
  onExpand: (question: string) => void;
}

const CompactSearch = ({ onExpand }: CompactSearchProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Активируем чат при первом введенном символе
    if (value.length === 1) {
      onExpand(value);
    }
  };

  const handleSampleClick = (sample: string) => {
    onExpand(sample);
  };

  const sampleQuestions = [
    'Оптимизация оборотного капитала в Q2',
    'Анализ рисков в цепи поставок',
    'Улучшение IT инцидентов на 20%'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Main Search Bar */}
      <div className="relative group">
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-4 glow-effect hover:glow-effect-strong transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary pulse-glow" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Введите ваш запрос для Trigma AI..."
                value={inputValue}
                onChange={handleInputChange}
                className="w-full bg-transparent text-lg placeholder:text-muted-foreground/70 focus:outline-none"
              />
            </div>
            <Button
              variant="ghost"
              className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2 rounded-xl font-medium"
            >
              Waiting
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground/80 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Быстрые запросы:
        </p>
        <div className="flex flex-wrap gap-3">
          {sampleQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleSampleClick(question)}
              className="bg-card/20 backdrop-blur-sm border border-border/30 rounded-xl px-4 py-2 text-sm hover:bg-card/40 hover:border-primary/30 transition-all duration-300 hover:glow-effect"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompactSearch;
