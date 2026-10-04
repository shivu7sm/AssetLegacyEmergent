import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard, Wallet, Settings, LogOut, ShieldCheck, FileText,
  FolderLock, Sparkles, Calendar, Crown, ShieldAlert, FlaskConical,
  Database, Receipt, Zap, Sun, Moon, Monitor, Calculator, ChevronRight,
  PanelLeft, TrendingUp, BookOpen, User, Shield, Clock, Eye, Palette, CreditCard, Heart,
  TrendingDown, PiggyBank, RefreshCw, Link as LinkIcon, Users, Globe, Landmark, MoveRight,
  ChevronsUpDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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

const SCHEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
];

// Sidebar navigation, in Fuse's "section → items → children" shape
const NAVIGATION = [
  {
    id: 'legacy',
    label: 'Legacy Protection',
    description: "Protect your family's future",
    children: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, testId: 'nav-dashboard' },
      { path: '/assets', label: 'Assets & Liabilities', icon: Wallet, testId: 'nav-assets' },
      { path: '/nominees', label: 'Nominees', icon: Users, testId: 'nav-nominees' },
      { path: '/dead-man-switch', label: "Dead Man's Switch", icon: Clock, testId: 'nav-dms' },
      {
        id: 'documents',
        label: 'Documents',
        icon: FolderLock,
        children: [
          { path: '/documents', label: 'All Documents', icon: FileText, testId: 'nav-all-docs' },
          { path: '/documents?filter=unlinked', label: 'Unlinked', icon: LinkIcon, testId: 'nav-unlinked-docs' },
          { path: '/documents?category=asset', label: 'Asset Documents', icon: Wallet, testId: 'nav-asset-docs' },
          { path: '/documents?category=family', label: 'Family Documents', icon: Heart, testId: 'nav-family-docs' }
        ]
      }
    ]
  },
  {
    id: 'wealth',
    label: 'Wealth Tools',
    description: 'Grow and optimize your wealth',
    children: [
      { path: '/insights', label: 'AI Assistant', icon: Sparkles, badge: 'New', testId: 'nav-insights' },
      { path: '/income-expense', label: 'Income & Expenses', icon: Receipt, testId: 'nav-income-expense' },
      { path: '/budget-planner', label: 'Budget Planner', icon: PiggyBank, badge: 'New', testId: 'nav-budget' },
      {
        id: 'tax',
        label: 'Tax & Planning',
        icon: Zap,
        children: [
          { path: '/tax-blueprint', label: 'Overview', icon: LayoutDashboard, testId: 'nav-tax-dashboard' },
          { path: '/tax-blueprint?tab=80c-planner', label: '80C Planner', icon: PiggyBank, testId: 'nav-80c-planner' },
          { path: '/tax-blueprint?tab=hidden-sip', label: 'Hidden SIP', icon: Eye, testId: 'nav-hidden-sip' },
          { path: '/tax-blueprint?tab=tax-benefits', label: 'Tax Guide', icon: BookOpen, testId: 'nav-tax-guide' },
          { path: '/tax-blueprint?tab=wealth-structures', label: 'HUF & Trust', icon: Landmark, testId: 'nav-huf-trust' },
          { path: '/tax-blueprint?tab=regime', label: 'Tax Regime', icon: RefreshCw, testId: 'nav-tax-regime' }
        ]
      },
      {
        id: 'calculators',
        label: 'Calculators',
        icon: Calculator,
        children: [
          { path: '/loan-calculator', label: 'Loan Planner', icon: Calculator, testId: 'nav-loan-calculator' },
          { path: '/calculators/sip', label: 'SIP Calculator', icon: TrendingUp, testId: 'nav-sip-calculator' },
          { path: '/calculators/swp', label: 'SWP Calculator', icon: TrendingDown, testId: 'nav-swp-calculator' },
          { path: '/calculators/compound', label: 'Compound Interest', icon: Zap, badge: 'New', testId: 'nav-compound-calculator' }
        ]
      },
      { path: '/schedule-messages', label: 'Scheduled Messages', icon: Calendar, testId: 'nav-messages' }
    ]
  },
  {
    id: 'account',
    label: 'Account',
    children: [
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        children: [
          { path: '/settings?tab=profile', label: 'Profile', icon: User, testId: 'nav-settings-profile' },
          { path: '/settings?tab=preferences', label: 'Preferences', icon: Eye, testId: 'nav-settings-preferences' },
          { path: '/settings?tab=appearance', label: 'Appearance', icon: Palette, testId: 'nav-settings-appearance' },
          { path: '/settings?tab=subscription', label: 'Subscription', icon: CreditCard, testId: 'nav-settings-subscription' },
          { path: '/settings?tab=security', label: 'Security', icon: Shield, testId: 'nav-settings-security' },
          { path: '/settings?tab=privacy', label: 'Privacy & Consent', icon: Globe, testId: 'nav-settings-privacy' }
        ]
      }
    ]
  }
];

