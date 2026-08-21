import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'button' | 'admin';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  if (variant === 'pill') {
    return (
      <button
        id="theme-toggle-pill-btn"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
          isDark
            ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
            : 'bg-[#F5F8FF] text-slate-700 border-blue-100 hover:bg-blue-100/70'
        } ${className}`}
        title={`Switch to ${isDark ? 'Day' : 'Night'} Mode`}
        aria-label="Toggle Day/Night Mode"
      >
        {isDark ? (
          <>
            <Moon className="w-3.5 h-3.5 fill-amber-300" />
            <span>Night Mode</span>
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Day Mode</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        id="theme-toggle-full-btn"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
          isDark
            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-xs'
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          {isDark ? (
            <Moon className="w-4 h-4 text-amber-300 fill-amber-300" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
          )}
          <span>Appearance</span>
        </div>
        <span className="text-[11px] font-bold text-[#1769FF] uppercase tracking-wider">
          {isDark ? '🌙 Night' : '☀️ Day'}
        </span>
      </button>
    );
  }

  if (variant === 'admin') {
    return (
      <button
        id="admin-theme-toggle-btn"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
          isDark
            ? 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'
        } ${className}`}
        title={`Switch to ${isDark ? 'Day' : 'Night'} Mode`}
      >
        {isDark ? (
          <>
            <Moon className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span className="hidden sm:inline">Night Mode</span>
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span className="hidden sm:inline">Day Mode</span>
          </>
        )}
      </button>
    );
  }

  // Default 'icon' variant
  return (
    <button
      id="theme-toggle-icon-btn"
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-all ${
        isDark
          ? 'text-amber-300 hover:bg-slate-800 hover:text-amber-200'
          : 'text-gray-500 hover:text-[#1769FF] hover:bg-[#F5F8FF]'
      } ${className}`}
      title={`Switch to ${isDark ? 'Day' : 'Night'} Mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Moon className="w-4 h-4 fill-amber-300" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
      )}
    </button>
  );
};
