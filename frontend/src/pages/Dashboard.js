import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap, ScatterChart, Scatter, ZAxis } from 'recharts';
import { DollarSign, TrendingUp, Shield, AlertCircle, Plus, Sparkles, BookOpen, TrendingDown, Clock, Eye, HeartPulse } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currencyConversion';
import NetWorthChart from '@/components/NetWorthChart';
import ChartTypeSwitcher from '@/components/ChartTypeSwitcher';
import FlexibleChart from '@/components/FlexibleChart';
import AssetTreeMap from '@/components/AssetTreeMap';
import LoanBubbleChart from '@/components/LoanBubbleChart';
import '@/styles/modernTheme.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ASSET_COLORS = {
  // Assets - Green/Blue positive tones
  bank: '#10b981',
  insurance: '#3b82f6',
  investment: '#8b5cf6',
  crypto: '#f59e0b',
  gold: '#fbbf24',
  precious_metals: '#fbbf24',
  diamond: '#ec4899',
  locker: '#6366f1',
  property: '#14b8a6',
  stock: '#06b6d4',
  portfolio: '#a855f7', // Purple for portfolio accounts
  // Liabilities - Red negative tones
  loan: '#dc2626',
  credit_card: '#ef4444'
};

// CustomTooltip will be created inside the component to access selectedCurrency and currencyFormat

