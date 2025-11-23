import { useTheme } from '@/context/ThemeContext';
import { Palette } from 'lucide-react';

export default function ThemeSwitcher() {
  const { dashboardTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-switcher"
      title={`Switch to ${dashboardTheme === 'standard' ? 'Modern' : 'Standard'} theme`}
    >
      <Palette className="w-5 h-5" style={{color: dashboardTheme === 'standard' ? '#a855f7' : '#3b82f6'}} />
      <span className="theme-switcher-label">
        {dashboardTheme === 'standard' ? 'Standard' : 'Modern'}
      </span>
    </button>
  );
}
