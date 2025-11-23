import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [dashboardTheme, setDashboardTheme] = useState(() => {
    return localStorage.getItem('dashboardTheme') || 'standard';
  });

  const toggleTheme = () => {
    const newTheme = dashboardTheme === 'standard' ? 'modern' : 'standard';
    setDashboardTheme(newTheme);
    localStorage.setItem('dashboardTheme', newTheme);
  };

  const setTheme = (theme) => {
    setDashboardTheme(theme);
    localStorage.setItem('dashboardTheme', theme);
  };

  return (
    <ThemeContext.Provider value={{ dashboardTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
