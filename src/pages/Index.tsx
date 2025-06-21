
import React from 'react';
import AnimatedBackground from '@/components/AnimatedBackground';
import Sidebar from '@/components/Sidebar';
import QuestionInput from '@/components/QuestionInput';

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 flex min-h-screen">
        <Sidebar />
        
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="w-full max-w-6xl">
            <QuestionInput />
          </div>
        </main>
      </div>

      {/* Floating Tech Elements */}
      <div className="fixed top-20 right-20 w-4 h-4 rounded-full bg-primary/30 pulse-glow z-5"></div>
      <div className="fixed bottom-32 left-80 w-3 h-3 rounded-full bg-primary/20 pulse-glow z-5" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-1/2 right-1/3 w-2 h-2 rounded-full bg-primary/40 pulse-glow z-5" style={{ animationDelay: '2s' }}></div>
    </div>
  );
};

export default Index;