export default function Dashboard() {
  const navigate = useNavigate();
  const { selectedCurrency, currencyFormat } = useApp();
  const { theme } = useTheme();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [comparisonChartType, setComparisonChartType] = useState(() => {
    return sessionStorage.getItem('comparisonChartType') || 'pie';
  });
  const [assetDistChartType, setAssetDistChartType] = useState(() => {
    return sessionStorage.getItem('assetDistChartType') || 'treemap';
  });
  const [liabilityDistChartType, setLiabilityDistChartType] = useState(() => {
    return sessionStorage.getItem('liabilityDistChartType') || 'pie';
  });
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAllLiabilities, setShowAllLiabilities] = useState(false);
  const [loanDetails, setLoanDetails] = useState([]);

  const handleComparisonChartChange = (type) => {
    setComparisonChartType(type);
    sessionStorage.setItem('comparisonChartType', type);
  };

  const handleAssetDistChartChange = (type) => {
    setAssetDistChartType(type);
    sessionStorage.setItem('assetDistChartType', type);
  };

  const handleLiabilityDistChartChange = (type) => {
    setLiabilityDistChartType(type);
    sessionStorage.setItem('liabilityDistChartType', type);
  };

  useEffect(() => {
    fetchSummary();
    fetchLoanDetails();
    checkDemoMode();
  }, [selectedCurrency]); // Refetch when currency changes

  const checkDemoMode = async () => {
    try {
      const response = await axios.get(`${API}/demo/status`, { withCredentials: true });
      setDemoMode(response.data.demo_mode);
    } catch (error) {
      console.error('Failed to fetch demo status:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/summary`, { 
        params: { target_currency: selectedCurrency },
        withCredentials: true 
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanDetails = async () => {
    try {
      const response = await axios.get(`${API}/assets`, { withCredentials: true });
      // Filter only loans and credit cards, extract relevant data
      const loans = response.data
        .filter(asset => asset.type === 'loan' || asset.type === 'credit_card')
        .map((loan, index) => ({
          name: loan.name,
          amount: Math.abs(loan.current_value || loan.total_value || 0),
          rate: loan.details?.interest_rate || loan.interest_rate || 5,
          term: loan.details?.tenure_months ? `${loan.details.tenure_months} months` : null,
          color: loan.type === 'credit_card' ? '#ef4444' : (index % 2 === 0 ? '#f59e0b' : '#f97316'),
          type: loan.type,
        }));
      setLoanDetails(loans);
      
      // Calculate percentages for table display
      const totalLiabilities = loans.reduce((sum, loan) => sum + loan.amount, 0);
      const loansWithPercentage = loans.map(loan => ({
        ...loan,
        percentage: totalLiabilities > 0 ? ((loan.amount / totalLiabilities) * 100).toFixed(1) : 0,
      }));
      setLoanDetails(loansWithPercentage);
    } catch (error) {
      console.error('Failed to fetch loan details:', error);
    }
  };

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '12px', boxShadow: theme.cardShadow }}>
          <p style={{ color: theme.text, fontWeight: 600, marginBottom: '4px' }}>{label || payload[0].name}</p>
          <p style={{ color: theme.primary, fontSize: '14px' }}>
            {payload[0].name === 'percentage' ? `${payload[0].value}%` : formatCurrency(payload[0].value, selectedCurrency, currencyFormat)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Asset Distribution (only assets, no liabilities)
  const assetDistributionData = summary?.asset_values_separate ? Object.entries(summary.asset_values_separate).map(([key, value]) => {
    const totalAssets = summary.total_assets_value || 1;
    return {
      name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
      value: Math.abs(value),
      color: ASSET_COLORS[key] || '#64748b',
      percentage: ((Math.abs(value) / totalAssets) * 100).toFixed(1)
    };
  }).filter(item => item.value > 0) : [];

  // Liability Distribution (only liabilities)
  const liabilityDistributionData = summary?.liability_values_separate ? Object.entries(summary.liability_values_separate).map(([key, value]) => {
    const totalLiabilities = summary.total_liabilities_value || 1;
    return {
      name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
      value: Math.abs(value),
      color: ASSET_COLORS[key] || '#ef4444',
      percentage: ((Math.abs(value) / totalLiabilities) * 100).toFixed(1)
    };
  }).filter(item => item.value > 0) : [];

  // Assets vs Liabilities Comparison
  const comparisonData = [
    {
      name: 'Assets',
      value: summary?.total_assets_value || 0,
      color: '#10b981', // Green for positive
      percentage: (() => {
        const total = (summary?.total_assets_value || 0) + (summary?.total_liabilities_value || 0);
        return total > 0 ? (((summary?.total_assets_value || 0) / total) * 100).toFixed(1) : 0;
      })()
    },
    {
      name: 'Liabilities',
      value: summary?.total_liabilities_value || 0,
      color: '#dc2626', // Dark red for negative
      percentage: (() => {
        const total = (summary?.total_assets_value || 0) + (summary?.total_liabilities_value || 0);
        return total > 0 ? (((summary?.total_liabilities_value || 0) / total) * 100).toFixed(1) : 0;
      })()
    }
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-400 text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  const netWorthValue = summary?.net_worth || 0;
  const isPositive = netWorthValue >= 0;
  
  return (
    <Layout>
      <div className="space-y-8" data-testid="dashboard-container" style={{padding: '2rem 0'}}>
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: theme.text}} data-testid="dashboard-title">
            Financial Dashboard
          </h1>
          <p style={{color: theme.textTertiary}}>
            Overview of your assets and financial health
          </p>
        </div>

        {/* Demo Mode Banner */}
        {demoMode && (
          <Card 
            className="border-l-4 mb-6"
            style={{
              background: theme.cardBg,
              borderColor: theme.warning,
              borderLeftWidth: '4px',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center animate-pulse"
                    style={{background: 'rgba(245, 158, 11, 0.2)'}}
                  >
                    <svg className="w-8 h-8" style={{color: theme.warning}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold mb-1" style={{color: theme.warning}}>
                      🧪 You're in DEMO MODE
                    </div>
                    <p className="text-sm" style={{color: theme.textSecondary}}>
                      All data shown is test data. <strong>Explore features risk-free!</strong> Switch to Live Mode to enter your real assets.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        // Set a demo token for preview
                        localStorage.setItem('nominee_access_token', `nom_demo_preview_${Date.now()}`);
                        localStorage.setItem('nominee_info', JSON.stringify({
                          nominee: { name: 'You (Preview)', relationship: 'Demo Preview' },
                          owner: { name: 'Your Demo Account', email: 'demo@example.com' }
                        }));
                        navigate('/nominee-dashboard');
                      }}
                      style={{background: `rgba(168, 85, 247, ${theme.name === 'dark' ? '0.2' : '0.1'})`, border: `1px solid ${theme.primary}`, color: theme.primary}}
                    >
                      <Eye className="w-3 h-3 mr-2" />
                      Preview Nominee View
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold" style={{background: theme.warning, color: '#fff'}}>
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      DEMO
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Requirements Banner for New Users */}
        {(!summary?.has_nominee || !summary?.has_dms) && (
          <Card 
            className="border-l-4"
            style={{
              background: theme.cardBg,
              borderColor: theme.error,
              borderLeftWidth: '4px',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3" style={{color: theme.error}}>
                <AlertCircle className="w-6 h-6" />
                <span>Complete Your Profile Setup</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4" style={{color: theme.textSecondary, fontSize: '0.9375rem'}}>
                Secure your legacy by completing these essential steps. Your loved ones will thank you.
              </p>
              
              <div className="space-y-3">
                {!summary?.has_nominee && (
                  <div 
                    className="flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-md cursor-pointer"
                    style={{
                      background: theme.backgroundSecondary,
                      border: '1px solid',
                      borderColor: theme.border
                    }}
                    onClick={() => navigate('/settings?tab=nominees')}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{background: 'rgba(239, 68, 68, 0.1)'}}
                      >
                        <Shield className="w-5 h-5" style={{color: theme.error}} />
                      </div>
                      <div>
                        <div className="font-semibold" style={{color: theme.text}}>
                          Add a Nominee
                        </div>
                        <div className="text-sm" style={{color: theme.textSecondary}}>
                          Designate someone to inherit your assets
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      style={{background: theme.error, color: '#fff'}}
                    >
                      Set Up Now →
                    </Button>
                  </div>
                )}

                {!summary?.has_dms && (
                  <div 
                    className="flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-md cursor-pointer"
                    style={{
                      background: theme.backgroundSecondary,
                      border: '1px solid',
                      borderColor: theme.border
                    }}
                    onClick={() => navigate('/settings?tab=dms')}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{background: 'rgba(239, 68, 68, 0.1)'}}
                      >
                        <Clock className="w-5 h-5" style={{color: theme.error}} />
                      </div>
                      <div>
                        <div className="font-semibold" style={{color: theme.text}}>
                          Enable Dead Man's Switch
                        </div>
                        <div className="text-sm" style={{color: theme.textSecondary}}>
                          Automatic notifications if you're inactive
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      style={{background: theme.error, color: '#fff'}}
                    >
                      Set Up Now →
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 rounded-lg" style={{background: `rgba(239, 68, 68, ${theme.name === 'dark' ? '0.1' : '0.05'})`}}>
                <p className="text-xs" style={{color: theme.textSecondary}}>
                  💡 <strong>Why this matters:</strong> Without these safeguards, your assets could be lost forever to your family. 
                  Complete setup takes less than 5 minutes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Standard Layout - 4-column grid with DMS card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              data-testid="total-assets-card" 
              className="overflow-hidden transition-all hover:shadow-lg card"
              style={{background: theme.cardBg, borderColor: theme.info, boxShadow: theme.cardShadow}}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2" style={{color: theme.textTertiary, letterSpacing: '0.5px'}}>TOTAL ASSETS</p>
                    <div className="text-4xl font-bold mb-1" style={{color: theme.text, fontFamily: 'Inter, sans-serif'}} data-testid="total-assets-count">
                      {summary?.total_assets || 0}
                    </div>
                    <p className="text-xs" style={{color: theme.textMuted}}>items tracked</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
                    <DollarSign className="w-8 h-8" style={{color: theme.info}} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              data-testid="net-worth-card" 
              className="overflow-hidden transition-all hover:shadow-lg card"
              style={{
                background: theme.cardBg, 
                borderColor: isPositive ? theme.success : theme.error, 
                borderWidth: '2px',
                boxShadow: theme.cardShadow
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2" style={{color: theme.textTertiary, letterSpacing: '0.5px'}}>NET WORTH</p>
                    <div 
                      className="text-3xl font-bold mb-1"
                      style={{color: isPositive ? theme.success : theme.error, fontFamily: 'Inter, sans-serif'}} 
                      data-testid="net-worth-value"
                    >
                      {formatCurrency(netWorthValue, selectedCurrency, currencyFormat)}
                    </div>
                    <p className="text-xs" style={{color: theme.textMuted}}>
                      {selectedCurrency} equivalent
                    </p>
                  </div>
                  <div className="p-3 rounded-xl" style={{background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}}>
                    {isPositive ? (
                      <TrendingUp className="w-8 h-8" style={{color: theme.success}} />
                    ) : (
                      <TrendingDown className="w-8 h-8" style={{color: theme.error}} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              data-testid="nominee-status-card" 
              className="overflow-hidden transition-all hover:shadow-lg card"
              style={{background: theme.cardBg, borderColor: summary?.has_nominee ? theme.success : theme.warning, boxShadow: theme.cardShadow}}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2" style={{color: theme.textTertiary, letterSpacing: '0.5px'}}>NOMINEE</p>
                    <div className="text-2xl font-bold mb-1" style={{color: summary?.has_nominee ? theme.success : theme.warning, fontFamily: 'Inter, sans-serif'}} data-testid="nominee-status">
                      {summary?.has_nominee ? '✓ Configured' : 'Not Set'}
                    </div>
                    <p className="text-xs" style={{color: theme.textMuted}}>
                      {summary?.has_nominee ? 'Protection active' : 'Setup required'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl" style={{background: summary?.has_nominee ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}}>
                    <Shield className="w-8 h-8" style={{color: summary?.has_nominee ? theme.success : theme.warning}} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              data-testid="dms-status-card" 
              className="overflow-hidden transition-all hover:shadow-lg card"
              style={{background: theme.cardBg, borderColor: summary?.has_dms ? theme.success : theme.warning, boxShadow: theme.cardShadow}}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2" style={{color: theme.textTertiary, letterSpacing: '0.5px'}}>DEAD MAN'S SWITCH</p>
                    <div className="text-2xl font-bold mb-1" style={{color: summary?.has_dms ? theme.success : theme.warning, fontFamily: 'Inter, sans-serif'}} data-testid="dms-status">
                      {summary?.has_dms ? '✓ Active' : 'Not Set'}
                    </div>
                    <p className="text-xs" style={{color: theme.textMuted}}>
                      {summary?.has_dms ? 'Monitoring enabled' : 'Setup required'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl" style={{background: summary?.has_dms ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}}>
                    <HeartPulse className="w-8 h-8" style={{color: summary?.has_dms ? theme.success : theme.warning}} />
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Financial Ratios */}
        {summary?.financial_ratios && (() => {
          // Collect all ratios with their status
          const ratios = [
            { key: 'debt_to_asset_ratio', data: summary.financial_ratios.debt_to_asset_ratio, label: 'DEBT-TO-ASSET RATIO' },
            { key: 'liquidity_ratio', data: summary.financial_ratios.liquidity_ratio, label: 'LIQUIDITY RATIO' },
            { key: 'net_worth_growth', data: summary.financial_ratios.net_worth_growth, label: 'NET WORTH GROWTH' },
            { key: 'diversification_score', data: summary.financial_ratios.diversification_score, label: 'DIVERSIFICATION' },
            { key: 'emergency_fund_ratio', data: summary.financial_ratios.emergency_fund_ratio, label: 'EMERGENCY FUND' },
            { key: 'debt_service_coverage', data: summary.financial_ratios.debt_service_coverage, label: 'DEBT COVERAGE' }
          ];

          // Sort ratios: good (left), warning/caution (middle), bad/alert (right)
          const statusOrder = { 'good': 1, 'warning': 2, 'neutral': 2, 'bad': 3, 'alert': 3 };
          const sortedRatios = ratios.sort((a, b) => {
            const orderA = statusOrder[a.data?.status] || 2;
            const orderB = statusOrder[b.data?.status] || 2;
            return orderA - orderB;
          });

          return (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold" style={{color: theme.text, fontFamily: 'Space Grotesk, sans-serif'}}>
                  Financial Health Indicators
                </h2>
                {/* Legend */}
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{background: '#10b981'}}></div>
                    <span style={{color: theme.textTertiary}}>Healthy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{background: '#f59e0b'}}></div>
                    <span style={{color: theme.textTertiary}}>Caution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{background: '#ef4444'}}></div>
                    <span style={{color: theme.textTertiary}}>Alert</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">{sortedRatios.map((ratio) => {
                const status = ratio.data?.status;
                const borderColor = status === 'good' ? '#10b981' : 
                                   status === 'warning' || status === 'neutral' ? '#f59e0b' : '#ef4444';
                const textColor = status === 'good' ? '#10b981' : 
                                 status === 'warning' || status === 'neutral' ? '#f59e0b' : '#ef4444';
                
                // Get interpretation text based on ratio type
                const getInterpretation = () => {
                  switch(ratio.key) {
                    case 'debt_to_asset_ratio':
                      return ratio.data?.value < 30 ? '✓ Healthy level' : 
                             ratio.data?.value < 50 ? '⚠ Monitor closely' : '⚠ High debt burden';
                    case 'liquidity_ratio':
                      return ratio.data?.value >= 1.5 ? '✓ Strong liquidity' : 
                             ratio.data?.value >= 1.0 ? '⚠ Adequate liquidity' : '⚠ Low liquidity';
                    case 'net_worth_growth':
                      return ratio.data?.value > 0 ? '✓ Positive growth' : 
                             ratio.data?.display === 'N/A' ? 'ℹ Need more snapshots' : '⚠ Declining';
                    case 'diversification_score':
                      return ratio.data?.value >= 60 ? '✓ Well diversified' : 
                             ratio.data?.value >= 30 ? '⚠ Add more variety' : '⚠ High concentration risk';
                    case 'emergency_fund_ratio':
                      return ratio.data?.value >= 3 ? '✓ Safe coverage' : 
                             ratio.data?.value >= 1 ? '⚠ Build reserves' : '⚠ Critical shortage';
                    case 'debt_service_coverage':
                      return ratio.data?.display === 'N/A' ? 'ℹ No debt obligations' :
                             ratio.data?.value >= 1.5 ? '✓ Strong coverage' : 
                             ratio.data?.value >= 1.0 ? '⚠ Adequate coverage' : '⚠ Payment stress';
                    default:
                      return '';
                  }
                };

                return (
                  <Card 
                    key={ratio.key}
                    className="overflow-hidden transition-all hover:shadow-lg"
                    style={{
                      background: theme.cardBg, 
                      borderColor: borderColor,
                      boxShadow: theme.cardShadow
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold" style={{color: theme.textTertiary}}>{ratio.label}</h3>
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{background: borderColor}}
                        />
                      </div>
                      <div 
                        className="text-2xl font-bold mb-1"
                        style={{color: textColor}}
                      >
                        {ratio.data?.display}
                      </div>
                      <p className="text-xs leading-tight mb-1" style={{color: theme.textMuted}}>
                        {ratio.data?.description}
                      </p>
                      <p className="text-xs" style={{color: theme.textTertiary, fontStyle: 'italic'}}>
                        {getInterpretation()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}</div>
            </div>
          );
        })()}

        {/* Alerts */}
        {(!summary?.has_nominee || !summary?.has_dms) && (
          <Card data-testid="setup-alert" style={{background: `rgba(251, 191, 36, ${theme.name === 'dark' ? '0.1' : '0.05'})`, borderColor: `rgba(251, 191, 36, ${theme.name === 'dark' ? '0.3' : '0.2'})`, boxShadow: theme.cardShadow}}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{color: theme.warning}} />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2" style={{color: theme.warning}}>Setup Required</h3>
                  <p className="mb-4" style={{color: theme.textSecondary}}>
                    {!summary?.has_nominee && 'Please add a nominee to ensure your assets reach the right person. '}
                    {!summary?.has_dms && 'Configure the dead man switch for automated protection.'}
                  </p>
                  <Button 
                    data-testid="complete-setup-btn"
                    onClick={() => navigate('/settings')} 
                    className="text-white rounded-full"
                    style={{background: theme.warning}}
                  >
                    Complete Setup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts with Data Tables */}
        <div className="space-y-6">
          {/* Assets vs Liabilities Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="comparison-card" style={{background: theme.backgroundSecondary, borderColor: theme.border, boxShadow: theme.cardShadow}}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle style={{color: theme.text}}>Assets vs Liabilities</CardTitle>
                    <p className="text-sm mt-1" style={{color: theme.textTertiary}}>Financial position overview</p>
                  </div>
                  {comparisonData.length > 0 && (
                    <ChartTypeSwitcher 
                      currentType={comparisonChartType} 
                      onChange={handleComparisonChartChange}
                      availableTypes={['pie', 'donut', 'bar']}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {comparisonData.length > 0 ? (
                  <FlexibleChart
                    data={comparisonData}
                    chartType={comparisonChartType}
                    colors={[]}
                    CustomTooltip={CustomTooltip}
                    labelFormatter={({ name, percentage }) => `${name} ${percentage}%`}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center" style={{color: theme.textTertiary}}>
                    <div className="text-center">
                      <p className="mb-4">No data available</p>
                      <Button 
                        data-testid="add-first-asset-btn"
                        onClick={() => navigate('/assets')} 
                        className="text-white rounded-full"
                        style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Asset
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparison Data Table */}
            <Card style={{background: theme.backgroundSecondary, borderColor: theme.border, boxShadow: theme.cardShadow}}>
              <CardHeader>
                <CardTitle style={{color: theme.text}}>Financial Breakdown</CardTitle>
                <p className="text-sm mt-1" style={{color: theme.textTertiary}}>Detailed values and percentages</p>
              </CardHeader>
              <CardContent>
                {comparisonData.length > 0 ? (
                  <div className="space-y-4">
                    <table className="w-full">
                      <thead>
                        <tr style={{borderBottom: `2px solid ${theme.border}`}}>
                          <th className="text-left py-3 px-2" style={{color: theme.textTertiary, fontSize: '12px', fontWeight: 600}}>CATEGORY</th>
                          <th className="text-right py-3 px-2" style={{color: theme.textTertiary, fontSize: '12px', fontWeight: 600}}>VALUE</th>
                          <th className="text-right py-3 px-2" style={{color: theme.textTertiary, fontSize: '12px', fontWeight: 600}}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.map((item, index) => (
                          <tr key={index} style={{borderBottom: `1px solid ${theme.border}`}}>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{background: item.color}}
                                />
                                <span style={{color: theme.text, fontWeight: 500}}>{item.name}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-2" style={{color: theme.textSecondary, fontWeight: 600}}>
                              {formatCurrency(item.value, selectedCurrency, currencyFormat)}
                            </td>
                            <td className="text-right py-3 px-2" style={{color: item.color, fontWeight: 600}}>
                              {item.percentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="pt-4 border-t-2" style={{borderColor: theme.border}}>
                      <div className="flex justify-between items-center">
                        <span style={{color: theme.text, fontWeight: 600, fontSize: '16px'}}>Net Worth</span>
                        <span style={{color: theme.primary, fontWeight: 700, fontSize: '18px'}}>
                          {formatCurrency(summary?.net_worth || 0, selectedCurrency, currencyFormat)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center" style={{color: theme.textTertiary}}>
                    <p>No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Asset Distribution Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="asset-distribution-card" style={{background: theme.backgroundSecondary, borderColor: theme.border, boxShadow: theme.cardShadow}}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle style={{color: theme.text}}>Asset Distribution</CardTitle>
                    <p className="text-sm mt-1" style={{color: theme.textTertiary}}>Breakdown by asset type</p>
                  </div>
                  {assetDistributionData.length > 0 && (
                    <ChartTypeSwitcher 
                      currentType={assetDistChartType} 
                      onChange={handleAssetDistChartChange}
                      availableTypes={['treemap', 'pie', 'donut', 'bar']}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {assetDistributionData.length > 0 ? (
                  assetDistChartType === 'treemap' ? (
                    <AssetTreeMap 
                      data={assetDistributionData}
                      selectedCurrency={selectedCurrency}
                      currencyFormat={currencyFormat}
                    />
                  ) : (
                    <FlexibleChart
                      data={assetDistributionData}
                      chartType={assetDistChartType}
                      colors={[]}
                      CustomTooltip={CustomTooltip}
                      labelFormatter={({ name, percentage }) => `${name} ${percentage}%`}
                    />
                  )
                ) : (
                  <div className="h-[300px] flex items-center justify-center" style={{color: theme.textTertiary}}>
                    <p>No assets tracked yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Asset Distribution Data Table */}
            <Card style={{background: theme.backgroundSecondary, borderColor: theme.border, boxShadow: theme.cardShadow}}>
              <CardHeader>
                <CardTitle style={{color: theme.text}}>Asset Details</CardTitle>
                <p className="text-sm mt-1" style={{color: theme.textTertiary}}>Asset type breakdown</p>
              </CardHeader>
              <CardContent>
                {assetDistributionData.length > 0 ? (
                  <div className="space-y-4">
                    <table className="w-full">
                      <thead>
                        <tr style={{borderBottom: `2px solid ${theme.border}`}}>
                          <th className="text-left py-3 px-2" style={{color: theme.textTertiary, fontSize: '12px', fontWeight: 600}}>ASSET TYPE</th>
                          <th className="text-right py-3 px-2" style={{color: theme.textTertiary, fontSize: '12px', fontWeight: 600}}>VALUE</th>
                          <th className="text-right py-3 px-2" style={{color: theme.textTertiary, fontSize: '12px', fontWeight: 600}}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetDistributionData
                          .slice(0, showAllAssets ? assetDistributionData.length : 4)
                          .map((item, index) => (
                            <tr key={index} style={{borderBottom: `1px solid ${theme.border}`}}>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{background: item.color}}
                                  />
                                  <span style={{color: theme.text, fontWeight: 500}}>{item.name}</span>
                                </div>
                              </td>
                              <td className="text-right py-3 px-2" style={{color: theme.textSecondary, fontWeight: 600}}>
                                {formatCurrency(item.value, selectedCurrency, currencyFormat)}
                              </td>
                              <td className="text-right py-3 px-2" style={{color: item.color, fontWeight: 600}}>
                                {item.percentage}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {assetDistributionData.length > 4 && (
                      <div className="flex justify-center pt-2">
                        <Button
                          onClick={() => setShowAllAssets(!showAllAssets)}
                          variant="ghost"
                          size="sm"
                          style={{color: theme.primary}}
                        >
                          {showAllAssets ? 'Show Less' : `Show ${assetDistributionData.length - 4} More`}
                          <span className="ml-2">{showAllAssets ? '↑' : '↓'}</span>
                        </Button>
                      </div>
                    )}
                    <div className="pt-4 border-t-2" style={{borderColor: theme.border}}>
                      <div className="flex justify-between items-center">
                        <span style={{color: theme.text, fontWeight: 600, fontSize: '16px'}}>Total Assets</span>
                        <span style={{color: theme.success, fontWeight: 700, fontSize: '18px'}}>
                          {formatCurrency(summary?.total_assets_value || 0, selectedCurrency, currencyFormat)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center" style={{color: theme.textTertiary}}>
                    <p>No assets tracked yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Loan Analysis Row (if loans exist) */}
          {loanDetails.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card style={{background: theme.backgroundSecondary, borderColor: theme.border, boxShadow: theme.cardShadow}}>
                <CardHeader>
                  <CardTitle style={{color: theme.text}}>Loan Analysis</CardTitle>
                  <p className="text-sm mt-1" style={{color: theme.textTertiary}}>Interactive bubble chart - size represents loan amount or interest rate</p>
                </CardHeader>
                <CardContent>
                  <LoanBubbleChart
                    data={loanDetails}
                    selectedCurrency={selectedCurrency}
                    currencyFormat={currencyFormat}
                  />
                </CardContent>
              </Card>

              {/* Liability Distribution Data Table */}
              <Card style={{background: theme.backgroundSecondary, borderColor: theme.border, boxShadow: theme.cardShadow}}>
                <CardHeader>
                  <CardTitle style={{color: theme.text}}>Liability Details</CardTitle>
                  <p className="text-sm mt-1" style={{color: theme.textTertiary}}>Debt breakdown</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <table className="w-full">
                      <thead>
                        <tr style={{borderBottom: `2px solid ${theme.border}`}}>
                          <th className="text-left py-3 px-2" style={{color: theme.textTertiary, fontSize: '12px', fontWeight: 600}}>DEBT TYPE</th>
                          <th className="text-right py-3 px-2" style={{color: theme.textTertiary, fontSize: '12px', fontWeight: 600}}>VALUE</th>
                          <th className="text-right py-3 px-2" style={{color: theme.textTertiary, fontSize: '12px', fontWeight: 600}}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liabilityDistributionData
                          .slice(0, showAllLiabilities ? liabilityDistributionData.length : 4)
                          .map((item, index) => (
                            <tr key={index} style={{borderBottom: `1px solid ${theme.border}`}}>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{background: item.color}}
                                  />
                                  <span style={{color: theme.text, fontWeight: 500}}>{item.name}</span>
                                </div>
                              </td>
                              <td className="text-right py-3 px-2" style={{color: theme.error, fontWeight: 600}}>
                                {formatCurrency(item.value, selectedCurrency, currencyFormat)}
                              </td>
                              <td className="text-right py-3 px-2" style={{color: item.color, fontWeight: 600}}>
                                {item.percentage}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {liabilityDistributionData.length > 4 && (
                      <div className="flex justify-center pt-2">
                        <Button
                          onClick={() => setShowAllLiabilities(!showAllLiabilities)}
                          variant="ghost"
                          size="sm"
                          style={{color: theme.primary}}
                        >
                          {showAllLiabilities ? 'Show Less' : `Show ${liabilityDistributionData.length - 4} More`}
                          <span className="ml-2">{showAllLiabilities ? '↑' : '↓'}</span>
                        </Button>
                      </div>
                    )}
                    <div className="pt-4 border-t-2" style={{borderColor: theme.border}}>
                      <div className="flex justify-between items-center">
                        <span style={{color: theme.text, fontWeight: 600, fontSize: '16px'}}>Total Liabilities</span>
                        <span style={{color: theme.error, fontWeight: 700, fontSize: '18px'}}>
                          {formatCurrency(summary?.total_liabilities_value || 0, selectedCurrency, currencyFormat)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Historical Net Worth Chart - Moved below charts */}
        <NetWorthChart />

        {/* AI Financial Insights Card */}
        {summary?.total_assets > 0 && (
          <Card style={{background: theme.cardBg, borderColor: theme.primary, boxShadow: theme.cardShadow}}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" style={{color: theme.primary}} />
                <CardTitle style={{color: theme.text}}>AI Financial Insights</CardTitle>
              </div>
              <p className="text-sm mt-1" style={{color: theme.textTertiary}}>Powered by AI analysis of your portfolio</p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/insights')}
                className="text-white rounded-full w-full sm:w-auto"
                style={{background: theme.primaryGradient}}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                View AI Insights & Recommendations
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Guide Card */}
        <Card style={{background: theme.cardBg, borderColor: theme.primary, borderWidth: '2px', boxShadow: theme.cardShadow}}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl" style={{background: 'rgba(168, 85, 247, 0.1)'}}>
                <BookOpen className="w-8 h-8" style={{color: theme.primary}} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2" style={{color: theme.text}}>Track Exchange Portfolios</h3>
                <p className="mb-4" style={{color: theme.textTertiary}}>
                  Create portfolio assets to track multiple holdings from exchanges like Binance, Zerodha, or Robinhood in one place
                </p>
                <Button
                  onClick={() => navigate('/portfolio-guide')}
                  className="text-white rounded-full"
                  style={{background: theme.primaryGradient}}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Learn How to Create Portfolios
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card data-testid="quick-actions-card" style={{background: theme.backgroundSecondary, borderColor: theme.border, boxShadow: theme.cardShadow}}>
          <CardHeader>
            <CardTitle style={{color: theme.text}}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                data-testid="add-asset-btn"
                onClick={() => navigate('/assets')} 
                className="text-white justify-start rounded-xl h-14"
                style={{background: theme.primaryGradient}}
              >
                <Plus className="w-5 h-5 mr-3" />
                Add New Asset
              </Button>
              
              <Button 
                data-testid="view-assets-btn"
                onClick={() => navigate('/assets')} 
                variant="outline"
                className="justify-start rounded-xl h-14"
                style={{borderColor: theme.border, color: theme.textTertiary}}
              >
                <DollarSign className="w-5 h-5 mr-3" />
                View All Assets
              </Button>
              
              <Button 
                data-testid="settings-btn"
                onClick={() => navigate('/settings')} 
                variant="outline"
                className="justify-start rounded-xl h-14"
                style={{borderColor: theme.border, color: theme.textTertiary}}
              >
                <Shield className="w-5 h-5 mr-3" />
                Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
