import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, Shield, AlertCircle, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ASSET_COLORS = {
  bank: '#10b981',
  insurance: '#3b82f6',
  investment: '#8b5cf6',
  crypto: '#f59e0b',
  gold: '#fbbf24',
  diamond: '#ec4899',
  locker: '#6366f1',
  property: '#14b8a6',
  loan: '#ef4444'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/summary`, { withCredentials: true });
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const pieChartData = summary?.asset_values ? Object.entries(summary.asset_values).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: Math.round(value),
    color: ASSET_COLORS[key] || '#64748b',
    percentage: summary.total_value_usd > 0 ? ((value / summary.total_value_usd) * 100).toFixed(1) : 0
  })) : [];

  const barChartData = summary?.asset_values ? Object.entries(summary.asset_values).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: Math.round(value),
    count: summary.asset_types[key] || 0,
    color: ASSET_COLORS[key] || '#64748b'
  })).sort((a, b) => b.value - a.value) : [];

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="total-assets-card" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{color: '#94a3b8'}}>Total Assets</CardTitle>
              <DollarSign className="w-5 h-5" style={{color: '#ec4899'}} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{color: '#f8fafc'}} data-testid="total-assets-count">{summary?.total_assets || 0}</div>
              <p className="text-xs mt-1" style={{color: '#64748b'}}>Items tracked</p>
            </CardContent>
          </Card>

          <Card data-testid="net-worth-card" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{color: '#94a3b8'}}>Net Worth</CardTitle>
              <TrendingUp className="w-5 h-5" style={{color: '#a855f7'}} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{color: '#ec4899'}} data-testid="net-worth-value">
                ${summary?.total_value_usd?.toLocaleString() || '0'}
              </div>
              <p className="text-xs mt-1" style={{color: '#64748b'}}>USD equivalent</p>
            </CardContent>
          </Card>

          <Card data-testid="nominee-status-card" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{color: '#94a3b8'}}>Nominee</CardTitle>
              <Shield className="w-5 h-5" style={{color: '#ec4899'}} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{color: '#f8fafc'}} data-testid="nominee-status">
                {summary?.has_nominee ? '✓ Configured' : 'Not Set'}
              </div>
              <p className="text-xs mt-1" style={{color: '#64748b'}}>
                {summary?.has_nominee ? 'Nominee assigned' : 'Add nominee'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="dms-status-card" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{color: '#94a3b8'}}>Dead Man Switch</CardTitle>
              <AlertCircle className="w-5 h-5" style={{color: '#a855f7'}} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{color: '#f8fafc'}} data-testid="dms-status">
                {summary?.has_dms ? '✓ Active' : 'Inactive'}
              </div>
              <p className="text-xs mt-1" style={{color: '#64748b'}}>
                {summary?.has_dms ? 'Protection enabled' : 'Setup required'}
              </p>
            </CardContent>
          </Card>
        </div>

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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Distribution by Value */}
          <Card data-testid="asset-distribution-card" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardHeader>
              <CardTitle style={{color: '#f8fafc'}}>Asset Distribution by Value</CardTitle>
              <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Portfolio allocation by USD value</p>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1a1229', 
                        border: '1px solid #2d1f3d',
                        borderRadius: '8px',
                        color: '#f8fafc'
                      }}
                      formatter={(value) => `$${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center" style={{color: '#94a3b8'}}>
                  <div className="text-center">
                    <p className="mb-4">No assets tracked yet</p>
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

          {/* Value by Asset Type (Bar Chart) */}
          <Card data-testid="value-by-type-card" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardHeader>
              <CardTitle style={{color: '#f8fafc'}}>Value by Asset Type</CardTitle>
              <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Ranked by total value</p>
            </CardHeader>
            <CardContent>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d1f3d" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1a1229', 
                        border: '1px solid #2d1f3d',
                        borderRadius: '8px',
                        color: '#f8fafc'
                      }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center" style={{color: '#94a3b8'}}>
                  <p>No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                data-testid="manage-security-btn"
                onClick={() => navigate('/settings')} 
                variant="outline"
                className="justify-start rounded-xl h-14"
                style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
              >
                <Shield className="w-5 h-5 mr-3" />
                Manage Security
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
