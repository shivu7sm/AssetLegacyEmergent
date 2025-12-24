import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Wallet, Settings, LogOut, ShieldCheck, FileText, 
  FolderLock, Sparkles, Calendar, Crown, ShieldAlert, FlaskConical, 
  Database, Receipt, Zap, Sun, Moon, Calculator, ChevronDown, ChevronRight,
  Menu, X, TrendingUp, BookOpen, User, Shield, Clock, Eye, Palette, CreditCard, Heart,
  TrendingDown, PiggyBank, RefreshCw, Link as LinkIcon, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/App';
import { useTheme } from '@/context/ThemeContext';
import FloatingQuickActions from '@/components/FloatingQuickActions';

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
  const { colorTheme, toggleColorTheme, theme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [togglingDemo, setTogglingDemo] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    wealth: true,
    tools: true
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user && user.role === 'admin') {
      setIsAdmin(true);
    }
    checkDemoStatus();
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
      localStorage.removeItem('session_token');
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  const handleCurrencyChange = async (currency) => {
    await setSelectedCurrency(currency);
    toast.success(`Currency changed to ${currency}`);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Navigation structure with clear USP separation
  const navigationStructure = [
    // CORE USP: Legacy Protection
    {
      type: 'section-header',
      label: 'Legacy Protection',
      description: 'Protect your family\'s future'
    },
    {
      type: 'single',
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      testId: 'nav-dashboard'
    },
    {
      type: 'single',
      path: '/assets',
      label: 'Assets & Liabilities',
      icon: Wallet,
      testId: 'nav-assets'
    },
    {
      type: 'group',
      key: 'documents',
      label: 'Documents',
      icon: FolderLock,
      items: [
        { path: '/documents', label: 'All Documents', icon: FileText, testId: 'nav-all-docs' },
        { path: '/documents?filter=unlinked', label: 'Unlinked', icon: LinkIcon, testId: 'nav-unlinked-docs' },
        { path: '/documents?category=asset', label: 'Asset Documents', icon: Wallet, testId: 'nav-asset-docs' },
        { path: '/documents?category=family', label: 'Family Documents', icon: Heart, testId: 'nav-family-docs' }
      ]
    },
    {
      type: 'single',
      path: '/nominees',
      label: 'Nominees',
      icon: Users,
      badge: 'New',
      testId: 'nav-nominees'
    },
    {
      type: 'single',
      path: '/dead-man-switch',
      label: "Dead Man's Switch",
      icon: Clock,
      badge: 'New',
      testId: 'nav-dms'
    },
    
    // DIVIDER
    {
      type: 'divider'
    },
    
    // ADD-ON FEATURES: Wealth Building Tools
    {
      type: 'section-header',
      label: 'Wealth Tools',
      description: 'Grow and optimize your wealth'
    },
    {
      type: 'single',
      path: '/insights',
      label: 'AI Assistant',
      icon: Sparkles,
      testId: 'nav-insights'
    },
    {
      type: 'group',
      key: 'tax',
      label: 'Tax & Planning',
      icon: Zap,
      items: [
        { path: '/tax-blueprint', label: 'Dashboard', icon: LayoutDashboard, testId: 'nav-tax-dashboard' },
        { path: '/tax-blueprint?tab=80c-planner', label: '80C Planner', icon: PiggyBank, testId: 'nav-80c-planner' },
        { path: '/tax-blueprint?tab=hidden-sip', label: 'Hidden SIP', icon: Eye, testId: 'nav-hidden-sip' },
        { path: '/tax-blueprint?tab=tax-benefits', label: '📚 Tax Guide', icon: BookOpen, testId: 'nav-tax-guide' },
        { path: '/tax-blueprint?tab=wealth-structures', label: '🏛️ HUF & Trust', icon: Shield, testId: 'nav-huf-trust' },
        { path: '/tax-blueprint?tab=regime', label: 'Tax Regime', icon: RefreshCw, testId: 'nav-tax-regime' }
      ]
    },
    {
      type: 'group',
      key: 'calculators',
      label: 'Calculators',
      icon: Calculator,
      items: [
        { path: '/loan-calculator', label: 'Loan Planner', icon: Calculator, testId: 'nav-loan-calculator' },
        { path: '/calculators/sip', label: 'SIP Calculator', icon: TrendingUp, testId: 'nav-sip-calculator' },
        { path: '/calculators/swp', label: 'SWP Calculator', icon: TrendingDown, testId: 'nav-swp-calculator' },
        { path: '/calculators/compound', label: 'Compound Interest', icon: Zap, testId: 'nav-compound-calculator' }
      ]
    },
    {
      type: 'single',
      path: '/income-expense',
      label: 'Income & Expenses',
      icon: Receipt,
      testId: 'nav-income-expense'
    },
    {
      type: 'single',
      path: '/schedule-messages',
      label: 'Scheduled Messages',
      icon: Calendar,
      testId: 'nav-messages'
    },
    
    // DIVIDER
    {
      type: 'divider'
    },
    
    // SETTINGS
    {
      type: 'group',
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      items: [
        { path: '/settings?tab=profile', label: 'Profile', icon: User, testId: 'nav-settings-profile' },
        { path: '/settings?tab=preferences', label: 'Preferences', icon: Eye, testId: 'nav-settings-preferences' },
        { path: '/settings?tab=appearance', label: 'Appearance', icon: Palette, testId: 'nav-settings-appearance' },
        { path: '/settings?tab=subscription', label: 'Subscription', icon: CreditCard, testId: 'nav-settings-subscription' }
      ]
    }
  ];

  // Add admin if applicable
  if (isAdmin) {
    navigationStructure.push({
      type: 'single',
      path: '/admin',
      label: 'Admin Panel',
      icon: ShieldAlert,
      testId: 'nav-admin'
    });
  }

  const NavItem = ({ item, isChild = false }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || location.pathname + location.search === item.path;
    
    return (
      <button
        data-testid={item.testId}
        onClick={() => {
          navigate(item.path);
          setMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all ${
          isChild ? 'pl-11' : ''
        }`}
        style={{
          background: isActive ? theme.primaryGradient : 'transparent',
          color: isActive ? '#ffffff' : theme.text,
          fontWeight: isActive ? '600' : '400'
        }}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && <span className="text-sm">{item.label}</span>}
        </div>
        {sidebarOpen && item.badge && (
          <span 
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff'
            }}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const NavGroup = ({ group }) => {
    const Icon = group.icon;
    const isExpanded = expandedSections[group.key];
    const hasActiveChild = group.items.some(item => location.pathname === item.path);
    
    return (
      <div>
        <button
          onClick={() => toggleSection(group.key)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all"
          style={{
            background: hasActiveChild ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
            color: theme.text,
            fontWeight: hasActiveChild ? '600' : '500'
          }}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">{group.label}</span>}
          </div>
          {sidebarOpen && (
            isExpanded ? 
              <ChevronDown className="w-4 h-4" /> : 
              <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {isExpanded && sidebarOpen && (
          <div className="mt-1 space-y-1">
            {group.items.map((item) => (
              <NavItem key={item.path} item={item} isChild={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: theme.background }}>
      {/* Top Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{
          borderBottom: `1px solid ${theme.border}`,
          background: theme.headerBg
        }}
      >
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Left: Logo + Hamburger */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-all hidden lg:block"
                style={{ background: theme.backgroundSecondary }}
              >
                <Menu className="w-5 h-5" style={{ color: theme.text }} />
              </button>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg lg:hidden"
                style={{ background: theme.backgroundSecondary }}
              >
                {mobileMenuOpen ? 
                  <X className="w-5 h-5" style={{ color: theme.text }} /> :
                  <Menu className="w-5 h-5" style={{ color: theme.text }} />
                }
              </button>

              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" style={{ color: theme.primary }} />
                <h1 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: theme.text }}>
                  AssetVault
                </h1>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Demo/Live Toggle */}
              <button
                onClick={toggleDemoMode}
                disabled={togglingDemo}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all"
                style={{
                  background: demoMode 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff'
                }}
              >
                {demoMode ? (
                  <>
                    <FlaskConical className="w-3 h-3" />
                    <span>DEMO</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3 h-3" />
                    <span>LIVE</span>
                  </>
                )}
              </button>

              {/* Currency Selector */}
              <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger 
                  className="w-24 h-9 text-xs hidden sm:flex"
                  style={{
                    background: theme.backgroundSecondary,
                    borderColor: theme.border,
                    color: theme.text
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: theme.cardBg, borderColor: theme.border }}>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value} style={{ color: theme.text }}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Theme Toggle */}
              <button
                onClick={toggleColorTheme}
                className="p-2 rounded-lg transition-all"
                style={{
                  background: theme.backgroundSecondary,
                  border: `1px solid ${theme.border}`,
                  color: theme.text
                }}
              >
                {colorTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Menu */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm"
                style={{
                  background: theme.backgroundSecondary,
                  border: `1px solid ${theme.border}`,
                  color: theme.text
                }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Left Sidebar - Desktop */}
      <aside
        className={`hidden lg:block fixed left-0 top-[57px] bottom-0 z-40 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
        style={{
          background: theme.cardBg,
          borderRight: `1px solid ${theme.border}`
        }}
      >
        <div className="h-full overflow-y-auto p-3 space-y-1">
          {navigationStructure.map((item, index) => {
            // Section Header
            if (item.type === 'section-header') {
              return (
                <div key={`header-${index}`} className={`${index > 0 ? 'mt-6' : 'mt-0'} mb-2`}>
                  {sidebarOpen ? (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider px-3 mb-1" style={{color: theme.primary}}>
                        {item.label}
                      </h3>
                      <p className="text-xs px-3 mb-2" style={{color: theme.textSecondary}}>
                        {item.description}
                      </p>
                    </div>
                  ) : (
                    <div className="h-px mx-2 my-2" style={{background: theme.border}} />
                  )}
                </div>
              );
            }
            
            // Divider
            if (item.type === 'divider') {
              return (
                <div key={`divider-${index}`} className="my-4">
                  <div className="h-px mx-2" style={{background: theme.border}} />
                </div>
              );
            }
            
            // Single Item or Group
            return item.type === 'single' ? (
              <NavItem key={item.path} item={item} />
            ) : item.type === 'group' ? (
              <NavGroup key={item.key} group={item} />
            ) : null;
          })}
        </div>

        {/* Subscription Badge - Bottom */}
        {sidebarOpen && userSubscription && (
          <div className="absolute bottom-4 left-3 right-3">
            <div
              className="p-3 rounded-lg text-center"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                color: '#fff'
              }}
            >
              <Crown className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xs font-bold">{userSubscription.plan || 'Free'} Plan</div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 top-[57px]">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 overflow-y-auto"
            style={{
              background: theme.cardBg,
              borderRight: `1px solid ${theme.border}`
            }}
          >
            <div className="p-3 space-y-1">
              {navigationStructure.map((item, index) => {
                // Section Header
                if (item.type === 'section-header') {
                  return (
                    <div key={`header-${index}`} className={`${index > 0 ? 'mt-6' : 'mt-0'} mb-2`}>
                      <h3 className="text-xs font-bold uppercase tracking-wider px-3 mb-1" style={{color: theme.primary}}>
                        {item.label}
                      </h3>
                      <p className="text-xs px-3 mb-2" style={{color: theme.textSecondary}}>
                        {item.description}
                      </p>
                    </div>
                  );
                }
                
                // Divider
                if (item.type === 'divider') {
                  return (
                    <div key={`divider-${index}`} className="my-4">
                      <div className="h-px mx-2" style={{background: theme.border}} />
                    </div>
                  );
                }
                
                // Single Item or Group
                return item.type === 'single' ? (
                  <NavItem key={item.path} item={item} />
                ) : item.type === 'group' ? (
                  <NavGroup key={item.key} group={item} />
                ) : null;
              })}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`transition-all duration-300 pt-[57px] ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'
        }`}
      >
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Floating Quick Actions */}
      <FloatingQuickActions />
    </div>
  );
}
