import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Fuse v22 theme. Every value is a CSS variable defined in index.css, so the
// light and dark schemes swap in CSS and pages never re-render to restyle.
const fuseTheme = {
  background: 'var(--fuse-bg)',
  backgroundSecondary: 'var(--fuse-surface-2)',
  backgroundTertiary: 'var(--fuse-surface-3)',
  surface: 'var(--fuse-surface-3)',
  text: 'var(--fuse-text)',
  textSecondary: 'var(--fuse-text-secondary)',
  textTertiary: 'var(--fuse-text-tertiary)',
  textMuted: 'var(--fuse-text-muted)',
  border: 'var(--fuse-border)',
  primary: 'var(--fuse-primary)',
  primaryText: 'var(--fuse-primary-text)',
  primarySoft: 'var(--fuse-primary-soft)',
  // Fuse uses flat colours; kept for pages that still read it
  primaryGradient: 'var(--fuse-primary)',
  success: 'var(--fuse-success)',
  warning: 'var(--fuse-warning)',
  error: 'var(--fuse-error)',
  info: 'var(--fuse-info)',
  cardBg: 'var(--fuse-surface)',
  cardBorder: 'var(--fuse-border)',
  cardShadow: 'var(--fuse-shadow)',
  headerBg: 'var(--fuse-header-bg)',
};

export const themes = {
  dark: { name: 'dark', ...fuseTheme },
  light: { name: 'light', ...fuseTheme },
};

const SCHEMES = ['light', 'dark', 'system'];
const darkQuery = '(prefers-color-scheme: dark)';

const readStoredScheme = () => {
  try {
    const stored = localStorage.getItem('colorTheme');
    return SCHEMES.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
};

export const ThemeProvider = ({ children }) => {
  // `scheme` is what the user picked; `colorTheme` is what is actually shown
  const [scheme, setScheme] = useState(readStoredScheme);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.(darkQuery).matches ?? false
  );

  useEffect(() => {
    const media = window.matchMedia?.(darkQuery);
    if (!media) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const colorTheme = scheme === 'system' ? (systemDark ? 'dark' : 'light') : scheme;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorTheme === 'dark');
  }, [colorTheme]);

  const setColorTheme = (next) => {
    if (!SCHEMES.includes(next)) return;
    setScheme(next);
    try {
      localStorage.setItem('colorTheme', next);
    } catch {
      // Storage can be unavailable (private mode); the choice still applies
    }
  };

  const toggleColorTheme = () => setColorTheme(colorTheme === 'dark' ? 'light' : 'dark');

  const value = useMemo(
    () => ({ scheme, colorTheme, setColorTheme, toggleColorTheme, theme: themes[colorTheme] }),
    [scheme, colorTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
