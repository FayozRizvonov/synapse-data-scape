import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  variant?: 'default' | 'compact';
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'default', className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className={`h-8 w-8 p-0 rounded-lg bg-gradient-card/50 border border-slate-700/30 dark:border-slate-700/30 border-gray-200 transition-all duration-200 glow-effect shadow-blue-sm hover:shadow-blue-md ${className}`}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <Moon className="h-4 w-4 text-blue-600" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={`rounded-full bg-gradient-card border border-slate-700/50 dark:border-slate-700/50 border-gray-200 backdrop-blur-xl transition-all duration-200 shadow-blue-lg hover:shadow-blue-xl glow-effect ${className}`}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-500" />
      ) : (
        <Moon className="h-5 w-5 text-blue-600" />
      )}
    </Button>
  );
};

export default ThemeToggle; 