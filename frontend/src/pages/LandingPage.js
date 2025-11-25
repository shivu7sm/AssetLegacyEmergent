import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, Clock, Users, DollarSign, TrendingUp, Play, AlertCircle, CheckCircle, ArrowRight, Zap, Heart, FileText, Database, CreditCard, Shield } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme System
const THEMES = {
  purple: {
    name: 'Purple Dream',
    primary: 'linear-gradient(135deg, #6A11CB 0%, #8E54E9 50%, #FF6A88 100%)',
    secondary: 'linear-gradient(135deg, #8E54E9 0%, #FF6A88 100%)',
    accent: 'linear-gradient(135deg, #FF6A88 0%, #FFB199 100%)',
    light: 'linear-gradient(135deg, #FFB199 0%, #FFE5DD 100%)',
    neutral: 'linear-gradient(135deg, #FAFAFA 0%, #FFFFFF 100%)',
    footer: 'linear-gradient(135deg, #2D1B4E 0%, #1A0B2E 100%)',
    buttonGradient: 'linear-gradient(135deg, #6A11CB 0%, #FF6A88 100%)'
  },
  blue: {
    name: 'Ocean Deep',
    primary: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
    secondary: 'linear-gradient(135deg, #203A43 0%, #2C5364 100%)',
    accent: 'linear-gradient(135deg, #2C5364 0%, #4CA2CD 100%)',
    light: 'linear-gradient(135deg, #4CA2CD 0%, #B8E6FF 100%)',
    neutral: 'linear-gradient(135deg, #F5F7FA 0%, #FFFFFF 100%)',
    footer: 'linear-gradient(135deg, #0F2027 0%, #000000 100%)',
    buttonGradient: 'linear-gradient(135deg, #0F2027 0%, #2C5364 100%)'
  },
  green: {
    name: 'Money Growth',
    primary: 'linear-gradient(135deg, #11998E 0%, #38EF7D 50%, #C8FFB1 100%)',
    secondary: 'linear-gradient(135deg, #38EF7D 0%, #C8FFB1 100%)',
    accent: 'linear-gradient(135deg, #C8FFB1 0%, #E0FFD1 100%)',
    light: 'linear-gradient(135deg, #E0FFD1 0%, #F5FFF0 100%)',
    neutral: 'linear-gradient(135deg, #F8FFF8 0%, #FFFFFF 100%)',
    footer: 'linear-gradient(135deg, #0D7377 0%, #0A4D4E 100%)',
    buttonGradient: 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)'
  }
};

