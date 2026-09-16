'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  isNight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isNight: true,
  toggleTheme: () => {},
  setTheme: () => {},
  mounted: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Apply theme to DOM and meta tags
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }

    // Update meta theme-color for mobile address bars
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'light' ? '#f8fafc' : '#0a0c12');
    }
  };

  useEffect(() => {
    setMounted(true);

    // Initial check from localStorage or OS preference
    const stored = localStorage.getItem('nexora-theme') as Theme | null;
    let initialTheme: Theme = 'dark';

    if (stored === 'light' || stored === 'dark') {
      initialTheme = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      initialTheme = 'light';
    }

    setThemeState(initialTheme);
    applyTheme(initialTheme);

    // Listen for storage changes across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nexora-theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue as Theme);
        applyTheme(e.newValue as Theme);
      }
    };
    window.addEventListener('storage', handleStorage);

    // Listen for OS system theme changes if no explicit user preference stored
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const currentStored = localStorage.getItem('nexora-theme');
      if (!currentStored) {
        const sysTheme = e.matches ? 'dark' : 'light';
        setThemeState(sysTheme);
        applyTheme(sysTheme);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('nexora-theme', newTheme);
    window.dispatchEvent(new CustomEvent('nexora-theme-change', { detail: newTheme }));
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isNight: theme === 'dark',
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
