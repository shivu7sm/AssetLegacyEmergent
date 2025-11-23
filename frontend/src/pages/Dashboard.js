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

  const chartData = summary?.asset_types ? Object.entries(summary.asset_types).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: ASSET_COLORS[key] || '#64748b'
  })) : [];

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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            Dashboard
          </h1>
          <p className="text-slate-400">Overview of your assets and security status</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 border-slate-700" data-testid="total-assets-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Assets</CardTitle>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="total-assets-count">{summary?.total_assets || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Items tracked</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700" data-testid="net-worth-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Net Worth</CardTitle>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white" data-testid="net-worth-value">
                ${summary?.total_value_usd?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-slate-500 mt-1">USD equivalent</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700" data-testid="nominee-status-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Nominee</CardTitle>
              <Shield className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="nominee-status">
                {summary?.has_nominee ? '✓ Configured' : 'Not Set'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {summary?.has_nominee ? 'Nominee assigned' : 'Add nominee'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700" data-testid="dms-status-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Dead Man Switch</CardTitle>
              <AlertCircle className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="dms-status">
                {summary?.has_dms ? '✓ Active' : 'Inactive'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {summary?.has_dms ? 'Protection enabled' : 'Setup required'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {(!summary?.has_nominee || !summary?.has_dms) && (
          <Card className="bg-amber-900/20 border-amber-800/50" data-testid="setup-alert">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-400 mb-2">Setup Required</h3>
                  <p className="text-slate-300 mb-4">
                    {!summary?.has_nominee && 'Please add a nominee to ensure your assets reach the right person. '}
                    {!summary?.has_dms && 'Configure the dead man switch for automated protection.'}
                  </p>
                  <Button 
                    data-testid="complete-setup-btn"
                    onClick={() => navigate('/settings')} 
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-full"
                  >
                    Complete Setup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts and Assets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Distribution */}
          <Card className="bg-slate-800/50 border-slate-700" data-testid="asset-distribution-card">
            <CardHeader>
              <CardTitle className="text-white">Asset Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <p className="mb-4">No assets tracked yet</p>
                    <Button 
                      data-testid="add-first-asset-btn"
                      onClick={() => navigate('/assets')} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Asset
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-slate-800/50 border-slate-700" data-testid="quick-actions-card">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  data-testid="add-asset-btn"
                  onClick={() => navigate('/assets')} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white justify-start rounded-xl h-14"
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Add New Asset
                </Button>
                
                <Button 
                  data-testid="view-assets-btn"
                  onClick={() => navigate('/assets')} 
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start rounded-xl h-14"
                >
                  <DollarSign className="w-5 h-5 mr-3" />
                  View All Assets
                </Button>
                
                <Button 
                  data-testid="manage-security-btn"
                  onClick={() => navigate('/settings')} 
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start rounded-xl h-14"
                >
                  <Shield className="w-5 h-5 mr-3" />
                  Manage Security
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
