import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import CompactSearch from './CompactSearch';
import ChatInterface from './ChatInterface';

interface QuestionInputProps {
  onNavigateToSection?: (section: string) => void;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ onNavigateToSection }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState('');

  const handleExpand = (question: string) => {
    setInitialQuestion(question);
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setInitialQuestion('');
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="inline-block bg-primary/10 p-5 rounded-2xl">
            <img src="/images/gsisai_logo.png" alt="GSIS AI Logo" className="w-16 h-16 object-contain" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">GSIS AI Assistant</h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto">
          The future of business intelligence. Ask me anything about your pharmaceutical analytics data, metrics, and insights.
        </p>
      </div>

      {/* Compact Search - скрывается когда чат развернут */}
      <div className={`transition-all duration-500 ease-out ${
        isExpanded ? 'opacity-0 pointer-events-none transform scale-95' : 'opacity-100'
      }`}>
        <CompactSearch onExpand={handleExpand} />
      </div>

      {/* Expanded Chat Interface */}
      <ChatInterface 
        isExpanded={isExpanded} 
        onCollapse={handleCollapse}
        initialQuestion={initialQuestion}
        onNavigateToSection={onNavigateToSection}
      />
    </div>
  );
};

export default QuestionInput;