const ADMIN_ITEM = { path: '/admin', label: 'Admin Panel', icon: ShieldAlert, testId: 'nav-admin' };

// A path with a query string is active only on an exact match; a plain path
// is active only when no query string is selecting a sub-page.
const isPathActive = (path, location) =>
  path.includes('?')
    ? location.pathname + location.search === path
    : location.pathname === path && !location.search;

const hasActiveChild = (node, location) =>
  node.children?.some((child) =>
    child.children ? hasActiveChild(child, location) : isPathActive(child.path, location)
  );

function NavBadge({ children }) {
  return (
    <span className="rounded bg-pink-700 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-white">
      {children}
    </span>
  );
}

function NavLink({ item, depth, location, onNavigate }) {
  const Icon = item.icon;
  const active = isPathActive(item.path, location);
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      data-testid={item.testId}
      aria-current={active ? 'page' : undefined}
      onClick={() => onNavigate(item.path)}
      className={`relative flex w-full items-center gap-x-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-150 select-none ${
        active ? 'text-white' : 'text-zinc-300 hover:bg-zinc-300/10 hover:text-white'
      } ${depth > 0 ? 'pl-8' : ''}`}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-lg bg-zinc-300/10"
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
          aria-hidden="true"
        />
      )}
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary-400" aria-hidden="true" />
      )}
      <Icon className="relative size-4 shrink-0" aria-hidden="true" />
      <span className="relative flex-auto truncate">{item.label}</span>
      {item.badge && <span className="relative"><NavBadge>{item.badge}</NavBadge></span>}
    </button>
  );
}

