import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, Clock, Users, DollarSign, TrendingUp, Play } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${API}/auth/me`, { withCredentials: true });
        navigate('/dashboard');
      } catch (error) {
        // Not authenticated
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #1a0b2e 0%, #16001e 50%, #2d0e3e 100%)'}}>
      {/* Header */}
      <header className="border-b backdrop-blur-xl sticky top-0 z-50" style={{borderColor: '#2d1f3d', background: 'rgba(15, 10, 30, 0.9)'}}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8" style={{color: '#ec4899'}} />
            <h1 className="text-2xl font-bold" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>AssetVault</h1>
          </div>
          <Button data-testid="header-login-btn" onClick={handleLogin} className="px-6 py-2 rounded-full" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: 'white', border: 'none'}}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            Don't Let Your Wealth
            <span className="block mt-2" style={{background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 50%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>Disappear Forever</span>
          </h2>
          <p className="text-base sm:text-lg mb-8 max-w-2xl mx-auto" style={{color: '#cbd5e1'}}>
            Protect your family's future with secure asset tracking and automated dead man switch. 
            Ensure your hard-earned wealth reaches the right hands.
          </p>
          <Button data-testid="hero-get-started-btn" onClick={handleLogin} size="lg" className="px-8 py-6 text-lg rounded-full" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: 'white', border: 'none'}}>
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20" style={{background: 'rgba(19, 24, 53, 0.5)'}}>
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl sm:text-4xl font-bold mb-4" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
                See How AssetVault Protects Your Legacy
              </h3>
              <p className="text-base sm:text-lg" style={{color: '#94a3b8'}}>
                Watch how families are securing their wealth for future generations
              </p>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{background: '#131835', border: '1px solid #1e293b'}}>
              <div className="relative" style={{paddingBottom: '56.25%'}}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/_NUpwfw2Eqw?si=1s"
                  title="AssetVault Introduction"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
              The Hidden Crisis of Unclaimed Wealth
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="p-8 rounded-2xl" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <div className="text-4xl font-bold mb-2" style={{color: '#60a5fa'}}>₹35,000 Cr+</div>
                <div className="text-xl font-semibold mb-3" style={{color: '#f8fafc'}}>Unclaimed in India</div>
                <p style={{color: '#94a3b8'}}>
                  Over ₹35,000 crores remain unclaimed in Indian banks, insurance companies, and investments. 
                  Families are unaware of assets their loved ones accumulated.
                </p>
              </div>
              
              <div className="p-8 rounded-2xl" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <div className="text-4xl font-bold mb-2" style={{color: '#a78bfa'}}>$70 Billion+</div>
                <div className="text-xl font-semibold mb-3" style={{color: '#f8fafc'}}>Unclaimed in USA</div>
                <p style={{color: '#94a3b8'}}>
                  In the United States alone, over $70 billion in unclaimed property sits idle. 
                  Banks contact families for loans, but never for investments.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl" style={{background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)'}}>
              <h4 className="text-2xl font-bold mb-4" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#fbbf24'}}>
                Real Story: The Forgotten Fortune
              </h4>
              <p className="leading-relaxed" style={{color: '#cbd5e1'}}>
                In 2023, the family of Mr. Ramesh Kumar discovered ₹2.5 crores in fixed deposits and 
                mutual funds, 8 years after his passing. The banks never reached out. His family struggled 
                financially during those years, unaware of the wealth he'd left behind. 
                <span className="font-semibold" style={{color: '#60a5fa'}}> This tragedy is preventable.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" style={{background: 'rgba(19, 24, 53, 0.5)'}}>
        <div className="container mx-auto px-6">
          <h3 className="text-3xl sm:text-4xl font-bold text-center mb-16" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            Complete Asset Protection
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="p-8 rounded-xl transition-all hover:scale-105" style={{background: '#131835', border: '1px solid #1e293b'}}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{background: 'rgba(96, 165, 250, 0.1)'}}>
                <DollarSign className="w-7 h-7" style={{color: '#60a5fa'}} />
              </div>
              <h4 className="text-xl font-semibold mb-3" style={{color: '#f8fafc'}}>Track All Assets</h4>
              <p style={{color: '#94a3b8'}}>
                Banks, insurance, investments, crypto, gold, property, lockers - everything in one secure vault.
              </p>
            </div>

            <div className="p-8 rounded-xl transition-all hover:scale-105" style={{background: '#131835', border: '1px solid #1e293b'}}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{background: 'rgba(167, 139, 250, 0.1)'}}>
                <TrendingUp className="w-7 h-7" style={{color: '#a78bfa'}} />
              </div>
              <h4 className="text-xl font-semibold mb-3" style={{color: '#f8fafc'}}>Real-time Valuation</h4>
              <p style={{color: '#94a3b8'}}>
                Live prices for crypto, gold, and currency conversion. Know your exact net worth anytime.
              </p>
            </div>

            <div className="p-8 rounded-xl transition-all hover:scale-105" style={{background: '#131835', border: '1px solid #1e293b'}}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{background: 'rgba(34, 211, 238, 0.1)'}}>
                <Clock className="w-7 h-7" style={{color: '#22d3ee'}} />
              </div>
              <h4 className="text-xl font-semibold mb-3" style={{color: '#f8fafc'}}>Dead Man Switch</h4>
              <p style={{color: '#94a3b8'}}>
                Automated 3-tier reminder system. If you're inactive, your nominee gets access automatically.
              </p>
            </div>

            <div className="p-8 rounded-xl transition-all hover:scale-105" style={{background: '#131835', border: '1px solid #1e293b'}}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{background: 'rgba(96, 165, 250, 0.1)'}}>
                <Lock className="w-7 h-7" style={{color: '#60a5fa'}} />
              </div>
              <h4 className="text-xl font-semibold mb-3" style={{color: '#f8fafc'}}>Bank-Grade Security</h4>
              <p style={{color: '#94a3b8'}}>
                Encrypted storage, Google OAuth authentication. Your financial data stays private and secure.
              </p>
            </div>

            <div className="p-8 rounded-xl transition-all hover:scale-105" style={{background: '#131835', border: '1px solid #1e293b'}}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{background: 'rgba(167, 139, 250, 0.1)'}}>
                <Users className="w-7 h-7" style={{color: '#a78bfa'}} />
              </div>
              <h4 className="text-xl font-semibold mb-3" style={{color: '#f8fafc'}}>Nominee Management</h4>
              <p style={{color: '#94a3b8'}}>
                Designate trusted family members who will receive access to your asset information when needed.
              </p>
            </div>

            <div className="p-8 rounded-xl transition-all hover:scale-105" style={{background: '#131835', border: '1px solid #1e293b'}}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{background: 'rgba(34, 211, 238, 0.1)'}}>
                <ShieldCheck className="w-7 h-7" style={{color: '#22d3ee'}} />
              </div>
              <h4 className="text-xl font-semibold mb-3" style={{color: '#f8fafc'}}>Complete Privacy</h4>
              <p style={{color: '#94a3b8'}}>
                Keep your wealth private from everyone until the right time. Only you control who sees what.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b'}}>
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold mb-6" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            Secure Your Family's Future Today
          </h3>
          <p className="text-base sm:text-lg mb-8 max-w-2xl mx-auto" style={{color: '#94a3b8'}}>
            Join thousands protecting their wealth and ensuring it reaches their loved ones.
          </p>
          <Button data-testid="cta-get-started-btn" onClick={handleLogin} size="lg" className="px-8 py-6 text-lg rounded-full" style={{background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', color: 'white', border: 'none'}}>
            Start Protecting Your Assets
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{background: '#0a0e27', borderTop: '1px solid #1e293b'}}>
        <div className="container mx-auto px-6 text-center" style={{color: '#94a3b8'}}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="w-6 h-6" style={{color: '#60a5fa'}} />
            <span className="text-xl font-bold" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>AssetVault</span>
          </div>
          <p>Protecting wealth, securing futures.</p>
          <p className="mt-4 text-sm">© 2025 AssetVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
