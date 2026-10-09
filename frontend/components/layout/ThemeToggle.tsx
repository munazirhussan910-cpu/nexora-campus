'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '@/lib/theme-context';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'compact' | 'segmented' | 'dropdown';
  align?: 'left' | 'right';
}

export function ThemeToggle({
  className = '',
  variant = 'compact',
  align = 'right',
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, mounted } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or ESC key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl bg-surface border border-border animate-pulse shrink-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const options: Array<{ value: Theme; label: string; icon: React.ElementType }> = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  // Segmented Pill Control (e.g., for profile settings or inline bars)
  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Theme preference"
        className={`inline-flex items-center p-1 rounded-xl bg-surface-secondary border border-border ${className}`}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isSelected
                  ? 'bg-surface text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} className={isSelected ? 'text-primary' : ''} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact Button with Dropdown (Default for Navbar and Header)
  const CurrentIcon =
    theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div ref={containerRef} className={`relative inline-block text-left shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground hover:text-primary transition-all duration-150 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
        aria-label={`Theme switcher: current theme is ${theme} (${resolvedTheme})`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={`Theme: ${theme.toUpperCase()} (Click to change)`}
      >
        <CurrentIcon size={16} className="text-foreground transition-transform duration-200" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Theme options"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-36 rounded-xl bg-surface border border-border shadow-xl p-1 z-50 animate-tab-fade text-xs`}
        >
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border mb-1">
            Theme Mode
          </div>
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-surface-secondary text-primary font-bold'
                    : 'text-foreground hover:bg-surface-secondary/70 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    size={14}
                    className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-primary stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
