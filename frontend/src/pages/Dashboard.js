import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, Shield, AlertCircle, Plus, Sparkles, BookOpen } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/currencyConversion';
import NetWorthChart from '@/components/NetWorthChart';
import ChartTypeSwitcher from '@/components/ChartTypeSwitcher';

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
  // Liabilities - Red negative tones
  loan: '#dc2626',
  credit_card: '#ef4444'
};

// CustomTooltip will be created inside the component to access selectedCurrency and currencyFormat

export default function Dashboard() {
  const navigate = useNavigate();
  const { selectedCurrency, currencyFormat } = useApp();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparisonChartType, setComparisonChartType] = useState(() => {
    return sessionStorage.getItem('comparisonChartType') || 'pie';
  });
  const [assetDistChartType, setAssetDistChartType] = useState(() => {
    return sessionStorage.getItem('assetDistChartType') || 'pie';
  });
  const [liabilityDistChartType, setLiabilityDistChartType] = useState(() => {
    return sessionStorage.getItem('liabilityDistChartType') || 'pie';
  });

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
  }, [selectedCurrency]); // Refetch when currency changes

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

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1a1229', border: '1px solid #2d1f3d', borderRadius: '8px', padding: '12px' }}>
          <p style={{ color: '#f8fafc', fontWeight: 600, marginBottom: '4px' }}>{label || payload[0].name}</p>
          <p style={{ color: '#ec4899', fontSize: '14px' }}>
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

  return (
    <Layout>
      <div className="space-y-8" data-testid="dashboard-container">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            Dashboard
          </h1>
          <p style={{color: '#94a3b8'}}>Overview of your assets and security status</p>
        </div>

        {/* Primary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            data-testid="total-assets-card" 
            className="overflow-hidden transition-all hover:shadow-lg"
            style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#3b82f6'}}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2" style={{color: '#94a3b8', letterSpacing: '0.5px'}}>TOTAL ASSETS</p>
                  <div className="text-4xl font-bold mb-1" style={{color: '#f8fafc', fontFamily: 'Inter, sans-serif'}} data-testid="total-assets-count">
                    {summary?.total_assets || 0}
                  </div>
                  <p className="text-xs" style={{color: '#64748b'}}>items tracked</p>
                </div>
                <div className="p-3 rounded-xl" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
                  <DollarSign className="w-8 h-8" style={{color: '#3b82f6'}} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            data-testid="net-worth-card" 
            className="overflow-hidden transition-all hover:shadow-lg"
            style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#ec4899', borderWidth: '2px'}}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2" style={{color: '#94a3b8', letterSpacing: '0.5px'}}>NET WORTH</p>
                  <div className="text-3xl font-bold mb-1" style={{color: '#ec4899', fontFamily: 'Inter, sans-serif'}} data-testid="net-worth-value">
                    {formatCurrency(summary?.net_worth || 0, selectedCurrency, currencyFormat)}
                  </div>
                  <p className="text-xs" style={{color: '#64748b'}}>{selectedCurrency} equivalent</p>
                </div>
                <div className="p-3 rounded-xl" style={{background: 'rgba(236, 72, 153, 0.1)'}}>
                  <TrendingUp className="w-8 h-8" style={{color: '#ec4899'}} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            data-testid="nominee-status-card" 
            className="overflow-hidden transition-all hover:shadow-lg"
            style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: summary?.has_nominee ? '#10b981' : '#f59e0b'}}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2" style={{color: '#94a3b8', letterSpacing: '0.5px'}}>NOMINEE</p>
                  <div className="text-2xl font-bold mb-1" style={{color: summary?.has_nominee ? '#10b981' : '#f59e0b', fontFamily: 'Inter, sans-serif'}} data-testid="nominee-status">
                    {summary?.has_nominee ? '✓ Configured' : 'Not Set'}
                  </div>
                  <p className="text-xs" style={{color: '#64748b'}}>
                    {summary?.has_nominee ? 'Protection active' : 'Setup required'}
                  </p>
                </div>
                <div className="p-3 rounded-xl" style={{background: summary?.has_nominee ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}}>
                  <Shield className="w-8 h-8" style={{color: summary?.has_nominee ? '#10b981' : '#f59e0b'}} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            data-testid="dms-status-card" 
            className="overflow-hidden transition-all hover:shadow-lg"
            style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: summary?.has_dms ? '#a855f7' : '#f59e0b'}}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2" style={{color: '#94a3b8', letterSpacing: '0.5px'}}>DEAD MAN SWITCH</p>
                  <div className="text-2xl font-bold mb-1" style={{color: summary?.has_dms ? '#a855f7' : '#f59e0b', fontFamily: 'Inter, sans-serif'}} data-testid="dms-status">
                    {summary?.has_dms ? '✓ Active' : 'Inactive'}
                  </div>
                  <p className="text-xs" style={{color: '#64748b'}}>
                    {summary?.has_dms ? 'Monitoring enabled' : 'Setup required'}
                  </p>
                </div>
                <div className="p-3 rounded-xl" style={{background: summary?.has_dms ? 'rgba(168, 85, 247, 0.1)' : 'rgba(245, 158, 11, 0.1)'}}>
                  <AlertCircle className="w-8 h-8" style={{color: summary?.has_dms ? '#a855f7' : '#f59e0b'}} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Health Ratios */}
        {summary?.financial_ratios && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{color: '#f8fafc', fontFamily: 'Space Grotesk, sans-serif'}}>
                Financial Health Indicators
              </h2>
              {/* Legend */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{background: '#10b981'}}></div>
                  <span style={{color: '#94a3b8'}}>Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{background: '#f59e0b'}}></div>
                  <span style={{color: '#94a3b8'}}>Caution</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{background: '#ef4444'}}></div>
                  <span style={{color: '#94a3b8'}}>Alert</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Debt-to-Asset Ratio */}
              <Card 
                className="overflow-hidden transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', 
                  borderColor: summary.financial_ratios.debt_to_asset_ratio?.status === 'good' ? '#10b981' : 
                               summary.financial_ratios.debt_to_asset_ratio?.status === 'warning' ? '#f59e0b' : '#ef4444'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{color: '#94a3b8'}}>DEBT-TO-ASSET RATIO</h3>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: summary.financial_ratios.debt_to_asset_ratio?.status === 'good' ? '#10b981' : 
                                   summary.financial_ratios.debt_to_asset_ratio?.status === 'warning' ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{
                      color: summary.financial_ratios.debt_to_asset_ratio?.status === 'good' ? '#10b981' : 
                             summary.financial_ratios.debt_to_asset_ratio?.status === 'warning' ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    {summary.financial_ratios.debt_to_asset_ratio?.display}
                  </div>
                  <p className="text-xs leading-relaxed" style={{color: '#64748b'}}>
                    {summary.financial_ratios.debt_to_asset_ratio?.description}
                  </p>
                  <p className="text-xs mt-2" style={{color: '#94a3b8', fontStyle: 'italic'}}>
                    {summary.financial_ratios.debt_to_asset_ratio?.value < 30 ? '✓ Healthy level' : 
                     summary.financial_ratios.debt_to_asset_ratio?.value < 50 ? '⚠ Monitor closely' : '⚠ High debt burden'}
                  </p>
                </CardContent>
              </Card>

              {/* Liquidity Ratio */}
              <Card 
                className="overflow-hidden transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', 
                  borderColor: summary.financial_ratios.liquidity_ratio?.status === 'good' ? '#10b981' : 
                               summary.financial_ratios.liquidity_ratio?.status === 'warning' ? '#f59e0b' : '#ef4444'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{color: '#94a3b8'}}>LIQUIDITY RATIO</h3>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: summary.financial_ratios.liquidity_ratio?.status === 'good' ? '#10b981' : 
                                   summary.financial_ratios.liquidity_ratio?.status === 'warning' ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{
                      color: summary.financial_ratios.liquidity_ratio?.status === 'good' ? '#10b981' : 
                             summary.financial_ratios.liquidity_ratio?.status === 'warning' ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    {summary.financial_ratios.liquidity_ratio?.display}
                  </div>
                  <p className="text-xs leading-relaxed" style={{color: '#64748b'}}>
                    {summary.financial_ratios.liquidity_ratio?.description}
                  </p>
                  <p className="text-xs mt-2" style={{color: '#94a3b8', fontStyle: 'italic'}}>
                    {summary.financial_ratios.liquidity_ratio?.value >= 1.5 ? '✓ Strong liquidity' : 
                     summary.financial_ratios.liquidity_ratio?.value >= 1.0 ? '⚠ Adequate liquidity' : '⚠ Low liquidity'}
                  </p>
                </CardContent>
              </Card>

              {/* Net Worth Growth */}
              <Card 
                className="overflow-hidden transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', 
                  borderColor: summary.financial_ratios.net_worth_growth?.status === 'good' ? '#10b981' : 
                               summary.financial_ratios.net_worth_growth?.status === 'warning' ? '#f59e0b' : 
                               summary.financial_ratios.net_worth_growth?.status === 'neutral' ? '#64748b' : '#ef4444'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{color: '#94a3b8'}}>NET WORTH GROWTH</h3>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: summary.financial_ratios.net_worth_growth?.status === 'good' ? '#10b981' : 
                                   summary.financial_ratios.net_worth_growth?.status === 'warning' ? '#f59e0b' : 
                                   summary.financial_ratios.net_worth_growth?.status === 'neutral' ? '#64748b' : '#ef4444'
                      }}
                    />
                  </div>
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{
                      color: summary.financial_ratios.net_worth_growth?.status === 'good' ? '#10b981' : 
                             summary.financial_ratios.net_worth_growth?.status === 'warning' ? '#f59e0b' : 
                             summary.financial_ratios.net_worth_growth?.status === 'neutral' ? '#64748b' : '#ef4444'
                    }}
                  >
                    {summary.financial_ratios.net_worth_growth?.display}
                  </div>
                  <p className="text-xs leading-relaxed" style={{color: '#64748b'}}>
                    {summary.financial_ratios.net_worth_growth?.description}
                  </p>
                  <p className="text-xs mt-2" style={{color: '#94a3b8', fontStyle: 'italic'}}>
                    {summary.financial_ratios.net_worth_growth?.value > 0 ? '✓ Positive growth' : 
                     summary.financial_ratios.net_worth_growth?.display === 'N/A' ? 'ℹ Need more snapshots' : '⚠ Declining'}
                  </p>
                </CardContent>
              </Card>

              {/* Diversification Score */}
              <Card 
                className="overflow-hidden transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', 
                  borderColor: summary.financial_ratios.diversification_score?.status === 'good' ? '#10b981' : 
                               summary.financial_ratios.diversification_score?.status === 'warning' ? '#f59e0b' : '#ef4444'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{color: '#94a3b8'}}>DIVERSIFICATION</h3>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: summary.financial_ratios.diversification_score?.status === 'good' ? '#10b981' : 
                                   summary.financial_ratios.diversification_score?.status === 'warning' ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{
                      color: summary.financial_ratios.diversification_score?.status === 'good' ? '#10b981' : 
                             summary.financial_ratios.diversification_score?.status === 'warning' ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    {summary.financial_ratios.diversification_score?.display}
                  </div>
                  <p className="text-xs leading-relaxed" style={{color: '#64748b'}}>
                    {summary.financial_ratios.diversification_score?.description}
                  </p>
                  <p className="text-xs mt-2" style={{color: '#94a3b8', fontStyle: 'italic'}}>
                    {summary.financial_ratios.diversification_score?.value >= 60 ? '✓ Well diversified' : 
                     summary.financial_ratios.diversification_score?.value >= 30 ? '⚠ Add more variety' : '⚠ High concentration risk'}
                  </p>
                </CardContent>
              </Card>

              {/* Emergency Fund Ratio */}
              <Card 
                className="overflow-hidden transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', 
                  borderColor: summary.financial_ratios.emergency_fund_ratio?.status === 'good' ? '#10b981' : 
                               summary.financial_ratios.emergency_fund_ratio?.status === 'warning' ? '#f59e0b' : '#ef4444'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{color: '#94a3b8'}}>EMERGENCY FUND</h3>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: summary.financial_ratios.emergency_fund_ratio?.status === 'good' ? '#10b981' : 
                                   summary.financial_ratios.emergency_fund_ratio?.status === 'warning' ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{
                      color: summary.financial_ratios.emergency_fund_ratio?.status === 'good' ? '#10b981' : 
                             summary.financial_ratios.emergency_fund_ratio?.status === 'warning' ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    {summary.financial_ratios.emergency_fund_ratio?.display}
                  </div>
                  <p className="text-xs leading-relaxed" style={{color: '#64748b'}}>
                    {summary.financial_ratios.emergency_fund_ratio?.description}
                  </p>
                  <p className="text-xs mt-2" style={{color: '#94a3b8', fontStyle: 'italic'}}>
                    {summary.financial_ratios.emergency_fund_ratio?.value >= 3 ? '✓ Safe coverage' : 
                     summary.financial_ratios.emergency_fund_ratio?.value >= 1 ? '⚠ Build reserves' : '⚠ Critical shortage'}
                  </p>
                </CardContent>
              </Card>

              {/* Debt Service Coverage */}
              <Card 
                className="overflow-hidden transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', 
                  borderColor: summary.financial_ratios.debt_service_coverage?.status === 'good' ? '#10b981' : 
                               summary.financial_ratios.debt_service_coverage?.status === 'warning' ? '#f59e0b' : '#ef4444'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{color: '#94a3b8'}}>DEBT COVERAGE</h3>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: summary.financial_ratios.debt_service_coverage?.status === 'good' ? '#10b981' : 
                                   summary.financial_ratios.debt_service_coverage?.status === 'warning' ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{
                      color: summary.financial_ratios.debt_service_coverage?.status === 'good' ? '#10b981' : 
                             summary.financial_ratios.debt_service_coverage?.status === 'warning' ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    {summary.financial_ratios.debt_service_coverage?.display}
                  </div>
                  <p className="text-xs leading-relaxed" style={{color: '#64748b'}}>
                    {summary.financial_ratios.debt_service_coverage?.description}
                  </p>
                  <p className="text-xs mt-2" style={{color: '#94a3b8', fontStyle: 'italic'}}>
                    {summary.financial_ratios.debt_service_coverage?.display === 'N/A' ? 'ℹ No debt obligations' :
                     summary.financial_ratios.debt_service_coverage?.value >= 1.5 ? '✓ Strong coverage' : 
                     summary.financial_ratios.debt_service_coverage?.value >= 1.0 ? '⚠ Adequate coverage' : '⚠ Payment stress'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Alerts */}
        {(!summary?.has_nominee || !summary?.has_dms) && (
          <Card data-testid="setup-alert" style={{background: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)'}}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{color: '#fbbf24'}} />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2" style={{color: '#fbbf24'}}>Setup Required</h3>
                  <p className="mb-4" style={{color: '#cbd5e1'}}>
                    {!summary?.has_nominee && 'Please add a nominee to ensure your assets reach the right person. '}
                    {!summary?.has_dms && 'Configure the dead man switch for automated protection.'}
                  </p>
                  <Button 
                    data-testid="complete-setup-btn"
                    onClick={() => navigate('/settings')} 
                    className="text-white rounded-full"
                    style={{background: '#f59e0b'}}
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
            <Card data-testid="comparison-card" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <CardTitle style={{color: '#f8fafc'}}>Assets vs Liabilities</CardTitle>
                <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Financial position overview</p>
              </CardHeader>
              <CardContent>
                {comparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={comparisonData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {comparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center" style={{color: '#94a3b8'}}>
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
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <CardTitle style={{color: '#f8fafc'}}>Financial Breakdown</CardTitle>
                <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Detailed values and percentages</p>
              </CardHeader>
              <CardContent>
                {comparisonData.length > 0 ? (
                  <div className="space-y-4">
                    <table className="w-full">
                      <thead>
                        <tr style={{borderBottom: '2px solid #2d1f3d'}}>
                          <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px', fontWeight: 600}}>CATEGORY</th>
                          <th className="text-right py-3 px-2" style={{color: '#94a3b8', fontSize: '12px', fontWeight: 600}}>VALUE</th>
                          <th className="text-right py-3 px-2" style={{color: '#94a3b8', fontSize: '12px', fontWeight: 600}}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.map((item, index) => (
                          <tr key={index} style={{borderBottom: '1px solid #1a1229'}}>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{background: item.color}}
                                />
                                <span style={{color: '#f8fafc', fontWeight: 500}}>{item.name}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-2" style={{color: '#cbd5e1', fontWeight: 600}}>
                              {formatCurrency(item.value, selectedCurrency, currencyFormat)}
                            </td>
                            <td className="text-right py-3 px-2" style={{color: item.color, fontWeight: 600}}>
                              {item.percentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="pt-4 border-t-2" style={{borderColor: '#2d1f3d'}}>
                      <div className="flex justify-between items-center">
                        <span style={{color: '#f8fafc', fontWeight: 600, fontSize: '16px'}}>Net Worth</span>
                        <span style={{color: '#ec4899', fontWeight: 700, fontSize: '18px'}}>
                          {formatCurrency(summary?.net_worth || 0, selectedCurrency, currencyFormat)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center" style={{color: '#94a3b8'}}>
                    <p>No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Asset Distribution Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="asset-distribution-card" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <CardTitle style={{color: '#f8fafc'}}>Asset Distribution</CardTitle>
                <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Breakdown by asset type</p>
              </CardHeader>
              <CardContent>
                {assetDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={assetDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center" style={{color: '#94a3b8'}}>
                    <p>No assets tracked yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Asset Distribution Data Table */}
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <CardTitle style={{color: '#f8fafc'}}>Asset Details</CardTitle>
                <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Asset type breakdown</p>
              </CardHeader>
              <CardContent>
                {assetDistributionData.length > 0 ? (
                  <div className="space-y-4">
                    <table className="w-full">
                      <thead>
                        <tr style={{borderBottom: '2px solid #2d1f3d'}}>
                          <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px', fontWeight: 600}}>ASSET TYPE</th>
                          <th className="text-right py-3 px-2" style={{color: '#94a3b8', fontSize: '12px', fontWeight: 600}}>VALUE</th>
                          <th className="text-right py-3 px-2" style={{color: '#94a3b8', fontSize: '12px', fontWeight: 600}}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetDistributionData.map((item, index) => (
                          <tr key={index} style={{borderBottom: '1px solid #1a1229'}}>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{background: item.color}}
                                />
                                <span style={{color: '#f8fafc', fontWeight: 500}}>{item.name}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-2" style={{color: '#cbd5e1', fontWeight: 600}}>
                              {formatCurrency(item.value, selectedCurrency, currencyFormat)}
                            </td>
                            <td className="text-right py-3 px-2" style={{color: item.color, fontWeight: 600}}>
                              {item.percentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="pt-4 border-t-2" style={{borderColor: '#2d1f3d'}}>
                      <div className="flex justify-between items-center">
                        <span style={{color: '#f8fafc', fontWeight: 600, fontSize: '16px'}}>Total Assets</span>
                        <span style={{color: '#10b981', fontWeight: 700, fontSize: '18px'}}>
                          {formatCurrency(summary?.total_assets_value || 0, selectedCurrency, currencyFormat)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center" style={{color: '#94a3b8'}}>
                    <p>No assets tracked yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Liability Distribution Row (if liabilities exist) */}
          {liabilityDistributionData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>Liability Distribution</CardTitle>
                  <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Breakdown by debt type</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={liabilityDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {liabilityDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Liability Distribution Data Table */}
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>Liability Details</CardTitle>
                  <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Debt breakdown</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <table className="w-full">
                      <thead>
                        <tr style={{borderBottom: '2px solid #2d1f3d'}}>
                          <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px', fontWeight: 600}}>DEBT TYPE</th>
                          <th className="text-right py-3 px-2" style={{color: '#94a3b8', fontSize: '12px', fontWeight: 600}}>VALUE</th>
                          <th className="text-right py-3 px-2" style={{color: '#94a3b8', fontSize: '12px', fontWeight: 600}}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liabilityDistributionData.map((item, index) => (
                          <tr key={index} style={{borderBottom: '1px solid #1a1229'}}>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{background: item.color}}
                                />
                                <span style={{color: '#f8fafc', fontWeight: 500}}>{item.name}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-2" style={{color: '#f87171', fontWeight: 600}}>
                              {formatCurrency(item.value, selectedCurrency, currencyFormat)}
                            </td>
                            <td className="text-right py-3 px-2" style={{color: item.color, fontWeight: 600}}>
                              {item.percentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="pt-4 border-t-2" style={{borderColor: '#2d1f3d'}}>
                      <div className="flex justify-between items-center">
                        <span style={{color: '#f8fafc', fontWeight: 600, fontSize: '16px'}}>Total Liabilities</span>
                        <span style={{color: '#dc2626', fontWeight: 700, fontSize: '18px'}}>
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
          <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#a855f7'}}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" style={{color: '#a855f7'}} />
                <CardTitle style={{color: '#f8fafc'}}>AI Financial Insights</CardTitle>
              </div>
              <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Powered by AI analysis of your portfolio</p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/insights')}
                className="text-white rounded-full w-full sm:w-auto"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                View AI Insights & Recommendations
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Guide Card */}
        <Card style={{background: 'linear-gradient(135deg, #2d1f3d 0%, #1a1229 100%)', borderColor: '#a855f7', borderWidth: '2px'}}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl" style={{background: 'rgba(168, 85, 247, 0.1)'}}>
                <BookOpen className="w-8 h-8" style={{color: '#a855f7'}} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2" style={{color: '#f8fafc'}}>Track Exchange Portfolios</h3>
                <p className="mb-4" style={{color: '#94a3b8'}}>
                  Create portfolio assets to track multiple holdings from exchanges like Binance, Zerodha, or Robinhood in one place
                </p>
                <Button
                  onClick={() => navigate('/portfolio-guide')}
                  className="text-white rounded-full"
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Learn How to Create Portfolios
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card data-testid="quick-actions-card" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardHeader>
            <CardTitle style={{color: '#f8fafc'}}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                data-testid="add-asset-btn"
                onClick={() => navigate('/assets')} 
                className="text-white justify-start rounded-xl h-14"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
              >
                <Plus className="w-5 h-5 mr-3" />
                Add New Asset
              </Button>
              
              <Button 
                data-testid="view-assets-btn"
                onClick={() => navigate('/assets')} 
                variant="outline"
                className="justify-start rounded-xl h-14"
                style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
              >
                <DollarSign className="w-5 h-5 mr-3" />
                View All Assets
              </Button>
              
              <Button 
                data-testid="settings-btn"
                onClick={() => navigate('/settings')} 
                variant="outline"
                className="justify-start rounded-xl h-14"
                style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
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