const HIGHLIGHT = '#FFC300';

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState('purple');
  const theme = THEMES[selectedTheme];

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

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen" style={{
      fontFamily: '"Poppins", "Montserrat", sans-serif'
    }}>
      {/* Header with Theme Selector */}
      <header className="backdrop-blur-sm sticky top-0 z-50" style={{ 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: `url('/patterns/iso-cube.svg'), ${theme.primary}`,
        backgroundSize: '90px 90px, cover',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-9 h-9" style={{ color: HIGHLIGHT }} />
            <h1 className="text-3xl font-bold" style={{ color: '#fff', letterSpacing: '-0.02em' }}>AssetVault</h1>
          </div>
          
          {/* Theme Selector */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full" style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)' }}>
            <span className="text-white text-sm mr-2">Theme:</span>
            {Object.keys(THEMES).map(themeKey => (
              <button
                key={themeKey}
                onClick={() => setSelectedTheme(themeKey)}
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  background: THEMES[themeKey].primary,
                  border: selectedTheme === themeKey ? '3px solid #FFC300' : '2px solid rgba(255,255,255,0.3)',
                  transform: selectedTheme === themeKey ? 'scale(1.1)' : 'scale(1)'
                }}
                title={THEMES[themeKey].name}
              />
            ))}
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#why" 
              onClick={(e) => { e.preventDefault(); scrollToSection('why'); }}
              className="text-white font-medium hover:text-yellow-300 transition-colors" 
              style={{ letterSpacing: '0.02em', fontSize: '1rem' }}
            >
              Why AssetVault
            </a>
            <a 
              href="#features" 
              onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
              className="text-white font-medium hover:text-yellow-300 transition-colors" 
              style={{ letterSpacing: '0.02em', fontSize: '1rem' }}
            >
              Features
            </a>
            <a 
              href="#security" 
              onClick={(e) => { e.preventDefault(); scrollToSection('security'); }}
              className="text-white font-medium hover:text-yellow-300 transition-colors" 
              style={{ letterSpacing: '0.02em', fontSize: '1rem' }}
            >
              Security
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}
              className="text-white font-medium hover:text-yellow-300 transition-colors" 
              style={{ letterSpacing: '0.02em', fontSize: '1rem' }}
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}
              className="text-white font-medium hover:text-yellow-300 transition-colors" 
              style={{ letterSpacing: '0.02em', fontSize: '1rem' }}
            >
              FAQ
            </a>
          </nav>

          <Button 
            onClick={handleLogin}
            className="font-semibold px-8 py-6 text-base"
            style={{
              background: HIGHLIGHT,
              color: '#000',
              borderRadius: '50px',
              border: 'none',
              letterSpacing: '0.02em',
              boxShadow: `0 4px 20px rgba(255, 195, 0, 0.3)`,
              minWidth: '140px'
            }}
          >
            Get Started Free
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 md:py-32" style={{
        background: `url('/patterns/iso-cube.svg'), ${theme.primary}`,
        backgroundSize: '90px 90px, cover',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <Zap className="w-4 h-4" style={{ color: HIGHLIGHT }} />
              <span className="text-white text-sm font-medium" style={{ letterSpacing: '0.03em' }}>Protect Your Legacy Today</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight" style={{ 
              color: '#fff',
              letterSpacing: '-0.03em'
            }}>
              Life is Uncertain.<br
              <span style={{ color: HIGHLIGHT }}>Your Legacy Doesn't Have to Be</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto" style={{ 
              color: 'rgba(255,255,255,0.9)',
              lineHeight: '1.6',
              letterSpacing: '0.01em'
            }}>
              The only platform that ensures your financial assets are never lost to your family. 
              Track everything, secure your legacy, protect what matters.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={handleLogin}
                className="font-bold px-10 py-7 text-lg"
                style={{
                  background: HIGHLIGHT,
                  color: '#000',
                  borderRadius: '50px',
                  border: 'none',
                  letterSpacing: '0.02em',
                  boxShadow: '0 8px 30px rgba(255, 195, 0, 0.4)',
                  minWidth: '200px'
                }}
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <Button 
                variant="outline"
                className="font-semibold px-8 py-7 text-lg"
                style={{
                  background: 'transparent',
                  color: '#fff',
                  borderRadius: '50px',
                  border: '2px solid #FFC300',
                  letterSpacing: '0.02em',
                  minWidth: '180px'
                }}
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-white flex-wrap">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: HIGHLIGHT }}>5K+</div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>Active Users</div>
              </div>
              <div className="h-12 w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: HIGHLIGHT }}>₹50Cr+</div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>Assets Protected</div>
              </div>
              <div className="h-12 w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: HIGHLIGHT }}>99.9%</div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Uncomfortable Truth */}
      <section id="why" className="py-20" style={{ 
        background: `url('/patterns/iso-cube.svg'), ${theme.secondary}`,
        backgroundSize: '80px 80px, cover',
        backgroundBlendMode: 'overlay',
        boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: HIGHLIGHT }} />
              <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                The Uncomfortable Truth
              </h2>
              <p className="text-xl" style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.01em' }}>
                Financial institutions aggressively track what you OWE them. 
                But who's tracking what THEY owe YOU?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* What Banks Chase - White Card */}
              <div className="p-8 rounded-3xl" style={{ 
                background: '#FFFFFF',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                <div className="text-5xl mb-4">🚨</div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: '#222' }}>What Banks WILL Chase You For:</h3>
                <ul className="space-y-3">
                  {[
                    'Home Loans - Every EMI tracked',
                    'Credit Card Bills - Instant alerts',
                    'Car Loans - Automated reminders',
                    'Personal Loans - Collections teams ready',
                    'Late Payment Fees - They never forget'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: '#ef4444' }} />
                      <span style={{ color: '#444' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What Banks Hide - Yellow Card */}
              <div className="p-8 rounded-3xl" style={{ 
                background: HIGHLIGHT,
                boxShadow: '0 8px 32px rgba(255, 195, 0, 0.3)'
              }}>
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: '#000' }}>What Banks WON'T Tell Your Family:</h3>
                <ul className="space-y-3">
                  {[
                    'Life Insurance Policies - Hidden away',
                    'Fixed Deposits - Scattered across banks',
                    'Mutual Fund Investments - No central record',
                    'PPF/NPS Accounts - Lost to time',
                    'Bank Lockers - Family unaware',
                    'Crypto Wallets - Gone forever'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Lock className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: '#000' }} />
                      <span style={{ color: '#000', fontWeight: 500 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-8 rounded-3xl text-center" style={{ 
              background: 'rgba(255,255,255,0.15)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Heart className="w-12 h-12 mx-auto mb-4" style={{ color: HIGHLIGHT }} />
              <h3 className="text-2xl font-bold mb-3" style={{ color: '#fff' }}>Don't Let Your Legacy Disappear</h3>
              <p className="text-lg max-w-3xl mx-auto" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.7' }}>
                In India, over ₹35,000 Crores in unclaimed assets sit with banks and insurance companies. 
                Why? Because families didn't know these assets existed. 
                <strong style={{ color: HIGHLIGHT }}> AssetVault ensures this never happens to you.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20" style={{
        background: `url('/patterns/iso-cube.svg'), ${theme.accent}`,
        backgroundSize: '70px 70px, cover',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
              Everything You Need to Protect Your Legacy
            </h2>
            <p className="text-xl" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Comprehensive tools designed for Indian families
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <ShieldCheck className="w-12 h-12" />,
                title: 'Complete Asset Tracking',
                description: 'Track ALL your assets - bank accounts, FDs, insurance, mutual funds, stocks, crypto, gold, property, and portfolio holdings.'
              },
              {
                icon: <Users className="w-12 h-12" />,
                title: 'Multiple Nominees',
                description: 'Add unlimited nominees with priority ordering. Primary unavailable? System automatically contacts your backup nominees.'
              },
              {
                icon: <Clock className="w-12 h-12" />,
                title: "Dead Man's Switch",
                description: 'Automatic notifications to your family if you become inactive. Configurable reminders before nominee notification.'
              },
              {
                icon: <TrendingUp className="w-12 h-12" />,
                title: 'Real-Time Net Worth',
                description: 'Live dashboard showing your complete financial picture. Historical snapshots track your wealth growth.'
              },
              {
                icon: <FileText className="w-12 h-12" />,
                title: 'Secure Document Vault',
                description: 'Store policy documents, certificates, and statements. Link them to specific assets for easy access.'
              },
              {
                icon: <Database className="w-12 h-12" />,
                title: 'Portfolio Management',
                description: 'Track holdings across exchanges and brokers. Real-time portfolio values with gain/loss tracking.'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-8 rounded-3xl transition-all hover:scale-105"
                style={{
                  background: '#FFFFFF',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <div className="mb-4" style={{ color: '#222' }}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: '#222' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#444', lineHeight: '1.7' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security USP Section */}
      <section id="security" className="py-20" style={{ 
        background: `url('/patterns/iso-cube.svg'), ${theme.light}`,
        backgroundSize: '60px 60px, cover',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: '#222' }} />
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#222', letterSpacing: '-0.02em' }}>
                Bank-Grade Security You Can Trust
              </h2>
              <p className="text-xl" style={{ color: '#444' }}>
                Your data security is our top priority
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: '256-Bit Encryption',
                  description: 'Military-grade encryption protects your data at rest and in transit. Same technology used by major banks.',
                  icon: '🔐'
                },
                {
                  title: 'ISO 27001 Certified',
                  description: 'Internationally recognized security management standards. Regular third-party audits ensure compliance.',
                  icon: '✅'
                },
                {
                  title: 'Indian Data Protection',
                  description: 'Full compliance with Indian data protection laws. Your data stays in India on secure servers.',
                  icon: '🇮🇳'
                },
                {
                  title: 'Zero-Knowledge Architecture',
                  description: 'We cannot access your data. Only you and your authorized nominees can view your information.',
                  icon: '🛡️'
                },
                {
                  title: 'Regular Security Audits',
                  description: 'Quarterly penetration testing by certified security experts. Continuous monitoring for threats.',
                  icon: '🔍'
                },
                {
                  title: '99.9% Uptime SLA',
                  description: 'Enterprise-grade infrastructure with automatic backups. Your data is always accessible when needed.',
                  icon: '⚡'
                }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-2xl"
                  style={{ 
                    background: '#FFFFFF',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#222' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#444', lineHeight: '1.7' }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 rounded-3xl text-center" style={{ 
              background: '#FFFFFF',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '2px solid ' + HIGHLIGHT
            }}>
              <h3 className="text-2xl font-bold mb-3" style={{ color: '#222' }}>Trusted by 5000+ Indian Families</h3>
              <p className="text-lg" style={{ color: '#444' }}>
                Join thousands who trust AssetVault with their most important financial information. 
                Rated <strong style={{ color: HIGHLIGHT }}>4.8/5 stars</strong> for security and reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20" style={{
        background: theme.neutral
      }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#222', letterSpacing: '-0.02em' }}>
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl" style={{ color: '#444' }}>
              Choose the plan that's right for your family
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                description: 'Perfect for getting started',
                features: [
                  'Up to 10 assets',
                  '1 nominee',
                  'Basic dashboard',
                  'Net worth tracking',
                  '100 MB document storage',
                  'Email support'
                ],
                highlight: false,
                cta: 'Start Free'
              },
              {
                name: 'Pro',
                price: '$9.99',
                period: 'per month',
                description: 'Most popular for families',
                features: [
                  'Unlimited assets',
                  'Up to 3 nominees',
                  'Priority ordering',
                  'Advanced analytics',
                  'Portfolio tracking',
                  '5 GB storage',
                  'AI-powered insights',
                  'Priority email support'
                ],
                highlight: true,
                cta: 'Start Pro Trial'
              },
              {
                name: 'Family',
                price: '$24.99',
                period: 'per month',
                description: 'Complete family protection',
                features: [
                  'Everything in Pro',
                  'Unlimited nominees',
                  'Family sharing (5 members)',
                  'Multi-user access',
                  '20 GB storage',
                  '24/7 phone support',
                  'Dedicated account manager',
                  'Legal document templates'
                ],
                highlight: false,
                cta: 'Start Family Trial'
              }
            ].map((plan, index) => (
              <div 
                key={index}
                className="p-8 rounded-3xl"
                style={{
                  background: plan.highlight ? HIGHLIGHT : '#FFFFFF',
                  boxShadow: plan.highlight ? '0 12px 40px rgba(255, 195, 0, 0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
                  transform: plan.highlight ? 'scale(1.05)' : 'scale(1)',
                  border: plan.highlight ? 'none' : '1px solid rgba(0,0,0,0.08)'
                }}
              >
                {plan.highlight && (
                  <div className="text-center mb-4">
                    <span className="inline-block px-4 py-1 rounded-full text-sm font-bold" style={{ background: '#000', color: HIGHLIGHT }}>
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2" style={{ color: plan.highlight ? '#000' : '#222' }}>
                  {plan.name}
                </h3>
                <p className="text-sm mb-4" style={{ color: plan.highlight ? '#000' : '#666', opacity: plan.highlight ? 1 : 0.8 }}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-5xl font-bold" style={{ color: plan.highlight ? '#000' : '#222' }}>
                    {plan.price}
                  </span>
                  <span className="text-lg" style={{ color: plan.highlight ? '#000' : '#666' }}>
                    /{plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: plan.highlight ? '#000' : '#222' }} />
                      <span style={{ color: plan.highlight ? '#000' : '#444' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={handleLogin}
                  className="w-full font-bold py-6 text-base"
                  style={{
                    background: plan.highlight ? '#000' : HIGHLIGHT,
                    color: plan.highlight ? HIGHLIGHT : '#000',
                    borderRadius: '50px',
                    border: 'none',
                    minWidth: '100%'
                  }}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p style={{ color: '#666' }}>All plans include 30-day money-back guarantee • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20" style={{ 
        background: `url('/patterns/iso-cube.svg'), ${theme.accent}`,
        backgroundSize: '70px 70px, cover',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  q: 'Is my data secure?',
                  a: 'Yes! We use bank-level 256-bit encryption and comply with all Indian data protection regulations. Your data is stored securely and never shared with third parties.'
                },
                {
                  q: 'What happens if I become inactive?',
                  a: 'Our Dead Man\'s Switch will send you reminders before notifying your nominees. You have full control over the timing and can reset it anytime by logging in.'
                },
                {
                  q: 'Can I add assets from any country?',
                  a: 'Yes! AssetVault supports multi-currency tracking for assets worldwide, with special focus on Indian assets and regulations.'
                },
                {
                  q: 'How do my nominees access the information?',
                  a: 'Nominees receive secure, encrypted links when triggered. They can view your asset information but cannot modify or delete anything without proper verification.'
                },
                {
                  q: 'Can I try before committing?',
                  a: 'Absolutely! Our Free plan lets you track up to 10 assets with 1 nominee forever. No credit card required to start.'
                },
                {
                  q: 'What about portfolio holdings?',
                  a: 'Pro and Family plans include unlimited portfolio tracking across exchanges like Binance, Zerodha, and others. Track individual holdings with real-time values.'
                }
              ].map((faq, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-2xl"
                  style={{ 
                    background: '#FFFFFF',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.5)'
                  }}
                >
                  <h3 className="text-xl font-bold mb-3" style={{ color: HIGHLIGHT }}>
                    {faq.q}
                  </h3>
                  <p style={{ color: '#444', lineHeight: '1.7' }}>
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24" style={{
        background: `url('/patterns/iso-cube.svg'), ${theme.primary}`,
        backgroundSize: '90px 90px, cover',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
              Start Protecting Your Legacy Today
            </h2>
            <p className="text-xl mb-10" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Join thousands of families who have secured their financial future with AssetVault
            </p>
            <Button 
              onClick={handleLogin}
              className="font-bold px-12 py-8 text-xl"
              style={{
                background: HIGHLIGHT,
                color: '#000',
                borderRadius: '50px',
                border: 'none',
                letterSpacing: '0.02em',
                boxShadow: '0 10px 40px rgba(255, 195, 0, 0.4)',
                minWidth: '280px'
              }}
            >
              Get Started - It's Free
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ 
        background: `url('/patterns/iso-cube.svg'), ${theme.footer}`,
        backgroundSize: '90px 90px',
        backgroundBlendMode: 'overlay',
        borderTop: `1px solid rgba(255,255,255,0.1)`
      }}>
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-7 h-7" style={{ color: HIGHLIGHT }} />
                <h3 className="text-xl font-bold" style={{ color: '#fff' }}>AssetVault</h3>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Protecting your legacy,<br />securing your family's future.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4" style={{ color: '#fff' }}>Product</h4>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="#features" 
                    onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
                    className="hover:text-yellow-300 transition-colors" 
                    style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a 
                    href="#security" 
                    onClick={(e) => { e.preventDefault(); scrollToSection('security'); }}
                    className="hover:text-yellow-300 transition-colors" 
                    style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a 
                    href="#pricing" 
                    onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}
                    className="hover:text-yellow-300 transition-colors" 
                    style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a 
                    href="#faq" 
                    onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}
                    className="hover:text-yellow-300 transition-colors" 
                    style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4" style={{ color: '#fff' }}>Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-yellow-300 transition-colors" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Privacy Policy</a></li>
                <li><a href="#" className="hover:text-yellow-300 transition-colors" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Terms of Service</a></li>
                <li><a href="#" className="hover:text-yellow-300 transition-colors" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4" style={{ color: '#fff' }}>Connect</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-yellow-300 transition-colors" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Support</a></li>
                <li><a href="#" className="hover:text-yellow-300 transition-colors" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Contact Us</a></li>
                <li><a href="#" className="hover:text-yellow-300 transition-colors" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Blog</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8" style={{ borderTop: `1px solid rgba(255,255,255,0.1)` }}>
            <p className="text-center" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              © 2025 AssetVault. All rights reserved. Made by shiv with ❤️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
