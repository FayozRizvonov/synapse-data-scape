import React, { useState, useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  formatter: (value: number) => string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 1000, className, formatter }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animationFrame = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentVal = progress * value;
      setDisplayValue(currentVal);
      if (progress < 1) {
        requestAnimationFrame(animationFrame);
      }
    };
    requestAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span className={className}>{formatter(displayValue)}</span>;
};

export default AnimatedNumber; 