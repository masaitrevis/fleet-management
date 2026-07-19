'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-label="Use light theme"
        className={`p-1.5 rounded-md transition-colors ${
          theme === 'light'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
        }`}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-label="Use dark theme"
        className={`p-1.5 rounded-md transition-colors ${
          theme === 'dark'
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
            : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
        }`}
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        aria-label="Use system theme"
        className={`p-1.5 rounded-md transition-colors ${
          theme === 'system'
            ? 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
            : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
        }`}
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
