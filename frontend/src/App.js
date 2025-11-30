import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/AssetsNew";
import Settings from "./pages/Settings";
import DigitalWill from "./pages/DigitalWill";
import Documents from "./pages/Documents";
import Insights from "./pages/Insights";
import Subscription from "./pages/Subscription";
import ScheduleMessages from "./pages/ScheduleMessages";
import PortfolioGuide from "./pages/PortfolioGuide";
import Admin from "./pages/Admin";
import LoanCalculator from "./pages/LoanCalculator";
import IncomeExpense from "./pages/IncomeExpense";
import TaxBlueprint from "./pages/TaxBlueprint";
import NomineeAccess from "./pages/NomineeAccess";
import NomineeDashboard from "./pages/NomineeDashboard";
import Onboarding from "./components/Onboarding";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
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
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
      {user && showOnboarding && (
        <Onboarding open={showOnboarding} onComplete={handleOnboardingComplete} />
      )}
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/assets" 
        element={
          <ProtectedRoute>
            <Assets />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/will" 
        element={
          <ProtectedRoute>
            <DigitalWill />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/documents" 
        element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/insights" 
        element={
          <ProtectedRoute>
            <Insights />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subscription" 
        element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/schedule-messages" 
        element={
          <ProtectedRoute>
            <ScheduleMessages />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/portfolio-guide" 
        element={
          <ProtectedRoute>
            <PortfolioGuide />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/income-expense" 
        element={
          <ProtectedRoute>
            <IncomeExpense />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tax-blueprint" 
        element={
          <ProtectedRoute>
            <TaxBlueprint />
          </ProtectedRoute>
        } 
      />
      <Route path="/nominee-access" element={<NomineeAccess />} />
      <Route path="/nominee-dashboard" element={<NomineeDashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <ThemeProvider>
              <AppRoutes />
            </ThemeProvider>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
