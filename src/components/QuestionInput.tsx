
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const QuestionInput = () => {
  const [question, setQuestion] = useState('');

  const sampleQuestions = [
    'How can I optimize working capital in Q2? What are the top 3 risks in my supply chain?',
    'How can IT incident resolution be improved by 20%?'
  ];

  const handleSubmit = () => {
    if (question.trim()) {
      console.log('Submitted question:', question);
      setQuestion('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
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

      {/* Sample Questions */}
      <div className="mb-8">
        <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-6 border border-border/50 glow-effect">
          <div className="text-sm text-muted-foreground mb-4">Try asking:</div>
          {sampleQuestions.map((sample, index) => (
            <div
              key={index}
              className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors mb-2 last:mb-0"
              onClick={() => setQuestion(sample)}
            >
              {sample}
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="relative">
        <div className="bg-card/50 backdrop-blur-lg rounded-2xl border border-border/50 p-6 glow-effect">
          <Textarea
            placeholder="Enter your business question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[120px] bg-transparent border-none resize-none text-lg placeholder:text-muted-foreground/70 focus:ring-0 focus:outline-none"
          />
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              {question.length}/1000 characters
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!question.trim()}
              className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-2 rounded-xl font-medium transition-all duration-300 glow-effect disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ask GSIS →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionInput;
