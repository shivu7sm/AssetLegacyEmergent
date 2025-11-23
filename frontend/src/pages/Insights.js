import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Sparkles, TrendingUp, AlertTriangle, Target, Loader2, Clock, RefreshCw, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

// Helper function to format markdown-style text
const formatText = (text) => {
  if (!text) return '';
  // Convert **text** to <strong>text</strong>
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
             .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Insights() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [assets, setAssets] = useState([]);
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    recommendations: false,
    advantages: false,
    risks: false,
    actions: false
  });

  useEffect(() => {
    fetchAssets();
    fetchLatestInsight();
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

  const fetchLatestInsight = async () => {
    try {
      const response = await axios.get(`${API}/insights/latest`, { withCredentials: true });
      if (response.data) {
        setInsights(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch latest insight:', error);
    } finally {
      setInitialLoading(false);
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (initialLoading) {
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            AI Financial Insights
          </h1>
          <p style={{color: '#94a3b8'}}>AI-powered analysis of your portfolio with personalized recommendations</p>
        </div>

        {/* Generate/Refresh Insights Button */}
        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{color: '#f8fafc'}}>
                  {insights ? 'Refresh Your Insights' : 'Generate Fresh Insights'}
                </h3>
                <div className="flex items-center gap-2">
                  {insights && insights.generated_at && (
                    <div className="flex items-center gap-2 text-sm" style={{color: '#94a3b8'}}>
                      <Clock className="w-4 h-4" />
                      <span>Last updated: {formatTimestamp(insights.generated_at)}</span>
                    </div>
                  )}
                  {!insights && (
                    <p className="text-sm" style={{color: '#94a3b8'}}>
                      AI analyzes your portfolio and provides personalized recommendations
                    </p>
                  )}
                </div>
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
                ) : insights ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Insights
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
            {/* Portfolio Summary - Concise by Default */}
            {insights.portfolio_summary && (
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5" style={{color: '#10b981'}} />
                    <CardTitle style={{color: '#f8fafc'}}>Portfolio Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p 
                    style={{color: '#cbd5e1', lineHeight: '1.8', fontSize: '15px'}}
                    dangerouslySetInnerHTML={{__html: formatText(insights.portfolio_summary)}}
                  />
                  
                  {/* View Detailed Analysis Button */}
                  <div className="mt-6">
                    <Dialog open={showDetailedModal} onOpenChange={setShowDetailedModal}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="rounded-full"
                          style={{borderColor: '#a855f7', color: '#a855f7'}}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          View Detailed Analysis
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                        <DialogHeader>
                          <DialogTitle style={{color: '#f8fafc', fontSize: '24px'}}>
                            Comprehensive Portfolio Analysis
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 mt-4">
                          {/* Detailed Summary */}
                          <div className="p-4 rounded-lg" style={{background: '#16001e', borderLeft: '3px solid #10b981'}}>
                            <h4 className="font-semibold mb-2" style={{color: '#10b981', fontSize: '16px'}}>Portfolio Overview</h4>
                            <p 
                              style={{color: '#cbd5e1', lineHeight: '1.8'}}
                              dangerouslySetInnerHTML={{__html: formatText(insights.portfolio_summary)}}
                            />
                          </div>

                          {/* Asset Distribution Analysis */}
                          {insights.asset_distribution_analysis && (
                            <div className="p-4 rounded-lg" style={{background: '#16001e', borderLeft: '3px solid #3b82f6'}}>
                              <h4 className="font-semibold mb-2" style={{color: '#3b82f6', fontSize: '16px'}}>Asset Distribution Analysis</h4>
                              <p 
                                style={{color: '#cbd5e1', lineHeight: '1.8'}}
                                dangerouslySetInnerHTML={{__html: formatText(insights.asset_distribution_analysis)}}
                              />
                            </div>
                          )}

                          {/* All Recommendations */}
                          {insights.allocation_recommendations && insights.allocation_recommendations.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3" style={{color: '#a855f7', fontSize: '18px'}}>Allocation Recommendations</h4>
                              <ul className="space-y-2">
                                {insights.allocation_recommendations.map((rec, index) => (
                                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{background: '#16001e'}}>
                                    <span className="text-xl">💡</span>
                                    <p 
                                      style={{color: '#cbd5e1', lineHeight: '1.6'}}
                                      dangerouslySetInnerHTML={{__html: formatText(rec)}}
                                    />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* All Advantages */}
                          {insights.advantages && insights.advantages.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3" style={{color: '#10b981', fontSize: '18px'}}>Portfolio Advantages</h4>
                              <ul className="space-y-2">
                                {insights.advantages.map((adv, index) => (
                                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{background: '#16001e'}}>
                                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{color: '#10b981'}} />
                                    <p 
                                      style={{color: '#cbd5e1', lineHeight: '1.6'}}
                                      dangerouslySetInnerHTML={{__html: formatText(adv)}}
                                    />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* All Risks */}
                          {insights.risks && insights.risks.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3" style={{color: '#f59e0b', fontSize: '18px'}}>Risk Assessment</h4>
                              <ul className="space-y-2">
                                {insights.risks.map((risk, index) => (
                                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{background: '#16001e'}}>
                                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{color: '#f59e0b'}} />
                                    <p 
                                      style={{color: '#cbd5e1', lineHeight: '1.6'}}
                                      dangerouslySetInnerHTML={{__html: formatText(risk)}}
                                    />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* All Action Items */}
                          {insights.action_items && insights.action_items.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3" style={{color: '#ec4899', fontSize: '18px'}}>Recommended Actions</h4>
                              <ul className="space-y-2">
                                {insights.action_items.map((action, index) => (
                                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{background: '#16001e'}}>
                                    <span className="text-xl">✅</span>
                                    <p 
                                      style={{color: '#cbd5e1', lineHeight: '1.6'}}
                                      dangerouslySetInnerHTML={{__html: formatText(action)}}
                                    />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Insights - Collapsible Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Recommendations (First 2-3) */}
              {insights.allocation_recommendations && insights.allocation_recommendations.length > 0 && (
                <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5" style={{color: '#a855f7'}} />
                        <CardTitle style={{color: '#f8fafc'}}>Top Recommendations</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('recommendations')}
                        className="text-xs"
                        style={{color: '#94a3b8'}}
                      >
                        {expandedSections.recommendations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {insights.allocation_recommendations.slice(0, expandedSections.recommendations ? undefined : 2).map((rec, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{background: '#16001e', borderLeft: '2px solid #a855f7'}}>
                          <span className="text-lg">💡</span>
                          <p 
                            style={{color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px'}}
                            dangerouslySetInnerHTML={{__html: formatText(rec)}}
                          />
                        </li>
                      ))}
                    </ul>
                    {insights.allocation_recommendations.length > 2 && !expandedSections.recommendations && (
                      <button
                        onClick={() => toggleSection('recommendations')}
                        className="text-sm mt-3 hover:underline"
                        style={{color: '#a855f7'}}
                      >
                        +{insights.allocation_recommendations.length - 2} more
                      </button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Key Risks (First 2) */}
              {insights.risks && insights.risks.length > 0 && (
                <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5" style={{color: '#f59e0b'}} />
                        <CardTitle style={{color: '#f8fafc'}}>Key Risks</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('risks')}
                        className="text-xs"
                        style={{color: '#94a3b8'}}
                      >
                        {expandedSections.risks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {insights.risks.slice(0, expandedSections.risks ? undefined : 2).map((risk, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{background: '#16001e', borderLeft: '2px solid #f59e0b'}}>
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color: '#f59e0b'}} />
                          <p 
                            style={{color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px'}}
                            dangerouslySetInnerHTML={{__html: formatText(risk)}}
                          />
                        </li>
                      ))}
                    </ul>
                    {insights.risks.length > 2 && !expandedSections.risks && (
                      <button
                        onClick={() => toggleSection('risks')}
                        className="text-sm mt-3 hover:underline"
                        style={{color: '#f59e0b'}}
                      >
                        +{insights.risks.length - 2} more
                      </button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Portfolio Advantages (First 2) */}
              {insights.advantages && insights.advantages.length > 0 && (
                <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5" style={{color: '#10b981'}} />
                        <CardTitle style={{color: '#f8fafc'}}>Portfolio Strengths</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('advantages')}
                        className="text-xs"
                        style={{color: '#94a3b8'}}
                      >
                        {expandedSections.advantages ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {insights.advantages.slice(0, expandedSections.advantages ? undefined : 2).map((adv, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{background: '#16001e', borderLeft: '2px solid #10b981'}}>
                          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color: '#10b981'}} />
                          <p 
                            style={{color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px'}}
                            dangerouslySetInnerHTML={{__html: formatText(adv)}}
                          />
                        </li>
                      ))}
                    </ul>
                    {insights.advantages.length > 2 && !expandedSections.advantages && (
                      <button
                        onClick={() => toggleSection('advantages')}
                        className="text-sm mt-3 hover:underline"
                        style={{color: '#10b981'}}
                      >
                        +{insights.advantages.length - 2} more
                      </button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action Items (First 2-3) */}
              {insights.action_items && insights.action_items.length > 0 && (
                <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5" style={{color: '#ec4899'}} />
                        <CardTitle style={{color: '#f8fafc'}}>Next Steps</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('actions')}
                        className="text-xs"
                        style={{color: '#94a3b8'}}
                      >
                        {expandedSections.actions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {insights.action_items.slice(0, expandedSections.actions ? undefined : 2).map((action, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{background: '#16001e', borderLeft: '2px solid #ec4899'}}>
                          <span className="text-lg">✅</span>
                          <p 
                            style={{color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px'}}
                            dangerouslySetInnerHTML={{__html: formatText(action)}}
                          />
                        </li>
                      ))}
                    </ul>
                    {insights.action_items.length > 2 && !expandedSections.actions && (
                      <button
                        onClick={() => toggleSection('actions')}
                        className="text-sm mt-3 hover:underline"
                        style={{color: '#ec4899'}}
                      >
                        +{insights.action_items.length - 2} more
                      </button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
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

        {!insights && assets.length > 0 && (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-16">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4" style={{color: '#a855f7'}} />
                <h3 className="text-xl font-semibold mb-2" style={{color: '#f8fafc'}}>Ready to Analyze</h3>
                <p className="mb-6" style={{color: '#94a3b8'}}>Click the button above to generate your first AI-powered portfolio analysis</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
