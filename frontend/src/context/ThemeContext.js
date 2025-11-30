import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Theme color palettes
export const themes = {
  dark: {
    name: 'dark',
    background: '#0b0b11',
    backgroundSecondary: '#1a1229',
    backgroundTertiary: '#0f0a1a',
    surface: '#2d1f3d',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    textMuted: '#64748b',
    border: '#2d1f3d',
    primary: '#a855f7',
    primaryGradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    cardBg: 'rgba(15, 10, 30, 0.9)',
    headerBg: 'rgba(15, 10, 30, 0.9)'
  },
  light: {
    name: 'light',
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    surface: '#e2e8f0',
    text: '#0f172a',
    textSecondary: '#334155',
    textTertiary: '#475569',
    textMuted: '#64748b',
    border: '#e2e8f0',
    primary: '#8b5cf6',
    primaryGradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
    cardBg: '#ffffff',
    headerBg: 'rgba(255, 255, 255, 0.95)'
  }
};

export const ThemeProvider = ({ children }) => {
  const [dashboardTheme, setDashboardTheme] = useState(() => {
    return localStorage.getItem('dashboardTheme') || 'standard';
  });

  const [colorTheme, setColorTheme] = useState(() => {
    return localStorage.getItem('colorTheme') || 'dark';
  });

  const toggleDashboardTheme = () => {
    const newTheme = dashboardTheme === 'standard' ? 'modern' : 'standard';
    setDashboardTheme(newTheme);
    localStorage.setItem('dashboardTheme', newTheme);
  };

  const toggleColorTheme = () => {
    const newTheme = colorTheme === 'dark' ? 'light' : 'dark';
    setColorTheme(newTheme);
    localStorage.setItem('colorTheme', newTheme);
  };

  const setTheme = (theme) => {
    setDashboardTheme(theme);
    localStorage.setItem('dashboardTheme', theme);
  };

  const setColor = (theme) => {
    setColorTheme(theme);
    localStorage.setItem('colorTheme', theme);
  };

  const theme = themes[colorTheme];

  // Apply theme to body for global styling
  useEffect(() => {
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, [colorTheme, theme]);

  return (
    <ThemeContext.Provider value={{ 
      dashboardTheme, 
      toggleTheme: toggleDashboardTheme, 
      setTheme,
      colorTheme,
      toggleColorTheme,
      setColorTheme: setColor,
      theme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
