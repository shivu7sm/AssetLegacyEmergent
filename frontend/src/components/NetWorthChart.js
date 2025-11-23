import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/currencyConversion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomTooltip = ({ active, payload, label, selectedCurrency, currencyFormat }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1a1229', border: '1px solid #2d1f3d', borderRadius: '8px', padding: '12px' }}>
        <p style={{ color: '#f8fafc', fontWeight: 600, marginBottom: '8px' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ marginBottom: '4px' }}>
            <span style={{ color: entry.color, fontWeight: 500 }}>{entry.name}: </span>
            <span style={{ color: '#f8fafc' }}>{formatCurrency(entry.value, selectedCurrency, currencyFormat)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function NetWorthChart() {
  const { selectedCurrency, currencyFormat } = useApp();
  const [history, setHistory] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedCurrency]);

  const fetchData = async () => {
    try {
      const [historyRes, trendsRes] = await Promise.all([
        axios.get(`${API}/networth/history`, { 
          params: { target_currency: selectedCurrency },
          withCredentials: true 
        }),
        axios.get(`${API}/networth/trends`, { 
          params: { target_currency: selectedCurrency },
          withCredentials: true 
        })
      ]);
      
      setHistory(historyRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to fetch net worth history:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSnapshot = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await axios.post(
        `${API}/networth/snapshot`,
        { snapshot_date: today, currency: selectedCurrency },
        { withCredentials: true }
      );
      fetchData();
    } catch (error) {
      console.error('Failed to create snapshot:', error);
    }
  };

  const backfillSnapshots = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/networth/backfill`,
        {},
        { 
          params: { currency: selectedCurrency },
          withCredentials: true 
        }
      );
      
      if (response.data.snapshots_created > 0) {
        alert(`Successfully created ${response.data.snapshots_created} snapshots from your asset purchase dates!`);
        fetchData();
      } else {
        alert('No assets with purchase dates found. Add purchase dates to your assets to enable historical tracking.');
      }
    } catch (error) {
      console.error('Failed to backfill snapshots:', error);
      alert('Failed to backfill snapshots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
        <CardContent className="py-16">
          <div className="text-center" style={{color: '#94a3b8'}}>Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
        <CardHeader>
          <CardTitle style={{color: '#f8fafc'}}>Net Worth History</CardTitle>
        </CardHeader>
        <CardContent className="py-16">
          <div className="text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4" style={{color: '#2d1f3d'}} />
            <h3 className="text-xl font-semibold mb-2" style={{color: '#f8fafc'}}>No Historical Data</h3>
            <p className="mb-6" style={{color: '#94a3b8'}}>Create snapshots to start tracking net worth over time</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={backfillSnapshots}
                disabled={loading}
                className="text-white rounded-full"
                style={{background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'}}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Backfill from Assets'}
              </Button>
              <Button
                onClick={createSnapshot}
                variant="outline"
                className="rounded-full"
                style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Create Snapshot for Today
              </Button>
            </div>
            <p className="mt-4 text-xs" style={{color: '#64748b'}}>
              💡 Backfill automatically creates snapshots from your asset purchase dates
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = history.map(snapshot => ({
    date: new Date(snapshot.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
    'Net Worth': snapshot.net_worth,
    'Assets': snapshot.total_assets,
    'Liabilities': snapshot.total_liabilities
  }));

  return (
    <div className="space-y-6">
      {/* Trend Summary */}
      {trends && trends.trend !== 'insufficient_data' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{color: '#94a3b8'}}>YoY Change</p>
                  <p className="text-2xl font-bold" style={{color: trends.trend === 'positive' ? '#10b981' : '#ef4444'}}>
                    {trends.trend === 'positive' ? '+' : ''}{formatCurrency(trends.yoy_change, selectedCurrency, currencyFormat)}
                  </p>
                </div>
                {trends.trend === 'positive' ? (
                  <TrendingUp className="w-8 h-8" style={{color: '#10b981'}} />
                ) : (
                  <TrendingDown className="w-8 h-8" style={{color: '#ef4444'}} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-4">
              <p className="text-sm" style={{color: '#94a3b8'}}>Growth Rate</p>
              <p className="text-2xl font-bold" style={{color: trends.yoy_percent >= 0 ? '#10b981' : '#ef4444'}}>
                {trends.yoy_percent >= 0 ? '+' : ''}{trends.yoy_percent}%
              </p>
            </CardContent>
          </Card>

          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-4">
              <p className="text-sm" style={{color: '#94a3b8'}}>Data Points</p>
              <p className="text-2xl font-bold" style={{color: '#f8fafc'}}>{trends.period_days}</p>
              <p className="text-xs" style={{color: '#64748b'}}>snapshots tracked</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle style={{color: '#f8fafc'}}>Net Worth Trend</CardTitle>
              <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Historical net worth over time</p>
            </div>
            <Button
              onClick={createSnapshot}
              size="sm"
              className="text-white rounded-full"
              style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Add Snapshot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d1f3d" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value;
                }}
              />
              <Tooltip content={<CustomTooltip selectedCurrency={selectedCurrency} currencyFormat={currencyFormat} />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Net Worth" 
                stroke="#ec4899" 
                strokeWidth={3}
                dot={{ fill: '#ec4899', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="Assets" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="Liabilities" 
                stroke="#dc2626" 
                strokeWidth={2}
                dot={{ fill: '#dc2626', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
