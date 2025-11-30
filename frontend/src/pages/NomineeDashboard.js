import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { Shield, Eye, LogOut, FileText, Wallet, Users, AlertCircle, DollarSign } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function NomineeDashboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('nominee_access_token'));
  const [nomineeInfo, setNomineeInfo] = useState(JSON.parse(localStorage.getItem('nominee_info') || '{}'));

  useEffect(() => {
    if (!token) {
      navigate('/nominee-access');
      return;
    }
    
    // Check if this is a demo mode preview
    if (token.startsWith('nom_demo_')) {
      // Use demo mode - create mock data
      setNomineeInfo({
        nominee: { name: 'You (Demo Preview)', relationship: 'Preview Mode' },
        owner: { name: 'Demo Account Owner', email: 'demo@example.com' }
      });
      fetchDashboard();
    } else {
      fetchDashboard();
    }
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/nominee/dashboard`, {
        params: { access_token: token }
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      toast.error('Failed to load dashboard. Your access may have been revoked.');
      setTimeout(() => navigate('/nominee-access'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nominee_access_token');
    localStorage.removeItem('nominee_info');
    navigate('/nominee-access');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #1a0b2e 0%, #16001e 50%, #2d0e3e 100%)'}}>
        <p style={{color: '#f8fafc'}}>Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #1a0b2e 0%, #16001e 50%, #2d0e3e 100%)'}}>
      {/* Header */}
      <header className="backdrop-blur-xl sticky top-0 z-50" style={{borderBottom: '1px solid #2d1f3d', background: 'rgba(15, 10, 30, 0.9)', padding: '1rem 2rem'}}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7" style={{color: '#ec4899'}} />
            <div>
              <h1 className="text-xl font-bold" style={{color: '#f8fafc'}}>AssetVault - Nominee View</h1>
              <p className="text-xs" style={{color: '#94a3b8'}}>Portfolio of {nomineeInfo.owner?.name}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" style={{borderColor: '#2d1f3d', color: '#94a3b8'}}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Read-Only Banner */}
      <div style={{padding: '1rem 2rem'}}>
        <div className="p-4 rounded-lg mb-6" style={{background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)'}}>
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6" style={{color: '#60a5fa'}} />
            <div>
              <p className="font-semibold" style={{color: '#60a5fa'}}>Read-Only Access</p>
              <p className="text-sm" style={{color: '#cbd5e1'}}>
                You're viewing as: {data?.nominee_info?.name} ({data?.nominee_info?.relationship || 'Nominee'})
                {data?.nominee_info?.priority && ` - Priority ${data.nominee_info.priority}`}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'rgba(236, 72, 153, 0.2)'}}>
                  <DollarSign className="w-6 h-6" style={{color: '#ec4899'}} />
                </div>
                <div>
                  <p className="text-sm" style={{color: '#94a3b8'}}>Total Value</p>
                  <p className="text-2xl font-bold" style={{color: '#f8fafc'}}>
                    ${data?.summary?.total_value?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'rgba(168, 85, 247, 0.2)'}}>
                  <Wallet className="w-6 h-6" style={{color: '#a855f7'}} />
                </div>
                <div>
                  <p className="text-sm" style={{color: '#94a3b8'}}>Assets</p>
                  <p className="text-2xl font-bold" style={{color: '#f8fafc'}}>
                    {data?.summary?.total_assets || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'rgba(59, 130, 246, 0.2)'}}>
                  <FileText className="w-6 h-6" style={{color: '#3b82f6'}} />
                </div>
                <div>
                  <p className="text-sm" style={{color: '#94a3b8'}}>Documents</p>
                  <p className="text-2xl font-bold" style={{color: '#f8fafc'}}>
                    {data?.summary?.document_count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'rgba(16, 185, 129, 0.2)'}}>
                  <Users className="w-6 h-6" style={{color: '#10b981'}} />
                </div>
                <div>
                  <p className="text-sm" style={{color: '#94a3b8'}}>Nominees</p>
                  <p className="text-2xl font-bold" style={{color: '#f8fafc'}}>
                    {data?.nominees?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assets List */}
        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}} className="mb-6">
          <CardHeader>
            <CardTitle style={{color: '#f8fafc'}}>Assets ({data?.assets?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.assets?.map((asset) => (
                <div key={asset.id} className="p-4 rounded-lg" style={{background: '#16001e', border: '1px solid #2d1f3d'}}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold" style={{color: '#f8fafc'}}>{asset.name}</p>
                      <p className="text-sm" style={{color: '#94a3b8'}}>{asset.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{color: '#ec4899'}}>
                        {asset.purchase_currency} {(asset.current_value || asset.total_value || 0).toLocaleString()}
                      </p>
                      {asset.purchase_date && (
                        <p className="text-xs" style={{color: '#64748b'}}>
                          Since {new Date(asset.purchase_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        {data?.documents?.length > 0 && (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}} className="mb-6">
            <CardHeader>
              <CardTitle style={{color: '#f8fafc'}}>Documents ({data.documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.documents.map((doc) => (
                  <div key={doc.id} className="p-3 rounded" style={{background: '#16001e'}}>
                    <p className="font-medium" style={{color: '#f8fafc'}}>{doc.name}</p>
                    <p className="text-xs" style={{color: '#94a3b8'}}>{doc.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Digital Will */}
        {data?.will && (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardHeader>
              <CardTitle style={{color: '#f8fafc'}}>Digital Will</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm" style={{color: '#cbd5e1'}}>
                  {data.will.will_text}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
