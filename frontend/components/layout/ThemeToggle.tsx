'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';
import { Sun, Moon, Sparkles } from 'lucide-react';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  compact = false,
  className = '',
  showLabel = true,
}: ThemeToggleProps) {
  const { isNight, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl bg-card border border-border animate-pulse shrink-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        role="switch"
        aria-checked={isNight}
        className={`relative p-2 rounded-xl border transition-all duration-300 shadow-sm active:scale-95 flex items-center justify-center shrink-0 group ${
          isNight
            ? 'bg-[#181b26] hover:bg-[#22283a] border-[#282f42] text-gray-300 hover:text-gold'
            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-amber-600 shadow-sm'
        } ${className}`}
        title={isNight ? 'Switch to Day Mode (Light)' : 'Switch to Night Mode (Dark)'}
        aria-label={isNight ? 'Switch to Day Mode' : 'Switch to Night Mode'}
      >
        <span className="sr-only">
          {isNight ? 'Switch to Day Mode' : 'Switch to Night Mode'}
        </span>
        <div className="relative w-5 h-5 flex items-center justify-center">
          {isNight ? (
            <Sun
              size={17}
              className="text-amber-400 group-hover:rotate-90 transition-transform duration-500"
            />
          ) : (
            <Moon
              size={17}
              className="text-indigo-600 group-hover:-rotate-12 transition-transform duration-500"
            />
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={isNight}
      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-300 shadow-sm active:scale-95 shrink-0 ${
        isNight
          ? 'bg-[#181b26] hover:bg-[#202538] border-[#2e3549] text-gray-200 hover:border-gold/50'
          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm hover:border-amber-400'
      } ${className}`}
      title={isNight ? 'Switch to Day Mode' : 'Switch to Night Mode'}
      aria-label="Toggle Day and Night Mode"
    >
      {/* Visual Track / Switch Bubble */}
      <div
        className={`relative flex items-center justify-center w-5 h-5 rounded-full transition-transform duration-300 ${
          isNight
            ? 'bg-[#252b3d] text-cyan-400 group-hover:bg-[#2d354c]'
            : 'bg-amber-100 text-amber-600 group-hover:bg-amber-200'
        }`}
      >
        {isNight ? (
          <Moon
            size={12}
            className="transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <Sun
            size={12}
            className="transition-transform duration-300 group-hover:rotate-45"
          />
        )}
      </div>

      {showLabel && (
        <span
          className={`text-[11px] font-mono tracking-tight transition-colors select-none ${
            isNight
              ? 'text-gray-300 group-hover:text-white'
              : 'text-slate-600 group-hover:text-slate-900 font-bold'
          }`}
        >
          {isNight ? 'Night' : 'Day'}
        </span>
      )}
    </button>
  );
}
