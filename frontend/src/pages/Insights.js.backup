import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sparkles, TrendingUp, AlertTriangle, Target, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Insights() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API}/assets`, { withCredentials: true });
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      toast.error('Failed to load assets');
    }
  };

  const generateInsights = async () => {
    if (assets.length === 0) {
      toast.error('Please add assets first to get insights');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/insights/generate`,
        {},
        { withCredentials: true }
      );
      setInsights(response.data);
      toast.success('AI insights generated successfully');
    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            AI Financial Insights
          </h1>
          <p style={{color: '#94a3b8'}}>Get personalized recommendations powered by AI</p>
        </div>

        {/* Generate Insights Button */}
        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{color: '#f8fafc'}}>
                  Generate Fresh Insights
                </h3>
                <p className="text-sm" style={{color: '#94a3b8'}}>
                  Our AI analyzes your portfolio and provides personalized recommendations
                </p>
              </div>
              <Button
                onClick={generateInsights}
                disabled={loading || assets.length === 0}
                className="text-white rounded-full"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Insights
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Insights Display */}
        {insights && (
          <div className="space-y-6">
            {/* Portfolio Summary */}
            {insights.portfolio_summary && (
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5" style={{color: '#10b981'}} />
                    <CardTitle style={{color: '#f8fafc'}}>Portfolio Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p style={{color: '#cbd5e1', lineHeight: '1.6'}}>{insights.portfolio_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Asset Allocation Recommendations */}
            {insights.allocation_recommendations && insights.allocation_recommendations.length > 0 && (
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5" style={{color: '#a855f7'}} />
                    <CardTitle style={{color: '#f8fafc'}}>Asset Allocation Recommendations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {insights.allocation_recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3 p-4 rounded-lg" style={{background: '#16001e', borderLeft: '3px solid #a855f7'}}>
                        <span className="text-2xl">💡</span>
                        <p style={{color: '#cbd5e1', lineHeight: '1.6'}}>{rec}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Risk Analysis */}
            {insights.risk_analysis && insights.risk_analysis.length > 0 && (
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" style={{color: '#f59e0b'}} />
                    <CardTitle style={{color: '#f8fafc'}}>Risk Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {insights.risk_analysis.map((risk, index) => (
                      <li key={index} className="flex items-start gap-3 p-4 rounded-lg" style={{background: '#16001e', borderLeft: '3px solid #f59e0b'}}>
                        <span className="text-2xl">⚠️</span>
                        <p style={{color: '#cbd5e1', lineHeight: '1.6'}}>{risk}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Action Items */}
            {insights.action_items && insights.action_items.length > 0 && (
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5" style={{color: '#ec4899'}} />
                    <CardTitle style={{color: '#f8fafc'}}>Recommended Actions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {insights.action_items.map((action, index) => (
                      <li key={index} className="flex items-start gap-3 p-4 rounded-lg" style={{background: '#16001e', borderLeft: '3px solid #ec4899'}}>
                        <span className="text-2xl">✅</span>
                        <p style={{color: '#cbd5e1', lineHeight: '1.6'}}>{action}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!insights && assets.length === 0 && (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-16">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4" style={{color: '#2d1f3d'}} />
                <h3 className="text-xl font-semibold mb-2" style={{color: '#f8fafc'}}>No Assets Yet</h3>
                <p className="mb-6" style={{color: '#94a3b8'}}>Add assets to your portfolio to get AI-powered insights</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
