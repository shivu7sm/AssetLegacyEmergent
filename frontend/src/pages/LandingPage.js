import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, Clock, Users, DollarSign, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      try {
        await axios.get(`${API}/auth/me`, { withCredentials: true });
        navigate('/dashboard');
      } catch (error) {
        // Not authenticated, stay on landing page
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
            <h1 className="text-2xl font-bold text-white" style={{fontFamily: 'Space Grotesk, sans-serif'}}>AssetVault</h1>
          </div>
          <Button data-testid="header-login-btn" onClick={handleLogin} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-full">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            Don't Let Your Wealth
            <span className="text-emerald-500"> Disappear</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Protect your family's future with secure asset tracking and automated dead man switch. 
            Ensure your hard-earned wealth reaches the right hands.
          </p>
          <Button data-testid="hero-get-started-btn" onClick={handleLogin} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-full">
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-slate-900/50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-bold text-center text-white mb-12" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              The Hidden Crisis of Unclaimed Wealth
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
                <div className="text-emerald-500 text-4xl font-bold mb-2">₹35,000 Cr+</div>
                <div className="text-xl font-semibold text-white mb-3">Unclaimed in India</div>
                <p className="text-slate-400">
                  Over ₹35,000 crores remain unclaimed in Indian banks, insurance companies, and investments. 
                  Families are unaware of assets their loved ones accumulated.
                </p>
              </div>
              
              <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
                <div className="text-emerald-500 text-4xl font-bold mb-2">$70 Billion+</div>
                <div className="text-xl font-semibold text-white mb-3">Unclaimed in USA</div>
                <p className="text-slate-400">
                  In the United States alone, over $70 billion in unclaimed property sits idle. 
                  Banks contact families for loans, but never for investments.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-900/20 to-red-900/20 p-8 rounded-2xl border border-amber-800/30">
              <h4 className="text-2xl font-bold text-amber-400 mb-4" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                Real Story: The Forgotten Fortune
              </h4>
              <p className="text-slate-300 leading-relaxed">
                In 2023, the family of Mr. Ramesh Kumar discovered ₹2.5 crores in fixed deposits and 
                mutual funds, 8 years after his passing. The banks never reached out. His family struggled 
                financially during those years, unaware of the wealth he'd left behind. 
                <span className="text-emerald-400 font-semibold"> This tragedy is preventable.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl sm:text-4xl font-bold text-center text-white mb-16" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            Complete Asset Protection
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-slate-800/30 p-8 rounded-xl border border-slate-700 hover:border-emerald-600/50 transition-all">
              <div className="bg-emerald-600/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-7 h-7 text-emerald-500" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Track All Assets</h4>
              <p className="text-slate-400">
                Banks, insurance, investments, crypto, gold, property, lockers - everything in one secure vault.
              </p>
            </div>

            <div className="bg-slate-800/30 p-8 rounded-xl border border-slate-700 hover:border-emerald-600/50 transition-all">
              <div className="bg-emerald-600/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-emerald-500" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Real-time Valuation</h4>
              <p className="text-slate-400">
                Live prices for crypto, gold, and currency conversion. Know your exact net worth anytime.
              </p>
            </div>

            <div className="bg-slate-800/30 p-8 rounded-xl border border-slate-700 hover:border-emerald-600/50 transition-all">
              <div className="bg-emerald-600/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-7 h-7 text-emerald-500" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Dead Man Switch</h4>
              <p className="text-slate-400">
                Automated 3-tier reminder system. If you're inactive, your nominee gets access automatically.
              </p>
            </div>

            <div className="bg-slate-800/30 p-8 rounded-xl border border-slate-700 hover:border-emerald-600/50 transition-all">
              <div className="bg-emerald-600/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-emerald-500" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Bank-Grade Security</h4>
              <p className="text-slate-400">
                Encrypted storage, Google OAuth authentication. Your financial data stays private and secure.
              </p>
            </div>

            <div className="bg-slate-800/30 p-8 rounded-xl border border-slate-700 hover:border-emerald-600/50 transition-all">
              <div className="bg-emerald-600/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-emerald-500" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Nominee Management</h4>
              <p className="text-slate-400">
                Designate trusted family members who will receive access to your asset information when needed.
              </p>
            </div>

            <div className="bg-slate-800/30 p-8 rounded-xl border border-slate-700 hover:border-emerald-600/50 transition-all">
              <div className="bg-emerald-600/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Complete Privacy</h4>
              <p className="text-slate-400">
                Keep your wealth private from everyone until the right time. Only you control who sees what.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-y border-emerald-800/30">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            Secure Your Family's Future Today
          </h3>
          <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands protecting their wealth and ensuring it reaches their loved ones.
          </p>
          <Button data-testid="cta-get-started-btn" onClick={handleLogin} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-full">
            Start Protecting Your Assets
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
        <div className="container mx-auto px-6 text-center text-slate-400">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <span className="text-xl font-bold text-white" style={{fontFamily: 'Space Grotesk, sans-serif'}}>AssetVault</span>
          </div>
          <p>Protecting wealth, securing futures.</p>
          <p className="mt-4 text-sm">© 2025 AssetVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
