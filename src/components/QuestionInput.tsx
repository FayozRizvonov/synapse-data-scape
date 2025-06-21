
import React, { useState } from 'react';
import CompactSearch from './CompactSearch';
import ChatInterface from './ChatInterface';

const QuestionInput = () => {
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
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center float-animation">
            <div className="w-6 h-6 rounded-full bg-primary pulse-glow"></div>
          </div>
          <h1 className="text-4xl font-bold text-glow">
            Gen AI <span className="text-primary">Strategic Intelligence System</span>
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Ask any business question related to finance, supply chain, IT operations, revenue 
          growth or sustainability to get real-time insights and recommendations.
        </p>
      </div>

      {/* Compact Search or Expanded Chat */}
      {!isExpanded ? (
        <CompactSearch onExpand={handleExpand} />
      ) : (
        <ChatInterface 
          isExpanded={isExpanded} 
          onCollapse={handleCollapse}
          initialQuestion={initialQuestion}
        />
      )}
    </div>
  );
};

export default QuestionInput;