function NavGroup({ group, expanded, onToggle, location, onNavigate }) {
  const Icon = group.icon;
  const reduceMotion = useReducedMotion();
  const childActive = hasActiveChild(group, location);

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => onToggle(group.id)}
        className={`flex w-full items-center gap-x-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-150 select-none hover:bg-zinc-300/10 hover:text-white ${
          childActive ? 'text-white' : 'text-zinc-300'
        }`}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-auto truncate">{group.label}</span>
        <ChevronRight
          className={`size-4 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="children"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-1 flex flex-col gap-y-1">
              {group.children.map((child) => (
                <NavLink key={child.path} item={child} depth={1} location={location} onNavigate={onNavigate} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Navigation({ sections, expanded, onToggle, location, onNavigate }) {
  return (
    <LayoutGroup id="sidebar-nav">
      <nav className="flex flex-col gap-y-5" aria-label="Main">
        {sections.map((section) => (
          <div key={section.id} className="flex flex-col px-4">
            <div className="px-2.5 py-1.5">
              <div className="text-xs font-semibold text-primary-300">{section.label}</div>
              {section.description && (
                <div className="text-[11px] font-medium text-zinc-400">{section.description}</div>
              )}
            </div>
            <div className="mt-1 flex flex-col gap-y-1">
              {section.children.map((node) =>
                node.children ? (
                  <NavGroup
                    key={node.id}
                    group={node}
                    expanded={!!expanded[node.id]}
                    onToggle={onToggle}
                    location={location}
                    onNavigate={onNavigate}
                  />
                ) : (
                  <NavLink key={node.path} item={node} depth={0} location={location} onNavigate={onNavigate} />
                )
              )}
            </div>
          </div>
        ))}
      </nav>
    </LayoutGroup>
  );
}

function UserMenu({ user, onLogout, onNavigate }) {
  const name = user?.name || 'Account';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-x-3 rounded-lg p-2 text-left transition-colors duration-150 hover:bg-zinc-300/10"
          data-testid="user-menu"
        >
          {user?.picture ? (
            <img src={user.picture} alt="" className="size-8 rounded-full object-cover" />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-primary-700 text-xs font-semibold text-white">
              {initials}
            </span>
          )}
          <span className="flex min-w-0 flex-auto flex-col">
            <span className="truncate text-[13px] font-medium text-white">{name}</span>
            {user?.email && <span className="truncate text-[11px] text-zinc-400">{user.email}</span>}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">{name}</div>
          {user?.email && <div className="truncate text-xs text-muted-foreground">{user.email}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onNavigate('/settings?tab=profile')}>
          <User className="mr-2 size-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onNavigate('/settings?tab=subscription')}>
          <CreditCard className="mr-2 size-4" /> Subscription
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} data-testid="logout-button">
          <LogOut className="mr-2 size-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar({ sections, expanded, onToggle, location, onNavigate, subscription, user, onLogout }) {
  return (
    <div className="dark flex h-full flex-col bg-[var(--fuse-sidebar-bg)] text-[var(--fuse-sidebar-text)]">
      {/* Header */}
      <div className="flex items-center gap-x-2.5 pl-6 pr-4 pt-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary-600">
          <ShieldCheck className="size-5 text-white" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-none tracking-wider text-white">ASSETVAULT</span>
          <span className="font-mono text-[10px] font-medium leading-3 tracking-tighter text-zinc-400">Legacy & Wealth</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 min-h-0 flex-auto overflow-y-auto pb-4">
        <Navigation
          sections={sections}
          expanded={expanded}
          onToggle={onToggle}
          location={location}
          onNavigate={onNavigate}
        />
      </div>

      {/* Plan card */}
      {subscription && (
        <div className="m-4 mb-2 rounded-lg border border-zinc-50/5 bg-zinc-50/5 p-4">
          <div className="flex items-center gap-x-2 text-[13px] font-semibold text-white">
            <Crown className="size-4 text-amber-400" aria-hidden="true" />
            {subscription.plan || 'Free'} plan
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Manage your plan, billing and usage limits.
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/settings?tab=subscription')}
            className="mt-4 flex w-full items-center justify-center gap-x-2 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-primary-500"
          >
            View plans
            <MoveRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-[var(--fuse-sidebar-border)] p-2">
        <UserMenu user={user} onLogout={onLogout} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function SchemeSwitcher({ scheme, setScheme, colorTheme }) {
  const ActiveIcon = colorTheme === 'dark' ? Moon : Sun;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change color scheme"
          data-testid="theme-toggle"
          className="flex size-9 items-center justify-center rounded-full text-[var(--fuse-text-secondary)] transition-colors duration-150 hover:bg-zinc-500/10"
        >
          <ActiveIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={scheme} onValueChange={setScheme}>
          {SCHEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="mr-2 size-4" /> {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const { selectedCurrency, setSelectedCurrency } = useApp();
  const { user } = useAuth();
  const { scheme, colorTheme, setColorTheme } = useTheme();
  const [demoMode, setDemoMode] = useState(false);
  const [togglingDemo, setTogglingDemo] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => {
    // Open the group holding the current page, as Fuse does on first load
    const open = {};
    NAVIGATION.forEach((section) =>
      section.children.forEach((node) => {
        if (node.children && hasActiveChild(node, location)) open[node.id] = true;
      })
    );
    return open;
  });

  const isAdmin = user?.role === 'admin';
  const sections = isAdmin
    ? [...NAVIGATION.slice(0, -1), { ...NAVIGATION[NAVIGATION.length - 1], children: [...NAVIGATION[NAVIGATION.length - 1].children, ADMIN_ITEM] }]
    : NAVIGATION;

  useEffect(() => {
    if (!user) return;
    axios
      .get(`${API}/demo/status`, { withCredentials: true })
      .then((res) => setDemoMode(res.data.demo_mode))
      .catch((error) => console.error('Failed to fetch demo status:', error));
    axios
      .get(`${API}/subscription/current`, { withCredentials: true })
      .then((res) => setSubscription(res.data))
      .catch((error) => console.error('Failed to fetch subscription:', error));
  }, [user]);

  // Close the mobile drawer on Escape
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

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

  const handleNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const toggleGroup = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleSidebar = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setSidebarOpen((open) => !open);
    } else {
      setMobileOpen((open) => !open);
    }
  };

  const sidebar = (
    <Sidebar
      sections={sections}
      expanded={expanded}
      onToggle={toggleGroup}
      location={location}
      onNavigate={handleNavigate}
      subscription={subscription}
      user={user}
      onLogout={handleLogout}
    />
  );

  const drawerTransition = reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 40 };

  return (
    <div className="min-h-screen bg-[var(--fuse-bg)] text-[var(--fuse-text)]">
      {/* Sidebar - desktop */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={drawerTransition}
            className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-[var(--fuse-sidebar-border)] lg:block print:hidden"
          >
            {sidebar}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar - mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw]"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={drawerTransition}
            >
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className={`flex min-h-screen flex-col transition-[padding] duration-300 ${sidebarOpen ? 'lg:pl-[280px]' : ''}`}>
        {/* Toolbar */}
        <header className="sticky top-0 z-30 flex items-center gap-x-2 border-b border-[var(--fuse-border)] bg-[var(--fuse-header-bg)] px-4 py-2.5 backdrop-blur print:hidden">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle navigation"
            className="flex size-9 items-center justify-center rounded-full text-[var(--fuse-text-secondary)] transition-colors duration-150 hover:bg-zinc-500/10"
          >
            <PanelLeft className="size-5" />
          </button>

          <div className="mx-1 h-5 border-l border-[var(--fuse-border)]" />

          {/* Brand, only when the sidebar isn't showing it */}
          <div className={`flex items-center gap-x-2 ${sidebarOpen ? 'lg:hidden' : ''}`}>
            <ShieldCheck className="size-5 text-[var(--fuse-primary-text)]" aria-hidden="true" />
            <span className="text-sm font-semibold">AssetVault</span>
          </div>

          <div className="flex-auto" />

          <div className="flex items-center gap-x-2">
            {/* Demo / live data */}
            <button
              type="button"
              onClick={toggleDemoMode}
              disabled={togglingDemo}
              data-testid="demo-toggle"
              title={demoMode ? 'Showing demo data. Switch to live data.' : 'Showing live data. Switch to demo data.'}
              className={`hidden items-center gap-x-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors duration-150 disabled:opacity-60 sm:flex ${
                demoMode
                  ? 'bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-400'
              }`}
            >
              {demoMode ? <FlaskConical className="size-3.5" /> : <Database className="size-3.5" />}
              {demoMode ? 'Demo' : 'Live'}
            </button>

            {/* Currency */}
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="hidden h-9 w-[104px] rounded-full text-xs sm:flex" aria-label="Display currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <SchemeSwitcher scheme={scheme} setScheme={setColorTheme} colorTheme={colorTheme} />
          </div>
        </header>

        {/* Content */}
        <main className="flex-auto">
          <motion.div
            key={location.pathname}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <FloatingQuickActions />
    </div>
  );
}
