import { useTheme } from '@/context/ThemeContext';
import { Palette } from 'lucide-react';

export default function ThemeSwitcher() {
  const { dashboardTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-switcher"
      title={`Switch to ${dashboardTheme === 'standard' ? 'Modern' : 'Standard'} theme`}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9999,
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0.75rem 1.25rem',
        borderRadius: '9999px',
        background: dashboardTheme === 'standard' ? 'rgba(26, 18, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        border: `1px solid ${dashboardTheme === 'standard' ? '#2d1f3d' : 'rgba(203, 213, 225, 0.3)'}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontWeight: '600',
        fontSize: '0.875rem'
      }}
    >
      <Palette className="w-5 h-5" style={{color: dashboardTheme === 'standard' ? '#a855f7' : '#3b82f6'}} />
      <span style={{color: dashboardTheme === 'standard' ? '#f8fafc' : '#0f172a'}}>
        {dashboardTheme === 'standard' ? 'Standard Theme' : 'Modern Theme'}
      </span>
    </button>
  );
}
