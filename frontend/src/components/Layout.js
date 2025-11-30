import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Wallet, Settings, LogOut, ShieldCheck, FileText, FolderLock, Sparkles, Calendar, Crown, ShieldAlert, FlaskConical, Database, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/App';
import { useTheme } from '@/context/ThemeContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'INR', label: 'INR (₹)', symbol: '₹' },
  { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
  { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
  { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { value: 'SGD', label: 'SGD (S$)', symbol: 'S$' }
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCurrency, setSelectedCurrency } = useApp();
  const { user } = useAuth();
  const { dashboardTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [togglingDemo, setTogglingDemo] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (user && user.role === 'admin') {
      setIsAdmin(true);
    }
    // Check demo mode status
    checkDemoStatus();
    // Fetch subscription status
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`${API}/subscription/current`, { withCredentials: true });
      setUserSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const checkDemoStatus = async () => {
    try {
      const response = await axios.get(`${API}/demo/status`, { withCredentials: true });
      setDemoMode(response.data.demo_mode);
    } catch (error) {
      console.error('Failed to fetch demo status:', error);
    }
  };

  const toggleDemoMode = async () => {
    setTogglingDemo(true);
    try {
      const response = await axios.post(`${API}/demo/toggle`, {}, { withCredentials: true });
      setDemoMode(response.data.demo_mode);
      toast.success(response.data.message);
      // Refresh the page to reload data
      window.location.reload();
    } catch (error) {
      console.error('Failed to toggle demo mode:', error);
      toast.error('Failed to switch mode');
    } finally {
      setTogglingDemo(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      // Clear session storage and localStorage token
      sessionStorage.clear();
      localStorage.removeItem('session_token');
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear local data
      localStorage.removeItem('session_token');
      sessionStorage.clear();
      toast.error('Logout failed');
    }
  };

  const baseNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, testId: 'nav-dashboard' },
    { path: '/assets', label: 'Assets', icon: Wallet, testId: 'nav-assets' },
    { path: '/income-expense', label: 'Income & Expenses', icon: Receipt, testId: 'nav-income-expense' },
    { path: '/insights', label: 'AI Insights', icon: Sparkles, testId: 'nav-insights' },
    { path: '/schedule-messages', label: 'Messages', icon: Calendar, testId: 'nav-messages' },
    { path: '/documents', label: 'Documents', icon: FolderLock, testId: 'nav-documents' },
    { path: '/settings', label: 'Settings', icon: Settings, testId: 'nav-settings' }
  ];

  // Add Admin link if user is admin
  const navItems = isAdmin 
    ? [...baseNavItems, { path: '/admin', label: 'Admin', icon: ShieldAlert, testId: 'nav-admin' }]
    : baseNavItems;

  const handleCurrencyChange = async (currency) => {
    await setSelectedCurrency(currency);
    toast.success(`Currency changed to ${currency}`);
  };

  return (
    <div className="min-h-screen" style={{
      background: dashboardTheme === 'modern' 
        ? '#0b0b11'
        : ''
    }}>
      {/* Header */}
      <header className="backdrop-blur-xl sticky top-0 z-50" style={{borderBottom: '1px solid #2d1f3d', background: 'rgba(15, 10, 30, 0.9)'}}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-2 min-w-fit">
              <ShieldCheck className="w-7 h-7" style={{color: '#ec4899'}} />
              <h1 className="text-xl font-bold whitespace-nowrap" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>AssetVault</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    data-testid={item.testId}
                    onClick={() => navigate(item.path)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)' : 'transparent',
                      color: isActive ? '#f8fafc' : '#94a3b8'
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 min-w-fit">
              {/* Demo Mode Toggle - Prominent Display */}
              <div className="relative">
                <button
                  onClick={toggleDemoMode}
                  disabled={togglingDemo}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-bold shadow-lg"
                  style={{
                    background: demoMode 
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    border: '2px solid rgba(255,255,255,0.3)',
                    boxShadow: demoMode 
                      ? '0 4px 12px rgba(245, 158, 11, 0.4)' 
                      : '0 4px 12px rgba(16, 185, 129, 0.4)'
                  }}
                  title={demoMode ? 'Click to switch to Live Data' : 'Click to switch to Demo Mode'}
                >
                  {demoMode ? (
                    <>
                      <FlaskConical className="w-4 h-4" />
                      <span>DEMO MODE</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>LIVE MODE</span>
                    </>
                  )}
                </button>
                
                {/* Pulsing indicator */}
                <span 
                  className="absolute top-0 right-0 w-3 h-3 rounded-full animate-pulse"
                  style={{
                    background: demoMode ? '#f59e0b' : '#10b981',
                    boxShadow: demoMode 
                      ? '0 0 8px rgba(245, 158, 11, 0.6)' 
                      : '0 0 8px rgba(16, 185, 129, 0.6)'
                  }}
                />
              </div>

              {/* Currency Selector */}
              <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-24 h-9 text-sm" style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                  {CURRENCIES.map(curr => (
                    <SelectItem key={curr.value} value={curr.value} style={{color: '#f8fafc'}}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                data-testid="logout-btn"
                onClick={handleLogout} 
                size="sm"
                variant="outline" 
                className="h-9"
                style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
              >
                <LogOut className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{background: '#1a1229', borderTop: '1px solid #2d1f3d'}}>
        <div className="flex justify-around items-center py-3">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                data-testid={`${item.testId}-mobile`}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg"
                style={{color: isActive ? '#ec4899' : '#94a3b8'}}
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
