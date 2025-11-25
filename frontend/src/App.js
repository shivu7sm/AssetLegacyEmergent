import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Settings from "./pages/Settings";
import DigitalWill from "./pages/DigitalWill";
import Documents from "./pages/Documents";
import Insights from "./pages/Insights";
import Subscription from "./pages/Subscription";
import ScheduleMessages from "./pages/ScheduleMessages";
import PortfolioGuide from "./pages/PortfolioGuide";
import Admin from "./pages/Admin";
import LoanCalculator from "./pages/LoanCalculator";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleAuth = async () => {
      // Check if session_id is in URL fragment
      const hash = location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (sessionId) {
        try {
          // Exchange session_id for session_token
          await axios.post(`${API}/auth/session`, {}, {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true
          });
          
          // Clear the hash
          window.location.hash = '';
          window.location.reload();
          return;
        } catch (error) {
          console.error('Auth failed:', error);
          setLoading(false);
        }
        return;
      }

      // Check if already authenticated
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    handleAuth();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
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
        path="/loan-calculator" 
        element={
          <ProtectedRoute>
            <LoanCalculator />
          </ProtectedRoute>
        } 
      />
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
