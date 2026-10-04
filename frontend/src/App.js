import { useEffect, useState, createContext, useContext, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";
import LandingPage from "./pages/LandingPage";
import Onboarding from "./components/Onboarding";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";

// Signed-in pages load on demand so the landing page stays small
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Assets = lazy(() => import("./pages/Assets"));
const Settings = lazy(() => import("./pages/Settings"));
const DigitalWill = lazy(() => import("./pages/DigitalWill"));
const Documents = lazy(() => import("./pages/Documents"));
const Insights = lazy(() => import("./pages/Insights"));
const Subscription = lazy(() => import("./pages/Subscription"));
const ScheduleMessages = lazy(() => import("./pages/ScheduleMessages"));
const PortfolioGuide = lazy(() => import("./pages/PortfolioGuide"));
const Admin = lazy(() => import("./pages/Admin"));
const LoanCalculatorEnhanced = lazy(() => import("./pages/LoanCalculatorEnhanced"));
const SIPCalculator = lazy(() => import("./pages/calculators/SIPCalculator"));
const SWPCalculator = lazy(() => import("./pages/calculators/SWPCalculator"));
const CompoundInterestCalculator = lazy(() => import("./pages/calculators/CompoundInterestCalculator"));
const IncomeExpense = lazy(() => import("./pages/IncomeExpense"));
const TaxBlueprint = lazy(() => import("./pages/TaxBlueprint"));
const Nominees = lazy(() => import("./pages/Nominees"));
const DeadManSwitch = lazy(() => import("./pages/DeadManSwitch"));
const BudgetPlanner = lazy(() => import("./pages/BudgetPlanner"));
const NomineeAccess = lazy(() => import("./pages/NomineeAccess"));
const NomineeDashboard = lazy(() => import("./pages/NomineeDashboard"));

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Setup axios interceptor to include session token from localStorage
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token');
  if (token && config.url?.includes(API)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      // Check if session_id is in URL fragment
      const hash = location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (sessionId) {
        try {
          // Exchange session_id for session_token
          const sessionResponse = await axios.post(`${API}/auth/session`, {}, {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true
          });
          
          // Store session token in localStorage as fallback for cross-domain cookies
          if (sessionResponse.data.session_token) {
            localStorage.setItem('session_token', sessionResponse.data.session_token);
          }
          
          // If user data is in response, use it directly
          if (sessionResponse.data.user) {
            setUser(sessionResponse.data.user);
            // Check onboarding for new user
            if (!sessionResponse.data.user.onboarding_completed) {
              setShowOnboarding(true);
            }
          } else {
            // Otherwise fetch user data
            const response = await axios.get(`${API}/auth/me`, { 
              withCredentials: true,
              headers: sessionResponse.data.session_token ? {
                'Authorization': `Bearer ${sessionResponse.data.session_token}`
              } : {}
            });
            setUser(response.data);
            // Check onboarding
            if (response.data && !response.data.onboarding_completed) {
              setShowOnboarding(true);
            }
          }
          
          // Clear the hash and navigate
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/dashboard', { replace: true });
        } catch (error) {
          console.error('Auth failed:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Check if already authenticated
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setUser(response.data);
        
        // Check if onboarding should be shown
        if (response.data && !response.data.onboarding_completed) {
          setShowOnboarding(true);
        }
        
        // If authenticated and on home page, redirect to dashboard
        if (response.data && location.pathname === '/') {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    handleAuth();
  }, [location.hash]);

  if (loading) {
    return (
      <PageLoader />
    );
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Update user state to reflect onboarding completion
    if (user) {
      setUser({...user, onboarding_completed: true});
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, showOnboarding, setShowOnboarding, handleOnboardingComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

const PROTECTED_ROUTES = [
  ["/dashboard", Dashboard],
  ["/assets", Assets],
  ["/nominees", Nominees],
  ["/dead-man-switch", DeadManSwitch],
  ["/documents", Documents],
  ["/settings", Settings],
  ["/will", DigitalWill],
  ["/insights", Insights],
  ["/subscription", Subscription],
  ["/schedule-messages", ScheduleMessages],
  ["/portfolio-guide", PortfolioGuide],
  ["/admin", Admin],
  ["/income-expense", IncomeExpense],
  ["/budget-planner", BudgetPlanner],
  ["/loan-calculator", LoanCalculatorEnhanced],
  ["/calculators/sip", SIPCalculator],
  ["/calculators/swp", SWPCalculator],
  ["/calculators/compound", CompoundInterestCalculator],
  ["/tax-blueprint", TaxBlueprint],
];

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--fuse-bg)]" role="status">
      <Loader2 className="size-6 animate-spin text-[var(--fuse-primary-text)]" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {PROTECTED_ROUTES.map(([path, Page]) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
                <Page />
              </ProtectedRoute>
            }
          />
        ))}
        <Route path="/nominee-access" element={<NomineeAccess />} />
        <Route path="/nominee-dashboard" element={<NomineeDashboard />} />
      </Routes>
    </Suspense>
  );
}

function OnboardingWrapper() {
  const { user, showOnboarding, handleOnboardingComplete } = useAuth();
  
  return (
    <>
      <AppRoutes />
      {user && showOnboarding && (
        <Onboarding open={showOnboarding} onComplete={handleOnboardingComplete} />
      )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <OnboardingWrapper />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;
