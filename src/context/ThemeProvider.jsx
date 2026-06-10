import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const THEME_KEY = 'dojang-theme';
const THEMES = ['system', 'dark', 'light'];

const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return THEMES.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function resolveTheme(preference) {
  if (preference === 'light' || preference === 'dark') return preference;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readStoredTheme);
  const resolved = useMemo(() => resolveTheme(preference), [preference]);

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next)) return;
    setPreference(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolved === 'light' ? '#f5f5f5' : '#080808');
    }
  }, [resolved]);

  useEffect(() => {
    if (preference !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      document.documentElement.setAttribute('data-theme', resolveTheme('system'));
      document.documentElement.style.colorScheme = resolveTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  const value = useMemo(
    () => ({ preference, resolved, setTheme, themes: THEMES }),
    [preference, resolved, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
