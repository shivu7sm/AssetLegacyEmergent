import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { Shield, Lock, Eye, Heart } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function NomineeAccess() {
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [loading, setLoading] = useState(false);
  const [nomineeInfo, setNomineeInfo] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/nominee/auth`, null, {
        params: { access_token: token }
      });
      
      setNomineeInfo(response.data);
      localStorage.setItem('nominee_access_token', token);
      localStorage.setItem('nominee_info', JSON.stringify(response.data));
      
      toast.success(`Welcome, ${response.data.nominee.name}`);
      navigate('/nominee-dashboard');
    } catch (error) {
      console.error('Nominee login failed:', error);
      if (error.response?.status === 403) {
        toast.error(error.response.data.detail || 'Access not yet available');
      } else {
        toast.error('Invalid access token');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #1a0b2e 0%, #16001e 50%, #2d0e3e 100%)'}}>
      <div className="w-full max-w-md p-6">
        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{background: 'rgba(168, 85, 247, 0.2)'}}>
              <Shield className="w-8 h-8" style={{color: '#a855f7'}} />
            </div>
            <CardTitle style={{color: '#f8fafc', fontSize: '1.75rem'}}>Nominee Access Portal</CardTitle>
            <p className="text-sm mt-2" style={{color: '#94a3b8'}}>
              Enter your secure access token to view the portfolio you've been granted access to
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label className="text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Access Token
                </Label>
                <Input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="nom_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                  className="bg-slate-800 border-slate-700 text-white mt-2"
                />
                <p className="text-xs mt-2" style={{color: '#64748b'}}>
                  You should have received this token via email from the account holder
                </p>
              </div>

              <Button 
                type="submit"
                disabled={loading}
                className="w-full"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: '#fff'}}
              >
                {loading ? 'Verifying...' : 'Access Portfolio'}
              </Button>
            </form>

            <div className="mt-6 p-4 rounded-lg" style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)'}}>
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 flex-shrink-0" style={{color: '#60a5fa'}} />
                <div>
                  <p className="text-sm font-semibold mb-1" style={{color: '#60a5fa'}}>Read-Only Access</p>
                  <p className="text-xs" style={{color: '#cbd5e1'}}>
                    You'll be able to view assets, documents, and the digital will. You cannot make any changes or modifications.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <button 
                onClick={() => navigate('/')}
                className="text-sm"
                style={{color: '#94a3b8'}}
              >
                ← Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
