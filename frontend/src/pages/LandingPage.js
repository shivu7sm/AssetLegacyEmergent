import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, Clock, Users, DollarSign, TrendingUp, Play, AlertCircle } from 'lucide-react';

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
    const authUrl = process.env.REACT_APP_AUTH_URL || 'https://auth.emergentagent.com';
    window.location.href = `${authUrl}/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #1a0b2e 0%, #16001e 50%, #2d0e3e 100%)'}}>
      {/* Header with Navigation */}
      <header className="border-b backdrop-blur-xl sticky top-0 z-50" style={{borderColor: '#2d1f3d', background: 'rgba(15, 10, 30, 0.9)'}}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8" style={{color: '#ec4899'}} />
            <h1 className="text-2xl font-bold" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>AssetVault</h1>
          </div>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <a 
              href="#truth" 
              className="text-sm font-medium hover:text-purple-400 transition-colors"
              style={{color: '#cbd5e1'}}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('truth')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              The Truth
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm font-medium hover:text-purple-400 transition-colors"
              style={{color: '#cbd5e1'}}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How It Works
            </a>
            <a 
              href="#features" 
              className="text-sm font-medium hover:text-purple-400 transition-colors"
              style={{color: '#cbd5e1'}}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Features
            </a>
            <a 
              href="#security" 
              className="text-sm font-medium hover:text-purple-400 transition-colors"
              style={{color: '#cbd5e1'}}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Security
            </a>
            <a 
              href="#pricing" 
              className="text-sm font-medium hover:text-purple-400 transition-colors"
              style={{color: '#cbd5e1'}}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              className="text-sm font-medium hover:text-purple-400 transition-colors"
              style={{color: '#cbd5e1'}}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              FAQ
            </a>
          </nav>
          
          <Button data-testid="header-login-btn" onClick={handleLogin} className="px-6 py-2 rounded-full" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: 'white', border: 'none'}}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 relative">
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)'}}></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)'}}></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
            <ShieldCheck className="w-4 h-4" style={{color: '#a855f7'}} />
            <span className="text-sm font-medium" style={{color: '#a855f7'}}>Trusted by 10,000+ families worldwide</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            Life is Uncertain.
            <span className="block mt-2">Your Legacy</span>
            <span className="block mt-2" style={{background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 50%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>Doesn't Have to Be</span>
          </h2>
          
          <p className="text-lg sm:text-xl mb-4 max-w-3xl mx-auto leading-relaxed" style={{color: '#cbd5e1'}}>
            Every day, millions in assets vanish—forgotten accounts, unclaimed policies, lost investments. 
            Your family deserves better. <span style={{color: '#f8fafc', fontWeight: 600}}>Protect what you've built.</span>
          </p>
          
          <p className="text-base sm:text-lg mb-10 max-w-2xl mx-auto" style={{color: '#94a3b8'}}>
            AssetVault ensures your hard-earned wealth reaches the people you love, 
            exactly when they need it most—automatically, securely, and with dignity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button data-testid="hero-get-started-btn" onClick={handleLogin} size="lg" className="px-10 py-7 text-lg font-semibold rounded-full shadow-2xl hover:scale-105 transition-transform" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: 'white', border: 'none'}}>
              Start Free Today
            </Button>
            <Button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} size="lg" variant="outline" className="px-10 py-7 text-lg font-semibold rounded-full" style={{borderColor: '#a855f7', color: '#a855f7', background: 'transparent'}}>
              See How It Works
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm" style={{color: '#64748b'}}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" style={{color: '#10b981'}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" style={{color: '#10b981'}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Setup in under 10 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" style={{color: '#10b981'}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Bank-level security</span>
            </div>
          </div>
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

      {/* The Hard Truth Section */}
      <section className="py-20" style={{background: 'linear-gradient(135deg, #1a0b2e 0%, #0a0e27 100%)'}}>
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            {/* Title */}
            <div className="text-center mb-12">
              <h3 className="text-3xl sm:text-4xl font-bold mb-4" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
                The Uncomfortable Truth About Your Money
              </h3>
              <p className="text-lg" style={{color: '#94a3b8'}}>
                Financial institutions only remember you when you owe them money
              </p>
            </div>

            {/* Two Column Comparison */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* They WILL Contact You - Red Side */}
              <div className="rounded-2xl p-8" style={{background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.3)'}}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'rgba(239, 68, 68, 0.2)'}}>
                    <span className="text-2xl">📞</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold" style={{color: '#ef4444'}}>They WILL Call You</h4>
                    <p className="text-sm" style={{color: '#94a3b8'}}>For liabilities</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{color: '#ef4444'}} />
                    <div>
                      <p className="font-semibold mb-1" style={{color: '#f8fafc'}}>Loan EMIs</p>
                      <p className="text-sm" style={{color: '#cbd5e1'}}>Daily reminders before and after due date</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{color: '#ef4444'}} />
                    <div>
                      <p className="font-semibold mb-1" style={{color: '#f8fafc'}}>Credit Card Bills</p>
                      <p className="text-sm" style={{color: '#cbd5e1'}}>Multiple calls, SMS, and emails</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{color: '#ef4444'}} />
                    <div>
                      <p className="font-semibold mb-1" style={{color: '#f8fafc'}}>Mortgage Payments</p>
                      <p className="text-sm" style={{color: '#cbd5e1'}}>Legal notices if you miss payments</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{color: '#ef4444'}} />
                    <div>
                      <p className="font-semibold mb-1" style={{color: '#f8fafc'}}>Outstanding Debts</p>
                      <p className="text-sm" style={{color: '#cbd5e1'}}>They'll track down your family if needed</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-6 p-4 rounded-lg" style={{background: 'rgba(239, 68, 68, 0.1)'}}>
                  <p className="text-sm font-semibold" style={{color: '#ef4444'}}>
                    💡 They have entire departments dedicated to recovering what you owe
                  </p>
                </div>
              </div>

              {/* They WON'T Contact You - Gray Side */}
              <div className="rounded-2xl p-8" style={{background: 'rgba(100, 116, 139, 0.1)', border: '2px solid rgba(100, 116, 139, 0.3)'}}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'rgba(100, 116, 139, 0.2)'}}>
                    <span className="text-2xl">🤐</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold" style={{color: '#94a3b8'}}>They WON'T Call You</h4>
                    <p className="text-sm" style={{color: '#64748b'}}>For assets</p>
                  </div>
                </div>
                <ul className="space-y-4 opacity-60">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-1 flex-shrink-0 rounded-full" style={{background: 'rgba(100, 116, 139, 0.3)'}}></div>
                    <div>
                      <p className="font-semibold mb-1" style={{color: '#cbd5e1'}}>Savings Accounts</p>
                      <p className="text-sm" style={{color: '#94a3b8'}}>Dormant after 10 years of inactivity</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-1 flex-shrink-0 rounded-full" style={{background: 'rgba(100, 116, 139, 0.3)'}}></div>
                    <div>
                      <p className="font-semibold mb-1" style={{color: '#cbd5e1'}}>Fixed Deposits</p>
                      <p className="text-sm" style={{color: '#94a3b8'}}>Maturity notices? Maybe one letter</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-1 flex-shrink-0 rounded-full" style={{background: 'rgba(100, 116, 139, 0.3)'}}></div>
                    <div>
                      <p className="font-semibold mb-1" style={{color: '#cbd5e1'}}>Insurance Policies</p>
                      <p className="text-sm" style={{color: '#94a3b8'}}>Unclaimed policies worth billions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-1 flex-shrink-0 rounded-full" style={{background: 'rgba(100, 116, 139, 0.3)'}}></div>
                    <div>
                      <p className="font-semibold mb-1" style={{color: '#cbd5e1'}}>Mutual Funds & Stocks</p>
                      <p className="text-sm" style={{color: '#94a3b8'}}>Forgotten in demat accounts</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-1 flex-shrink-0 rounded-full" style={{background: 'rgba(100, 116, 139, 0.3)'}}></div>
                    <div>
                      <p className="font-semibold mb-1" style={{color: '#cbd5e1'}}>Locker Contents</p>
                      <p className="text-sm" style={{color: '#94a3b8'}}>Your family won't even know they exist</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-1 flex-shrink-0 rounded-full" style={{background: 'rgba(100, 116, 139, 0.3)'}}></div>
                    <div>
                      <p className="font-semibold mb-1" style={{color: '#cbd5e1'}}>Provident Fund</p>
                      <p className="text-sm" style={{color: '#94a3b8'}}>Millions in unclaimed EPF</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-6 p-4 rounded-lg" style={{background: 'rgba(100, 116, 139, 0.1)'}}>
                  <p className="text-sm font-semibold" style={{color: '#94a3b8'}}>
                    🚫 No one is looking out for your assets except you
                  </p>
                </div>
              </div>
            </div>

            {/* Shocking Statistics */}
            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                <div className="text-4xl font-bold mb-2" style={{color: '#a855f7'}}>₹35,000 Cr+</div>
                <p className="text-sm" style={{color: '#cbd5e1'}}>Unclaimed deposits in Indian banks</p>
              </div>
              <div className="text-center p-6 rounded-xl" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                <div className="text-4xl font-bold mb-2" style={{color: '#a855f7'}}>₹25,000 Cr+</div>
                <p className="text-sm" style={{color: '#cbd5e1'}}>Unclaimed insurance policies in India</p>
              </div>
              <div className="text-center p-6 rounded-xl" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                <div className="text-4xl font-bold mb-2" style={{color: '#a855f7'}}>10+ Years</div>
                <p className="text-sm" style={{color: '#cbd5e1'}}>Average time before accounts go dormant</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center p-8 rounded-2xl" style={{background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', border: '2px solid rgba(168, 85, 247, 0.3)'}}>
              <h4 className="text-2xl font-bold mb-4" style={{color: '#f8fafc'}}>
                Don't Let Your Hard-Earned Money Disappear
              </h4>
              <p className="text-lg mb-6 max-w-3xl mx-auto" style={{color: '#cbd5e1'}}>
                While banks chase you for every rupee you owe, your savings, investments, and policies sit forgotten. 
                <span style={{color: '#a855f7', fontWeight: 600}}> Your family deserves to know what you've built for them.</span>
              </p>
              <Button onClick={handleLogin} size="lg" className="px-10 py-6 text-lg rounded-full" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: 'white', border: 'none'}}>
                Protect Your Assets Today - It's Free
              </Button>
              <p className="text-sm mt-4" style={{color: '#64748b'}}>
                No credit card required • Setup in 10 minutes • Bank-level security
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20" style={{background: '#0a0e27'}}>
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold mb-4" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
              Three Simple Steps to Peace of Mind
            </h3>
            <p className="text-base sm:text-lg" style={{color: '#94a3b8'}}>
              Protecting your legacy shouldn't be complicated. We've made it beautifully simple.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-6 items-start p-8 rounded-2xl transition-all hover:scale-102" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl" style={{background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)', color: 'white'}}>
                  1
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-3" style={{color: '#f8fafc'}}>Add Your Assets in Minutes</h4>
                  <p className="text-lg mb-3" style={{color: '#cbd5e1'}}>
                    Bank accounts, properties, investments, insurance policies, crypto—add them all with simple forms. 
                    No bank login required, you control what you share.
                  </p>
                  <p className="text-sm" style={{color: '#64748b'}}>
                    ✓ Multi-currency support  •  ✓ Real-time net worth tracking  •  ✓ AI-powered insights
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 items-start p-8 rounded-2xl transition-all hover:scale-102" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl" style={{background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', color: 'white'}}>
                  2
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-3" style={{color: '#f8fafc'}}>Designate Your Trusted Nominees</h4>
                  <p className="text-lg mb-3" style={{color: '#cbd5e1'}}>
                    Choose who should receive your asset information. You can add family members, lawyers, or trusted advisors. 
                    Set custom timelines and decide what each person can access.
                  </p>
                  <p className="text-sm" style={{color: '#64748b'}}>
                    ✓ Multiple nominees  •  ✓ Granular permissions  •  ✓ Encrypted document sharing
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start p-8 rounded-2xl transition-all hover:scale-102" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl" style={{background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', color: 'white'}}>
                  3
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-3" style={{color: '#f8fafc'}}>Relax—We'll Handle the Rest</h4>
                  <p className="text-lg mb-3" style={{color: '#cbd5e1'}}>
                    Our automated Dead Man Switch monitors your activity. If life takes an unexpected turn, 
                    your nominees are notified and guided through accessing your asset information—all while respecting your privacy.
                  </p>
                  <p className="text-sm" style={{color: '#64748b'}}>
                    ✓ Smart reminders  •  ✓ Grace periods  •  ✓ Instant activation option
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-12 p-8 rounded-2xl" style={{background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
              <p className="text-xl font-semibold mb-4" style={{color: '#f8fafc'}}>
                That's it. Your legacy is protected.
              </p>
              <p className="text-base" style={{color: '#94a3b8'}}>
                Log in whenever you want to add new assets or update information. 
                We'll keep watch, so you don't have to worry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20" style={{background: 'rgba(19, 24, 53, 0.5)'}}>
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

      {/* Security Message Section */}
      <section id="security" className="py-16" style={{background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)', borderTop: '1px solid #2d1f3d', borderBottom: '1px solid #2d1f3d'}}>
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-6 p-8 rounded-2xl" style={{background: '#131835', border: '2px solid #ef4444'}}>
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background: 'rgba(239, 68, 68, 0.2)'}}>
                  <ShieldCheck className="w-8 h-8" style={{color: '#ef4444'}} />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-bold mb-4" style={{color: '#f8fafc'}}>
                  🔒 What We DON'T Store (And You Shouldn't Either)
                </h4>
                <p className="text-lg mb-4 leading-relaxed" style={{color: '#cbd5e1'}}>
                  <span style={{color: '#ef4444', fontWeight: 700}}>NEVER store passwords, PINs, or bank login credentials anywhere—including AssetVault.</span> 
                  {' '}Your family doesn't need them to claim your assets.
                </p>
                <div className="p-4 rounded-lg mb-4" style={{background: 'rgba(168, 85, 247, 0.1)', borderLeft: '3px solid #a855f7'}}>
                  <p className="text-base" style={{color: '#cbd5e1'}}>
                    <strong style={{color: '#a855f7'}}>What AssetVault Does:</strong> We help you document WHAT assets you have and WHERE they are located. 
                    Your family can then legally claim these assets through proper channels with death certificates and legal documentation.
                  </p>
                </div>
                <p className="text-base" style={{color: '#94a3b8'}}>
                  Think of AssetVault as an organized inventory map—not a key safe. Banks, insurance companies, and investment firms have legal processes 
                  for rightful heirs to claim assets. They just need to know those assets exist!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold mb-4" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
              Simple, Transparent Pricing
            </h3>
            <p className="text-base sm:text-lg" style={{color: '#94a3b8'}}>
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-2xl" style={{background: '#1a1229', border: '1px solid #2d1f3d'}}>
              <div className="text-sm font-semibold mb-2" style={{color: '#94a3b8'}}>FREE</div>
              <div className="mb-6">
                <span className="text-4xl font-bold" style={{color: '#f8fafc'}}>$0</span>
                <span style={{color: '#94a3b8'}}>/forever</span>
              </div>
              <ul className="space-y-3 mb-8" style={{color: '#cbd5e1'}}>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Track up to <strong>10 assets</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Basic dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>One nominee</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Dead man switch (90 days)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Document vault (<strong>50MB</strong>)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Email notifications</span>
                </li>
              </ul>
              <Button onClick={handleLogin} variant="outline" className="w-full" style={{borderColor: '#a855f7', color: '#a855f7'}}>
                Start Free
              </Button>
            </div>

            {/* Pro Plan - Featured */}
            <div className="p-8 rounded-2xl relative" style={{background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', border: '2px solid #ec4899'}}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: 'white'}}>
                MOST POPULAR
              </div>
              <div className="text-sm font-semibold mb-2" style={{color: '#ec4899'}}>PRO</div>
              <div className="mb-6">
                <span className="text-4xl font-bold" style={{color: '#f8fafc'}}>$9.99</span>
                <span style={{color: '#94a3b8'}}>/month</span>
              </div>
              <ul className="space-y-3 mb-8" style={{color: '#cbd5e1'}}>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span><strong>100 assets</strong> tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Advanced analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Multiple nominees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Custom DMS timing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>AI financial insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Document vault (<strong>5GB</strong>)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <Button onClick={handleLogin} className="w-full text-white" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}>
                Start Pro Plan
              </Button>
            </div>

            {/* Family Plan */}
            <div className="p-8 rounded-2xl" style={{background: '#1a1229', border: '1px solid #2d1f3d'}}>
              <div className="text-sm font-semibold mb-2" style={{color: '#94a3b8'}}>FAMILY</div>
              <div className="mb-6">
                <span className="text-4xl font-bold" style={{color: '#f8fafc'}}>$24.99</span>
                <span style={{color: '#94a3b8'}}>/month</span>
              </div>
              <ul className="space-y-3 mb-8" style={{color: '#cbd5e1'}}>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span><strong>Everything in Pro</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Up to <strong>5 family members</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Shared asset tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Family financial planning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Document vault (<strong>50GB</strong>)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Scheduled messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>24/7 premium support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: '#10b981'}}>✓</span>
                  <span>Custom integrations</span>
                </li>
              </ul>
              <Button onClick={handleLogin} className="w-full text-white" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}>
                Start Family Plan
              </Button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm" style={{color: '#64748b'}}>
              Free plan available forever. No credit card required. Upgrade or cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
              Frequently Asked Questions
            </h3>
            <p className="text-center text-base sm:text-lg mb-12" style={{color: '#94a3b8'}}>
              Everything you need to know about protecting your legacy
            </p>

            <div className="space-y-4">
              {/* FAQ Item 1 */}
              <details className="group rounded-xl p-6 transition-all" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h4 className="text-lg font-semibold" style={{color: '#f8fafc'}}>
                    What happens to my assets if something unexpected happens to me?
                  </h4>
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" style={{color: '#a855f7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4" style={{color: '#cbd5e1'}}>
                  <p>With AssetVault's Dead Man Switch, your designated nominees are automatically notified if you're inactive for a specified period (default 90 days). They'll receive access to your asset information and important documents, ensuring your wealth doesn't get lost in the system. You'll receive reminders before activation, so false triggers are prevented.</p>
                </div>
              </details>

              {/* FAQ Item 2 */}
              <details className="group rounded-xl p-6 transition-all" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h4 className="text-lg font-semibold" style={{color: '#f8fafc'}}>
                    Is my financial data secure?
                  </h4>
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" style={{color: '#a855f7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4" style={{color: '#cbd5e1'}}>
                  <p>Absolutely. We use bank-level encryption (256-bit SSL) for all data transmission and storage. Your sensitive documents are encrypted at rest, and we never share your information with third parties. Plus, you control exactly what information is shared with your nominees.</p>
                </div>
              </details>

              {/* FAQ Item 3 */}
              <details className="group rounded-xl p-6 transition-all" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h4 className="text-lg font-semibold" style={{color: '#f8fafc'}}>
                    How is this different from a traditional will?
                  </h4>
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" style={{color: '#a855f7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4" style={{color: '#cbd5e1'}}>
                  <p>AssetVault complements your will, it doesn't replace it. While a will handles legal ownership transfer (which can take months or years), AssetVault ensures your family knows what assets exist and how to access them immediately. Many assets are lost simply because families don't know they exist. We solve that problem.</p>
                </div>
              </details>

              {/* FAQ Item 4 */}
              <details className="group rounded-xl p-6 transition-all" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h4 className="text-lg font-semibold" style={{color: '#f8fafc'}}>
                    Can I track assets in multiple currencies?
                  </h4>
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" style={{color: '#a855f7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4" style={{color: '#cbd5e1'}}>
                  <p>Yes! AssetVault supports multiple currencies including USD, EUR, GBP, INR, and many more. Assets are automatically converted to your selected base currency using real-time exchange rates, giving you an accurate total net worth view across all your international holdings.</p>
                </div>
              </details>

              {/* FAQ Item 5 */}
              <details className="group rounded-xl p-6 transition-all" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h4 className="text-lg font-semibold" style={{color: '#f8fafc'}}>
                    What if I forget to check in and the Dead Man Switch triggers by accident?
                  </h4>
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" style={{color: '#a855f7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4" style={{color: '#cbd5e1'}}>
                  <p>We've designed multiple safeguards. You'll receive reminder emails at 60, 75, and 85 days of inactivity (customizable). Simply logging into AssetVault resets the timer. Even if you miss all reminders, you have a grace period after the trigger to deactivate the notification before your nominees are contacted.</p>
                </div>
              </details>

              {/* FAQ Item 6 */}
              <details className="group rounded-xl p-6 transition-all" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h4 className="text-lg font-semibold" style={{color: '#f8fafc'}}>
                    Can I cancel my subscription anytime?
                  </h4>
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" style={{color: '#a855f7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4" style={{color: '#cbd5e1'}}>
                  <p>Yes, absolutely. You can cancel anytime from your account settings. You'll retain access to premium features until the end of your current billing period. If you downgrade to the Free plan, your data remains accessible with basic features. You can always reactivate your subscription later.</p>
                </div>
              </details>

              {/* FAQ Item 7 */}
              <details className="group rounded-xl p-6 transition-all" style={{background: '#131835', border: '1px solid #1e293b'}}>
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h4 className="text-lg font-semibold" style={{color: '#f8fafc'}}>
                    How do I get started?
                  </h4>
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" style={{color: '#a855f7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4" style={{color: '#cbd5e1'}}>
                  <p>It's simple! Click "Get Started Free" to create your account. Start by adding your first few assets (bank accounts, properties, investments). Then designate a nominee and set your Dead Man Switch preferences. The entire setup takes less than 10 minutes, and you can always add more assets later.</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', borderTop: '1px solid #2d1f3d', borderBottom: '1px solid #2d1f3d'}}>
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold mb-6" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            Secure Your Family's Future Today
          </h3>
          <p className="text-base sm:text-lg mb-8 max-w-2xl mx-auto" style={{color: '#94a3b8'}}>
            Join thousands protecting their wealth and ensuring it reaches their loved ones.
          </p>
          <Button data-testid="cta-get-started-btn" onClick={handleLogin} size="lg" className="px-8 py-6 text-lg rounded-full" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: 'white', border: 'none'}}>
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
