'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  isNight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  resolvedTheme: 'dark',
  isNight: true,
  toggleTheme: () => {},
  setTheme: () => {},
  mounted: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [mounted, setMounted] = useState(false);

  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }, []);

  const applyThemeToDom = useCallback((resolved: ResolvedTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0B0D12' : '#F7F7F4');
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    const stored = (localStorage.getItem('nexora-theme') as Theme | null) || 'system';
    const validTheme: Theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    setThemeState(validTheme);

    const initialResolved: ResolvedTheme =
      validTheme === 'system' ? getSystemTheme() : validTheme;
    setResolvedTheme(initialResolved);
    applyThemeToDom(initialResolved);

    // Storage listener across browser tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nexora-theme' && e.newValue) {
        const next = e.newValue as Theme;
        if (next === 'light' || next === 'dark' || next === 'system') {
          setThemeState(next);
          const res = next === 'system' ? getSystemTheme() : next;
          setResolvedTheme(res);
          applyThemeToDom(res);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // Media query listener for OS dark mode changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const currentStored = localStorage.getItem('nexora-theme');
      if (!currentStored || currentStored === 'system') {
        const nextRes: ResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(nextRes);
        applyThemeToDom(nextRes);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [getSystemTheme, applyThemeToDom]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('nexora-theme', newTheme);
    const resolved: ResolvedTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyThemeToDom(resolved);
    window.dispatchEvent(new CustomEvent('nexora-theme-change', { detail: newTheme }));
  };

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isNight: resolvedTheme === 'dark',
        toggleTheme,
        setTheme,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
