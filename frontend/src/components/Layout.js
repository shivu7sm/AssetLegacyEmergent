import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Wallet, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, testId: 'nav-dashboard' },
    { path: '/assets', label: 'Assets', icon: Wallet, testId: 'nav-assets' },
    { path: '/settings', label: 'Settings', icon: Settings, testId: 'nav-settings' }
  ];

  return (
    <div className="min-h-screen" style={{background: '#0a0e27'}}>
      {/* Header */}
      <header className="backdrop-blur-xl sticky top-0 z-50" style={{borderBottom: '1px solid #1e293b', background: 'rgba(10, 14, 39, 0.8)'}}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8" style={{color: '#60a5fa'}} />
            <h1 className="text-2xl font-bold" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>AssetVault</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  data-testid={item.testId}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' : 'transparent',
                    color: isActive ? '#f8fafc' : '#94a3b8'
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <Button 
            data-testid="logout-btn"
            onClick={handleLogout} 
            variant="outline" 
            style={{borderColor: '#1e293b', color: '#94a3b8'}}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{background: '#131835', borderTop: '1px solid #1e293b'}}>
        <div className="flex justify-around items-center py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                data-testid={`${item.testId}-mobile`}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg"
                style={{color: isActive ? '#60a5fa' : '#94a3b8'}}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
