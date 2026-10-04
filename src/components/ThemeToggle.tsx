import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Tema Gelap / Terang"
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-850 text-stone-700 dark:text-stone-300 shadow-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors',
        className
      )}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="h-4 w-4 text-stone-600 transition-transform duration-300 rotate-0" />
      )}
    </button>
  );
};
