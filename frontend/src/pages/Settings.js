import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { User, Settings as SettingsIcon, Eye, Globe, Shield, CreditCard, Users, Clock, RefreshCw, Link, Bell, AlertTriangle, ChevronUp, ChevronDown, Trash2, Heart, Palette, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import NomineeAccessCard from '@/components/NomineeAccessCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Appearance Section Component
function AppearanceSection() {
  const { colorTheme, setColorTheme, theme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{color: theme.text}}>
          <Palette className="w-7 h-7" />
          Appearance
        </h2>
        <p style={{color: theme.textTertiary}}>Choose between Standard (Dark) or White (Light) theme</p>
      </div>

      <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
        <CardHeader>
          <CardTitle style={{color: theme.text}}>Theme Selection</CardTitle>
          <CardDescription style={{color: theme.textTertiary}}>
            Choose your preferred color theme. Your selection will be remembered across sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dark Theme Card */}
            <div 
              onClick={() => setColorTheme('dark')}
              className="cursor-pointer relative p-6 rounded-lg border-2 transition-all"
              style={{
                background: colorTheme === 'dark' ? 'rgba(168, 85, 247, 0.1)' : theme.backgroundTertiary,
                borderColor: colorTheme === 'dark' ? '#a855f7' : theme.border,
                transform: colorTheme === 'dark' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {colorTheme === 'dark' && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{background: '#a855f7'}}>
                  <span style={{color: '#fff', fontSize: '14px'}}>✓</span>
                </div>
              )}
              <h3 className="text-lg font-bold mb-2" style={{color: theme.text}}>Standard (Dark)</h3>
              <p className="text-sm mb-4" style={{color: theme.textTertiary}}>
                Dark theme with purple and pink gradient accents. Easy on the eyes with vibrant colors.
              </p>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded" style={{background: '#0b0b11'}}></div>
                <div className="w-8 h-8 rounded" style={{background: '#1a1229'}}></div>
                <div className="w-8 h-8 rounded" style={{background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'}}></div>
              </div>
            </div>

            {/* Light Theme Card */}
            <div 
              onClick={() => setColorTheme('light')}
              className="cursor-pointer relative p-6 rounded-lg border-2 transition-all"
              style={{
                background: colorTheme === 'light' ? 'rgba(139, 92, 246, 0.1)' : theme.backgroundTertiary,
                borderColor: colorTheme === 'light' ? '#8b5cf6' : theme.border,
                transform: colorTheme === 'light' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {colorTheme === 'light' && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{background: '#8b5cf6'}}>
                  <span style={{color: '#fff', fontSize: '14px'}}>✓</span>
                </div>
              )}
              <h3 className="text-lg font-bold mb-2" style={{color: theme.text}}>White (Light)</h3>
              <p className="text-sm mb-4" style={{color: theme.textTertiary}}>
                Clean white theme with dark text. Perfect for bright environments and better readability.
              </p>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded" style={{background: '#ffffff', border: '1px solid #e2e8f0'}}></div>
                <div className="w-8 h-8 rounded" style={{background: '#f8fafc'}}></div>
                <div className="w-8 h-8 rounded" style={{background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'}}></div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg" style={{background: colorTheme === 'dark' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(139, 92, 246, 0.1)', border: `1px solid ${colorTheme === 'dark' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`}}>
            <p className="text-sm" style={{color: theme.textSecondary}}>
              <strong style={{color: theme.primary}}>Current theme:</strong> {colorTheme === 'dark' ? 'Standard (Dark)' : 'White (Light)'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Demo Data Section Component
function DemoDataSection() {
  const { theme } = useTheme();
  const [resetting, setResetting] = useState(false);

  const handleResetDemoData = async () => {
    if (!window.confirm('This will delete all your demo data and create fresh sample data. This action cannot be undone. Continue?')) {
      return;
    }

    setResetting(true);
    try {
      await axios.post(`${API}/demo/reseed`, {}, { withCredentials: true });
      toast.success('Demo data reset successfully! Refresh the page to see updated data.');
    } catch (error) {
      console.error('Failed to reset demo data:', error);
      toast.error('Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{color: theme.text}}>
          <RefreshCw className="w-7 h-7" />
          Demo Data Management
        </h2>
        <p style={{color: theme.textTertiary}}>Reset and manage your demo data for testing</p>
      </div>

      <Card style={{background: theme.cardBg, borderColor: '#f59e0b', borderWidth: '2px'}}>
        <CardHeader>
          <CardTitle style={{color: theme.text}}>Reset Demo Data</CardTitle>
          <CardDescription style={{color: theme.textTertiary}}>
            Use this to restore the original sample data if you've made changes in demo mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg" style={{background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)'}}>
            <h4 className="font-semibold mb-2" style={{color: '#fbbf24'}}>⚠️ What happens when you reset:</h4>
            <ul className="text-sm space-y-1" style={{color: theme.textSecondary}}>
              <li>• All demo assets will be deleted and recreated</li>
              <li>• Demo documents will be restored to defaults</li>
              <li>• Demo scheduled messages will be reset</li>
              <li>• Demo digital will content will be refreshed</li>
              <li>• Your live data (in Live Mode) will NOT be affected</li>
            </ul>
          </div>

          <Button 
            onClick={handleResetDemoData}
            disabled={resetting}
            className="w-full"
            style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff'}}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting Demo Data...' : 'Reset Demo Data'}
          </Button>

          <p className="text-xs text-center" style={{color: theme.textTertiary}}>
            After reset, switch between Demo and Live mode to see the fresh data
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Connected Accounts Section Component
function ConnectedAccountsSection({ demoMode }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  
  useEffect(() => {
    fetchConnectedAccounts();
  }, []);
  
  const fetchConnectedAccounts = async () => {
    try {
      const response = await axios.get(`${API}/nominees/my-accesses`, { withCredentials: true });
      setConnectedAccounts(response.data.accessible_accounts || []);
    } catch (error) {
      console.error('Failed to fetch connected accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{color: theme.text}}>Connected Accounts</h2>
        <p style={{color: theme.textTertiary}}>Portfolios you have access to as a nominee</p>
      </div>
      
      {/* Test Account - Demo Mode Only */}
      {demoMode && (
        <Card style={{background: theme.cardBg, borderColor: theme.warning, borderWidth: '2px'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{color: theme.warning}}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              AssetVault Demo Portfolio (Test Account)
            </CardTitle>
            <CardDescription style={{color: theme.textSecondary}}>
              Universal test account - Available only in Demo Mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)'}}>
              <div>
                <p className="font-semibold mb-1" style={{color: theme.text}}>Demo Account Holder</p>
                <p className="text-sm" style={{color: theme.textTertiary}}>demo.portfolio@assetvault.com</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-1 rounded-full" style={{background: 'rgba(16, 185, 129, 0.2)', color: theme.success}}>
                    Read-Only Access
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{background: 'rgba(245, 158, 11, 0.2)', color: theme.warning}}>
                    Demo Mode Only
                  </span>
                </div>
              </div>
              <Button
                onClick={() => navigate('/assets')}
                style={{background: theme.warning, color: '#fff'}}
              >
                View in Assets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Accounts Where User is Nominee */}
      {loadingAccounts ? (
        <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
          <CardContent className="py-16">
            <p className="text-center" style={{color: theme.textTertiary}}>Loading connected accounts...</p>
          </CardContent>
        </Card>
      ) : connectedAccounts.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold" style={{color: theme.text}}>
            Accounts You Can Access ({connectedAccounts.length})
          </h3>
          {connectedAccounts.map((account) => (
            <Card key={account.account_id} style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'rgba(168, 85, 247, 0.2)'}}>
                      <Shield className="w-6 h-6" style={{color: '#a855f7'}} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg" style={{color: theme.text}}>{account.account_name}</p>
                      <p className="text-sm" style={{color: theme.textTertiary}}>{account.account_email}</p>
                      <div className="flex gap-2 mt-1">
                        {account.relationship && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7'}}>
                            {account.relationship}
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 rounded-full" style={{
                          background: account.access_type === 'immediate' ? 'rgba(168, 85, 247, 0.2)' :
                                     account.access_type === 'temporary' ? 'rgba(245, 158, 11, 0.2)' :
                                     'rgba(59, 130, 246, 0.2)',
                          color: account.access_type === 'immediate' ? '#a855f7' :
                                 account.access_type === 'temporary' ? '#f59e0b' :
                                 '#3b82f6'
                        }}>
                          {account.access_type === 'immediate' ? '⚡ Immediate' :
                           account.access_type === 'temporary' ? '⏰ Temporary (7 days)' :
                           '🛡️ After DMS'}
                        </span>
                        {account.access_type === 'immediate' && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{background: 'rgba(16, 185, 129, 0.2)', color: '#10b981'}}>
                            ✓ Active Now
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/assets')}
                    style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: '#fff'}}
                  >
                    View Portfolio
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
          <CardContent className="py-16">
            <div className="text-center">
              <Link className="w-16 h-16 mx-auto mb-4" style={{color: '#2d1f3d'}} />
              <h3 className="text-xl font-semibold mb-2" style={{color: theme.text}}>No Connected Accounts</h3>
              <p className="mb-6" style={{color: theme.textTertiary}}>
                You don't have access to any other portfolios yet. When someone grants you nominee access, it will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Security Audit Section Component
function SecurityAuditSection({ user }) {
  const { theme } = useTheme();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get(`${API}/audit/logs?days=30`, { withCredentials: true });
      setAuditLogs(response.data || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const deleteOldLogs = async () => {
    if (!window.confirm('Delete all audit logs older than 30 days? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`${API}/audit/logs/cleanup`, { withCredentials: true });
      toast.success('Old audit logs deleted successfully');
      fetchAuditLogs();
    } catch (error) {
      console.error('Failed to delete old logs:', error);
      toast.error('Failed to delete old logs');
    }
  };

  const getActionColor = (action) => {
    if (action.includes('create') || action.includes('login')) return '#10b981';
    if (action.includes('update')) return '#3b82f6';
    if (action.includes('delete')) return '#ef4444';
    return '#94a3b8';
  };

  const getActionIcon = (action) => {
    if (action.includes('login')) return '🔐';
    if (action.includes('create')) return '➕';
    if (action.includes('update')) return '✏️';
    if (action.includes('delete')) return '🗑️';
    return '📝';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{color: theme.text}}>
          <Shield className="w-7 h-7" />
          Security & Audit Logs
        </h2>
        <p style={{color: theme.textTertiary}}>Monitor account activity and security events from the last 30 days</p>
      </div>

      {/* Security Overview Card */}
      <Card style={{background: theme.cardBg, borderColor: '#3b82f6', borderWidth: '2px'}}>
        <CardHeader>
          <CardTitle style={{color: theme.text}}>Account Security Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)'}}>
              <div className="flex items-center gap-3">
                <Shield className="w-10 h-10" style={{color: '#10b981'}} />
                <div>
                  <div className="text-2xl font-bold" style={{color: '#10b981'}}>Active</div>
                  <div className="text-sm" style={{color: theme.textSecondary}}>Account Status</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)'}}>
              <div className="flex items-center gap-3">
                <Users className="w-10 h-10" style={{color: '#3b82f6'}} />
                <div>
                  <div className="text-2xl font-bold" style={{color: '#3b82f6'}}>{auditLogs.length}</div>
                  <div className="text-sm" style={{color: theme.textSecondary}}>Recent Activities</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
              <div className="flex items-center gap-3">
                <Clock className="w-10 h-10" style={{color: '#a855f7'}} />
                <div>
                  <div className="text-2xl font-bold" style={{color: '#a855f7'}}>30 Days</div>
                  <div className="text-sm" style={{color: theme.textSecondary}}>Log Retention</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle style={{color: theme.text}}>Recent Activity (Last 30 Days)</CardTitle>
              <CardDescription style={{color: theme.textTertiary}}>
                Track all security-related events on your account
              </CardDescription>
            </div>
            <Button
              onClick={deleteOldLogs}
              variant="outline"
              size="sm"
              style={{borderColor: '#ef4444', color: '#ef4444'}}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Old Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8" style={{color: theme.textTertiary}}>Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8" style={{color: theme.textTertiary}}>No recent activity</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLogs.map((log, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                  style={{background: '#131835', border: '1px solid #1e293b'}}
                >
                  <div className="text-2xl flex-shrink-0">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="font-semibold"
                        style={{color: getActionColor(log.action)}}
                      >
                        {log.action}
                      </span>
                      {log.resource_type && (
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{background: '#2d1f3d', color: theme.textTertiary}}
                        >
                          {log.resource_type}
                        </span>
                      )}
                    </div>
                    <div className="text-sm" style={{color: theme.textSecondary}}>
                      {log.changes && typeof log.changes === 'object' && (
                        <span className="mr-2">
                          {Object.keys(log.changes).length} changes
                        </span>
                      )}
                      {log.ip_address && (
                        <span className="mr-2">IP: {log.ip_address}</span>
                      )}
                    </div>
                    <div className="text-xs mt-1" style={{color: theme.textMuted}}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card style={{background: theme.cardBg, borderColor: theme.info, borderLeftWidth: '4px'}}>
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 flex-shrink-0" style={{color: theme.info}} />
            <div>
              <h3 className="font-semibold mb-2" style={{color: theme.info}}>Why Audit Logs Matter</h3>
              <ul className="text-sm space-y-2" style={{color: theme.textSecondary}}>
                <li>• <strong>Detect suspicious activity:</strong> Monitor for unauthorized access attempts</li>
                <li>• <strong>Track changes:</strong> See what was modified and when</li>
                <li>• <strong>Compliance:</strong> Maintain a record of all account activities</li>
                <li>• <strong>Auto-cleanup:</strong> Logs older than 30 days can be deleted to save space</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Eye },
  { id: 'appearance', label: 'Appearance', icon: SettingsIcon },
  { id: 'nominees', label: 'Nominees', icon: Users },
  { id: 'will', label: 'Will & Testament', icon: FileText },
  { id: 'dms', label: 'Dead Man\'s Switch', icon: Clock },
  { id: 'demo', label: 'Demo Data', icon: RefreshCw },
  { id: 'connected', label: 'Connected Accounts', icon: Link },
  { id: 'subscription', label: 'Subscription & Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'privacy', label: 'Privacy & Consent', icon: Globe }
];

export default function Settings() {
  const { theme } = useTheme();
  const { selectedCurrency, currencyFormat, preferences, loadPreferences } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(searchParams.get('tab') || 'profile');
  const [user, setUser] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [dms, setDms] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  
  const [nomineeForm, setNomineeForm] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    priority: 1
  });
  
  const [editingNomineeId, setEditingNomineeId] = useState(null);
  
  const [dmsForm, setDmsForm] = useState({
    inactivity_days: 90,
    reminder_1_days: 60,
    reminder_2_days: 75,
    reminder_3_days: 85,
    reminder_method: 'email',
    is_active: true
  });

  const [preferencesForm, setPreferencesForm] = useState({
    measurement_unit: 'imperial',
    weight_unit: 'ounce',
    currency_format: 'standard',
    default_currency: 'USD',
    default_asset_view: 'grid',
    marketing_consent: false,
    communication_consent: true
  });

  useEffect(() => {
    fetchData();
    checkDemoMode();
  }, []);

  const checkDemoMode = async () => {
    try {
      const response = await axios.get(`${API}/demo/status`, { withCredentials: true });
      setDemoMode(response.data.demo_mode);
    } catch (error) {
      console.error('Failed to check demo mode:', error);
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveSection(tab);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [userRes, nomineesRes, dmsRes, subRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { withCredentials: true }),
        axios.get(`${API}/nominees`, { withCredentials: true }),
        axios.get(`${API}/dms`, { withCredentials: true }),
        axios.get(`${API}/subscription/current`, { withCredentials: true })
      ]);
      
      setUser(userRes.data);
      setSubscription(subRes.data);
      
      // Handle multiple nominees
      if (nomineesRes.data && Array.isArray(nomineesRes.data)) {
        setNominees(nomineesRes.data.sort((a, b) => a.priority - b.priority));
      }
      
      if (dmsRes.data) {
        setDms(dmsRes.data);
        setDmsForm({
          inactivity_days: dmsRes.data.inactivity_days,
          reminder_1_days: dmsRes.data.reminder_1_days,
          reminder_2_days: dmsRes.data.reminder_2_days,
          reminder_3_days: dmsRes.data.reminder_3_days,
          is_active: dmsRes.data.is_active !== false
        });
      }

      if (preferences) {
        setPreferencesForm({
          measurement_unit: preferences.measurement_unit || 'imperial',
          weight_unit: preferences.weight_unit || 'ounce',
          currency_format: preferences.currency_format || 'standard',
          default_currency: preferences.default_currency || 'USD',
          default_asset_view: preferences.default_asset_view || 'grid',
          marketing_consent: preferences.marketing_consent || false,
          communication_consent: preferences.communication_consent !== false
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNomineeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNomineeId) {
        await axios.put(`${API}/nominees/${editingNomineeId}`, nomineeForm, { withCredentials: true });
        toast.success('Nominee updated successfully');
      } else {
        await axios.post(`${API}/nominees`, nomineeForm, { withCredentials: true });
        toast.success('Nominee added successfully');
      }
      setNomineeForm({ name: '', email: '', phone: '', relationship: '', priority: nominees.length + 1 });
      setEditingNomineeId(null);
      setDialogOpen(false); // Close modal
      fetchData();
    } catch (error) {
      console.error('Failed to save nominee:', error);
      toast.error('Failed to save nominee');
    }
  };

  const handleEditNominee = (nominee) => {
    setNomineeForm({
      name: nominee.name,
      email: nominee.email,
      phone: nominee.phone || '',
      relationship: nominee.relationship || '',
      priority: nominee.priority
    });
    setEditingNomineeId(nominee.id);
    setDialogOpen(true); // Open modal for editing
  };

  const handleDeleteNominee = async (nomineeId) => {
    if (!window.confirm('Are you sure you want to delete this nominee?')) return;
    
    try {
      await axios.delete(`${API}/nominees/${nomineeId}`, { withCredentials: true });
      toast.success('Nominee deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete nominee:', error);
      toast.error('Failed to delete nominee');
    }
  };

  const handleMovePriority = async (nomineeId, direction) => {
    const currentIndex = nominees.findIndex(n => n.id === nomineeId);
    if ((direction === 'up' && currentIndex === 0) || 
        (direction === 'down' && currentIndex === nominees.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const updatedNominees = [...nominees];
    [updatedNominees[currentIndex], updatedNominees[newIndex]] = 
      [updatedNominees[newIndex], updatedNominees[currentIndex]];

    // Update priorities
    try {
      await Promise.all(
        updatedNominees.map((nominee, index) => 
          axios.put(`${API}/nominees/${nominee.id}`, { ...nominee, priority: index + 1 }, { withCredentials: true })
        )
      );
      toast.success('Priority updated');
      fetchData();
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const handleDmsSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/dms`, dmsForm, { withCredentials: true });
      toast.success('Dead man switch configured successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to save DMS:', error);
      toast.error('Failed to save dead man switch');
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/user/preferences`, preferencesForm, { withCredentials: true });
      toast.success('Preferences saved successfully');
      await loadPreferences();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const resetLastActivity = async () => {
    try {
      await axios.post(`${API}/dms/reset`, {}, { withCredentials: true });
      toast.success('Activity timestamp reset');
      fetchData();
    } catch (error) {
      console.error('Failed to reset activity:', error);
      toast.error('Failed to reset activity');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-400 text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  const renderSection = () => {
    switch(activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{color: theme.text}}>Profile</h2>
              <p style={{color: theme.textTertiary}}>Manage your account information and personal details</p>
            </div>
            
            {/* Profile Card */}
            <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
              <CardHeader>
                <CardTitle style={{color: theme.text}}>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  {user?.picture && (
                    <img src={user.picture} alt={user.name} className="w-24 h-24 rounded-full border-2" style={{borderColor: '#a855f7'}} />
                  )}
                  <div className="flex-1">
                    <p className="text-2xl font-semibold mb-1" style={{color: theme.text}}>{user?.name}</p>
                    <p className="text-lg" style={{color: theme.textTertiary}}>{user?.email}</p>
                    <div className="flex gap-4 mt-3">
                      <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7'}}>
                        {user?.subscription_plan || 'Free'} Plan
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs" style={{background: 'rgba(148, 163, 184, 0.2)', color: theme.textSecondary}}>
                        Member since {new Date(user?.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Profile Fields */}
                <div className="grid grid-cols-2 gap-4 pt-6" style={{borderTop: '1px solid #2d1f3d'}}>
                  <div>
                    <Label style={{color: theme.textSecondary}}>Phone Number</Label>
                    <Input
                      type="tel"
                      defaultValue={user?.phone || ''}
                      placeholder="+1 234 567 8900"
                      className="mt-2" style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}
                    />
                  </div>
                  <div>
                    <Label style={{color: theme.textSecondary}}>Date of Birth</Label>
                    <Input
                      type="date"
                      defaultValue={user?.date_of_birth || ''}
                      className="mt-2" style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}
                    />
                  </div>
                  <div>
                    <Label style={{color: theme.textSecondary}}>Country/Region</Label>
                    <Select defaultValue={user?.country || 'US'}>
                      <SelectTrigger className="mt-2" style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                        <SelectItem value="US" className="text-white">🇺🇸 United States</SelectItem>
                        <SelectItem value="UK" className="text-white">🇬🇧 United Kingdom</SelectItem>
                        <SelectItem value="IN" className="text-white">🇮🇳 India</SelectItem>
                        <SelectItem value="SG" className="text-white">🇸🇬 Singapore</SelectItem>
                        <SelectItem value="AU" className="text-white">🇦🇺 Australia</SelectItem>
                        <SelectItem value="CA" className="text-white">🇨🇦 Canada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label style={{color: theme.textSecondary}}>Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger className="mt-2" style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                        <SelectItem value="en" className="text-white">English</SelectItem>
                        <SelectItem value="es" className="text-white">Español</SelectItem>
                        <SelectItem value="fr" className="text-white">Français</SelectItem>
                        <SelectItem value="hi" className="text-white">हिंदी</SelectItem>
                        <SelectItem value="zh" className="text-white">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="pt-6" style={{borderTop: '1px solid #2d1f3d'}}>
                  <h3 className="text-lg font-semibold mb-4" style={{color: theme.text}}>Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label style={{color: theme.textSecondary}}>Contact Name</Label>
                      <Input
                        placeholder="Emergency contact person"
                        className="mt-2" style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}
                      />
                    </div>
                    <div>
                      <Label style={{color: theme.textSecondary}}>Contact Phone</Label>
                      <Input
                        type="tel"
                        placeholder="+1 234 567 8900"
                        className="mt-2" style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => toast.success('Profile updated (full implementation pending)')}
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: '#fff'}}
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card style={{background: theme.cardBg, borderColor: theme.primary, borderWidth: '1px'}}>
              <CardHeader>
                <CardTitle style={{color: theme.text}}>Account Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)'}}>
                    <p className="text-3xl font-bold mb-1" style={{color: theme.primary}}>
                      {user?.last_activity ? Math.floor((Date.now() - new Date(user.last_activity)) / (1000 * 60 * 60 * 24)) : 0}
                    </p>
                    <p className="text-xs" style={{color: theme.textTertiary}}>Days Since Last Active</p>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)'}}>
                    <p className="text-3xl font-bold mb-1" style={{color: theme.success}}>
                      {Math.floor((Date.now() - new Date(user?.created_at)) / (1000 * 60 * 60 * 24))}
                    </p>
                    <p className="text-xs" style={{color: theme.textTertiary}}>Days as Member</p>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{background: 'rgba(245, 158, 11, 0.1)'}}>
                    <p className="text-3xl font-bold mb-1" style={{color: theme.warning}}>
                      {user?.role === 'admin' ? 'Admin' : 'User'}
                    </p>
                    <p className="text-xs" style={{color: theme.textTertiary}}>Account Type</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{color: theme.text}}>Display Preferences</h2>
              <p style={{color: theme.textTertiary}}>Customize how you view your data</p>
            </div>
            
            <form onSubmit={handlePreferencesSubmit} className="space-y-6">
              <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
                <CardHeader>
                  <CardTitle style={{color: theme.text}}>Currency & Format</CardTitle>
                  <CardDescription style={{color: theme.textTertiary}}>Set your default currency and format preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label style={{color: theme.textSecondary}}>Default Currency</Label>
                    <Select 
                      value={preferencesForm.default_currency || 'USD'} 
                      onValueChange={(value) => setPreferencesForm({...preferencesForm, default_currency: value})}
                    >
                      <SelectTrigger style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                        <SelectItem value="USD" className="text-white">🇺🇸 USD - US Dollar</SelectItem>
                        <SelectItem value="EUR" className="text-white">🇪🇺 EUR - Euro</SelectItem>
                        <SelectItem value="GBP" className="text-white">🇬🇧 GBP - British Pound</SelectItem>
                        <SelectItem value="INR" className="text-white">🇮🇳 INR - Indian Rupee</SelectItem>
                        <SelectItem value="JPY" className="text-white">🇯🇵 JPY - Japanese Yen</SelectItem>
                        <SelectItem value="AUD" className="text-white">🇦🇺 AUD - Australian Dollar</SelectItem>
                        <SelectItem value="CAD" className="text-white">🇨🇦 CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="CHF" className="text-white">🇨🇭 CHF - Swiss Franc</SelectItem>
                        <SelectItem value="CNY" className="text-white">🇨🇳 CNY - Chinese Yuan</SelectItem>
                        <SelectItem value="AED" className="text-white">🇦🇪 AED - UAE Dirham</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs mt-1" style={{color: theme.textMuted}}>This will be your default currency when you log in</p>
                  </div>
                  
                  <div>
                    <Label style={{color: theme.textSecondary}}>Currency Format</Label>
                    <Select 
                      value={preferencesForm.currency_format} 
                      onValueChange={(value) => setPreferencesForm({...preferencesForm, currency_format: value})}
                    >
                      <SelectTrigger style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                        <SelectItem value="standard" className="text-white">Standard (1,000,000)</SelectItem>
                        <SelectItem value="indian" className="text-white">Indian (10,00,000 / Lakhs & Crores)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs mt-1" style={{color: theme.textMuted}}>Change how currency amounts are displayed</p>
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
                <CardHeader>
                  <CardTitle style={{color: theme.text}}>Assets View</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label style={{color: theme.textSecondary}}>Default View</Label>
                    <Select 
                      value={preferencesForm.default_asset_view} 
                      onValueChange={(value) => setPreferencesForm({...preferencesForm, default_asset_view: value})}
                    >
                      <SelectTrigger style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                        <SelectItem value="grid" className="text-white">Grid View</SelectItem>
                        <SelectItem value="table" className="text-white">Table View</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs mt-1" style={{color: theme.textMuted}}>Choose your default assets view layout</p>
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
                <CardHeader>
                  <CardTitle style={{color: theme.text}}>Measurement Units</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{color: theme.textSecondary}}>Area Unit</Label>
                      <Select 
                        value={preferencesForm.measurement_unit} 
                        onValueChange={(value) => setPreferencesForm({...preferencesForm, measurement_unit: value})}
                      >
                        <SelectTrigger style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                          <SelectItem value="imperial" className="text-white">Imperial (sqft)</SelectItem>
                          <SelectItem value="metric" className="text-white">Metric (sqmt)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label style={{color: theme.textSecondary}}>Weight Unit</Label>
                      <Select 
                        value={preferencesForm.weight_unit} 
                        onValueChange={(value) => setPreferencesForm({...preferencesForm, weight_unit: value})}
                      >
                        <SelectTrigger style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                          <SelectItem value="ounce" className="text-white">Ounce</SelectItem>
                          <SelectItem value="gram" className="text-white">Gram</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                type="submit"
                className="text-white rounded-full"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
              >
                Save Preferences
              </Button>
            </form>
          </div>
        );

      case 'connected':
        return <ConnectedAccountsSection demoMode={demoMode} />;

      case 'subscription': {
        const subDetails = subscription?.subscription_details;
        const currentPlan = subscription?.plan || 'Free';
        const hasActiveSubscription = currentPlan !== 'Free' && subDetails;
        
        const formatDate = (dateStr) => {
          return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        };

        const getStatusIcon = (status) => {
          const CheckCircle2 = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
          const XCircle = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
          const AlertCircle = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
          
          switch(status) {
            case 'active':
              return <div style={{color: '#10b981'}}><CheckCircle2 /></div>;
            case 'canceled':
              return <div style={{color: '#ef4444'}}><XCircle /></div>;
            default:
              return <div style={{color: '#f59e0b'}}><AlertCircle /></div>;
          }
        };

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{color: theme.text}}>Subscription & Billing</h2>
              <p style={{color: theme.textTertiary}}>Manage your subscription plan and billing information</p>
            </div>
            
            {/* Detailed Subscription Card */}
            <Card style={{background: theme.cardBg, borderColor: '#a855f7'}}>
              <CardContent className="py-6">
                <div className="flex items-start justify-between flex-wrap gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <p className="text-sm" style={{color: theme.textTertiary}}>Current Plan</p>
                      {hasActiveSubscription && getStatusIcon(subDetails.status)}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold" style={{color: theme.text}}>{currentPlan}</h3>
                      {currentPlan !== 'Free' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)',
                          color: '#fff'
                        }}>
                          PREMIUM
                        </span>
                      )}
                    </div>

                    {hasActiveSubscription && (
                      <div className="space-y-3 mt-4">
                        {/* Subscription Status */}
                        <div className="flex items-center gap-2 text-sm">
                          <span style={{color: theme.textTertiary}}>Status:</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                            background: subDetails.status === 'active' ? '#10b98120' : '#ef444420',
                            color: subDetails.status === 'active' ? '#10b981' : '#ef4444'
                          }}>
                            {subDetails.status === 'active' ? 'Active' : subDetails.cancel_at ? 'Canceling' : 'Inactive'}
                          </span>
                        </div>

                        {/* Subscription Start Date */}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" style={{color: theme.textTertiary}} />
                          <span style={{color: theme.textTertiary}}>Started:</span>
                          <span style={{color: theme.text}}>{formatDate(subDetails.created)}</span>
                        </div>

                        {/* Current Billing Period */}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" style={{color: theme.textTertiary}} />
                          <span style={{color: theme.textTertiary}}>Current Period:</span>
                          <span style={{color: theme.text}}>
                            {formatDate(subDetails.current_period_start)} - {formatDate(subDetails.current_period_end)}
                          </span>
                        </div>

                        {/* Next Renewal or Cancel Date */}
                        {subDetails.cancel_at ? (
                          <div className="flex items-center gap-2 p-3 rounded" style={{background: '#ef444410', borderLeft: '3px solid #ef4444'}}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#ef4444'}}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-semibold" style={{color: '#ef4444'}}>Subscription Canceling</p>
                              <p className="text-xs" style={{color: theme.textTertiary}}>
                                Access until {formatDate(subDetails.cancel_at)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            <RefreshCw className="w-4 h-4" style={{color: theme.textTertiary}} />
                            <span style={{color: theme.textTertiary}}>Next Renewal:</span>
                            <span style={{color: '#10b981', fontWeight: 600}}>
                              {formatDate(subDetails.current_period_end)}
                            </span>
                          </div>
                        )}

                        {/* Auto Renewal Status */}
                        <div className="flex items-center gap-2 text-sm">
                          <RefreshCw className="w-4 h-4" style={{color: theme.textTertiary}} />
                          <span style={{color: theme.textTertiary}}>Auto-Renewal:</span>
                          <span style={{color: subDetails.cancel_at ? '#ef4444' : '#10b981', fontWeight: 600}}>
                            {subDetails.cancel_at ? 'Disabled' : 'Enabled'}
                          </span>
                        </div>

                        {/* Payment Method */}
                        {subDetails.payment_method && (
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="w-4 h-4" style={{color: theme.textTertiary}} />
                            <span style={{color: theme.textTertiary}}>Payment Method:</span>
                            <span style={{color: theme.text}}>
                              {subDetails.payment_method.brand.toUpperCase()} ••••{subDetails.payment_method.last4}
                            </span>
                            <span className="text-xs" style={{color: theme.textMuted}}>
                              (Expires {subDetails.payment_method.exp_month}/{subDetails.payment_method.exp_year})
                            </span>
                          </div>
                        )}

                        {/* Billing Amount */}
                        <div className="flex items-center gap-2 text-sm">
                          <span style={{color: theme.textTertiary}}>Amount:</span>
                          <span className="text-lg font-bold" style={{color: '#a855f7'}}>
                            {subDetails.currency} ${subDetails.amount}/{subDetails.interval}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6 flex-wrap">
                      <Button
                        onClick={() => window.location.href = '/subscription'}
                        variant="outline"
                        style={{borderColor: '#a855f7', color: '#a855f7'}}
                      >
                        View All Plans
                      </Button>
                      
                      {currentPlan !== 'Free' && !subDetails?.cancel_at && (
                        <Button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) return;
                            try {
                              await axios.post(`${API}/subscription/cancel`, {}, { withCredentials: true });
                              toast.success('Subscription will be canceled at period end');
                              loadSettings();
                            } catch (error) {
                              toast.error('Failed to cancel subscription');
                            }
                          }}
                          variant="outline"
                          style={{borderColor: '#ef4444', color: '#ef4444'}}
                        >
                          Cancel Subscription
                        </Button>
                      )}
                      
                      {currentPlan !== 'Free' && subDetails?.cancel_at && (
                        <Button
                          onClick={async () => {
                            if (!confirm('Reactivate your subscription? Your payment method will be charged at the next billing cycle.')) return;
                            try {
                              await axios.post(`${API}/subscription/reactivate`, {}, { withCredentials: true });
                              toast.success('Subscription reactivated successfully!');
                              loadSettings();
                            } catch (error) {
                              toast.error('Failed to reactivate subscription');
                            }
                          }}
                          variant="outline"
                          style={{borderColor: '#10b981', color: '#10b981'}}
                        >
                          Reactivate Subscription
                        </Button>
                      )}
                    </div>
                  </div>
                  <CreditCard className="w-12 h-12" style={{color: '#a855f7'}} />
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            {subscription && (
              <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
                <CardHeader>
                  <CardTitle style={{color: theme.text}}>Current Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Assets Usage */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span style={{color: theme.textTertiary}}>Assets</span>
                        <span style={{color: theme.text, fontWeight: 600}}>
                          {subscription.usage.assets} / {subscription.features.max_assets > 0 ? subscription.features.max_assets : '∞'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{background: theme.backgroundTertiary}}>
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{
                            width: subscription.features.max_assets > 0 
                              ? `${Math.min((subscription.usage.assets / subscription.features.max_assets) * 100, 100)}%`
                              : '50%',
                            background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Documents Usage */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span style={{color: theme.textTertiary}}>Documents</span>
                        <span style={{color: theme.text, fontWeight: 600}}>
                          {subscription.usage.documents} / {subscription.features.max_documents > 0 ? subscription.features.max_documents : '∞'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{background: theme.backgroundTertiary}}>
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{
                            width: subscription.features.max_documents > 0 
                              ? `${Math.min((subscription.usage.documents / subscription.features.max_documents) * 100, 100)}%`
                              : '50%',
                            background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Storage Usage */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span style={{color: theme.textTertiary}}>Storage</span>
                        <span style={{color: theme.text, fontWeight: 600}}>
                          {subscription.features.storage_mb >= 1024 
                            ? `${(subscription.usage.storage_mb / 1024).toFixed(2)} GB / ${(subscription.features.storage_mb / 1024).toFixed(0)} GB`
                            : `${subscription.usage.storage_mb.toFixed(1)} MB / ${subscription.features.storage_mb} MB`
                          }
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{background: theme.backgroundTertiary}}>
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((subscription.usage.storage_mb / subscription.features.storage_mb) * 100, 100)}%`,
                            background: subscription.usage.storage_mb / subscription.features.storage_mb > 0.8 
                              ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                              : 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      }

      case 'nominees':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{color: theme.text}}>
                  <Users className="w-7 h-7" />
                  Nominees
                </h2>
                <p style={{color: theme.textTertiary}}>Designate trusted individuals to inherit your assets and receive notifications</p>
              </div>
              
              {/* Add Nominee Button */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <Button 
                  onClick={() => {
                    setEditingNomineeId(null);
                    setNomineeForm({ name: '', email: '', phone: '', relationship: '', priority: nominees.length + 1 });
                    setDialogOpen(true);
                  }}
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: '#fff'}}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Nominee
                </Button>
                
                {/* Add/Edit Nominee Modal */}
                <DialogContent className="max-w-lg" style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
                  <DialogHeader>
                    <DialogTitle style={{color: theme.text, fontSize: '1.5rem'}}>
                      {editingNomineeId ? 'Edit Nominee' : 'Add New Nominee'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleNomineeSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label style={{color: theme.textSecondary}}>Name *</Label>
                        <Input
                          value={nomineeForm.name}
                          onChange={(e) => setNomineeForm({ ...nomineeForm, name: e.target.value })}
                          placeholder="John Doe"
                          required
                          style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}
                        />
                      </div>
                      <div>
                        <Label style={{color: theme.textSecondary}}>Relationship</Label>
                        <Select 
                          value={nomineeForm.relationship} 
                          onValueChange={(value) => setNomineeForm({ ...nomineeForm, relationship: value })}
                        >
                          <SelectTrigger style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                            <SelectItem value="spouse" className="text-white">Spouse</SelectItem>
                            <SelectItem value="parent" className="text-white">Parent</SelectItem>
                            <SelectItem value="child" className="text-white">Child</SelectItem>
                            <SelectItem value="sibling" className="text-white">Sibling</SelectItem>
                            <SelectItem value="friend" className="text-white">Friend</SelectItem>
                            <SelectItem value="lawyer" className="text-white">Lawyer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label style={{color: theme.textSecondary}}>Email *</Label>
                      <Input
                        type="email"
                        value={nomineeForm.email}
                        onChange={(e) => setNomineeForm({ ...nomineeForm, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                        style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}
                      />
                    </div>
                    
                    <div>
                      <Label style={{color: theme.textSecondary}}>Phone</Label>
                      <Input
                        type="tel"
                        value={nomineeForm.phone}
                        onChange={(e) => setNomineeForm({ ...nomineeForm, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                        style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: '#fff'}}>
                        {editingNomineeId ? 'Update Nominee' : 'Add Nominee'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        style={{borderColor: theme.border, color: theme.textTertiary}}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Nominees List with Access Controls */}
            {nominees.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{color: theme.text}}>
                  <Shield className="w-5 h-5" style={{color: '#a855f7'}} />
                  Your Nominees ({nominees.length})
                </h3>
                <p className="text-sm mb-4" style={{color: theme.textTertiary}}>
                  Configure access permissions for each nominee below
                </p>
                
                {nominees.map((nominee, index) => (
                  <NomineeAccessCard 
                    key={nominee.id} 
                    nominee={nominee}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === nominees.length - 1}
                    onUpdate={fetchData}
                    onEdit={handleEditNominee}
                    onDelete={handleDeleteNominee}
                    onMovePriority={handleMovePriority}
                  />
                ))}
              </div>
            )}

            {/* How Nominee Access Works - Visual Guide */}
            <Card style={{background: theme.cardBg, borderColor: theme.primary, borderWidth: '2px'}}>
              <CardHeader>
                <CardTitle style={{color: theme.text}}>How Nominee Access Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Flow Diagram */}
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center" style={{background: 'rgba(168, 85, 247, 0.2)'}}>
                        <User className="w-8 h-8" style={{color: '#a855f7'}} />
                      </div>
                      <p className="text-xs font-semibold" style={{color: theme.text}}>You Grant Access</p>
                      <p className="text-xs" style={{color: theme.textMuted}}>Generate secure link</p>
                    </div>
                    
                    <div style={{color: theme.primary, fontSize: '1.5rem'}}>→</div>
                    
                    <div className="text-center flex-1">
                      <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center" style={{background: 'rgba(245, 158, 11, 0.2)'}}>
                        <Clock className="w-8 h-8" style={{color: '#f59e0b'}} />
                      </div>
                      <p className="text-xs font-semibold" style={{color: theme.text}}>Access Type</p>
                      <p className="text-xs" style={{color: theme.textMuted}}>Immediate or After DMS</p>
                    </div>
                    
                    <div style={{color: theme.primary, fontSize: '1.5rem'}}>→</div>
                    
                    <div className="text-center flex-1">
                      <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center" style={{background: 'rgba(16, 185, 129, 0.2)'}}>
                        <Eye className="w-8 h-8" style={{color: '#10b981'}} />
                      </div>
                      <p className="text-xs font-semibold" style={{color: theme.text}}>Nominee Views</p>
                      <p className="text-xs" style={{color: theme.textMuted}}>Read-only portfolio</p>
                    </div>
                  </div>

                  {/* FAQ */}
                  <div className="pt-6" style={{borderTop: `1px solid ${theme.border}`}}>
                    <h4 className="font-semibold mb-3" style={{color: theme.error}}>Frequently Asked Questions</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold" style={{color: theme.textSecondary}}>Q: What can nominees see?</p>
                        <p className="text-xs" style={{color: theme.textTertiary}}>A: Nominees get read-only access to all your assets, documents, digital will, and other nominees. They cannot edit or delete anything.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{color: theme.textSecondary}}>Q: What's the difference between Immediate and After DMS?</p>
                        <p className="text-xs" style={{color: theme.textTertiary}}>A: <strong>Immediate</strong> grants access right away (useful for trusted family). <strong>After DMS</strong> only grants access if you're inactive beyond your Dead Man's Switch threshold.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{color: theme.textSecondary}}>Q: Can I revoke access?</p>
                        <p className="text-xs" style={{color: theme.textTertiary}}>A: Yes! Click "Revoke Access" anytime to immediately disable their access token.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{color: theme.textSecondary}}>Q: Is the access link secure?</p>
                        <p className="text-xs" style={{color: theme.textTertiary}}>A: Yes! Each link contains a unique 32-character cryptographically secure token. Only share via secure channels.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why This Matters */}

            {/* Info Card */}
            <Card style={{background: theme.cardBg, borderColor: theme.error, borderLeftWidth: '4px'}}>
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <Heart className="w-6 h-6 flex-shrink-0" style={{color: theme.error}} />
                  <div>
                    <h3 className="font-semibold mb-2" style={{color: theme.error}}>Why Multiple Nominees?</h3>
                    <p className="text-sm leading-relaxed" style={{color: theme.textSecondary}}>
                      Having multiple nominees with priority order ensures that if your primary nominee is unavailable, 
                      the system will automatically reach out to your backup nominees. This redundancy protects your 
                      family's access to your financial information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'will':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{color: theme.text}}>
                <FileText className="w-7 h-7" />
                Will & Testament
              </h2>
              <p style={{color: theme.textTertiary}}>Manage your digital will and asset distribution</p>
            </div>

            <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
              <CardContent className="py-6">
                <p className="text-center mb-4" style={{color: theme.textSecondary}}>
                  Access your complete Will & Testament management
                </p>
                <div className="flex justify-center">
                  <Button 
                    onClick={() => window.location.href = '/will'}
                    style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: '#fff'}}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Go to Digital Will
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card style={{background: 'rgba(168, 85, 247, 0.1)', borderColor: '#a855f7'}}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.2)'}}>
                    <FileText className="w-5 h-5" style={{color: '#a855f7'}} />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1" style={{color: theme.text}}>What You Can Do</h4>
                    <ul className="space-y-1 text-sm" style={{color: theme.textSecondary}}>
                      <li>• Create and edit your will document</li>
                      <li>• Add beneficiaries with contact information</li>
                      <li>• Specify asset distribution instructions</li>
                      <li>• Securely store and update your wishes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'dms':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{color: theme.text}}>
                <Clock className="w-7 h-7" />
                Dead Man's Switch
              </h2>
              <p style={{color: theme.textTertiary}}>Automatic notifications if you become inactive</p>
            </div>

            {/* Visual Explanation */}
            <Card style={{background: theme.cardBg, borderColor: theme.primary, borderWidth: '2px'}}>
              <CardContent className="py-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{background: 'rgba(168, 85, 247, 0.2)'}}>
                    <AlertTriangle className="w-10 h-10" style={{color: theme.primary}} />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{color: theme.text}}>How Dead Man's Switch Works</h3>
                  <p className="text-sm max-w-2xl mb-6" style={{color: theme.textSecondary}}>
                    A safeguard that protects your family by automatically alerting them if you're inactive for an extended period.
                  </p>
                  
                  {/* Timeline Visual */}
                  <div className="w-full max-w-3xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { day: dmsForm.inactivity_days, label: 'Inactive Days', icon: Clock, color: theme.textMuted },
                        { day: dmsForm.reminder_1_days, label: 'First Reminder', icon: Bell, color: '#f59e0b' },
                        { day: dmsForm.reminder_2_days, label: 'Second Reminder', icon: Bell, color: '#ef4444' },
                        { day: dmsForm.reminder_3_days, label: 'Final Alert & Notify Nominees', icon: AlertTriangle, color: '#dc2626' }
                      ].map((step, index) => {
                        const StepIcon = step.icon;
                        return (
                          <div key={index} className="text-center">
                            <div 
                              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                              style={{background: `${step.color}20`, border: `2px solid ${step.color}`}}
                            >
                              <StepIcon className="w-8 h-8" style={{color: step.color}} />
                            </div>
                            <div className="text-2xl font-bold mb-1" style={{color: step.color}}>
                              Day {step.day}
                            </div>
                            <div className="text-xs" style={{color: theme.textTertiary}}>
                              {step.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive DMS Toggle - Cool Design */}
            <Card style={{
              background: dmsForm.is_active 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
              borderColor: dmsForm.is_active ? '#10b981' : '#4b5563',
              borderWidth: '2px',
              transition: 'all 0.3s ease'
            }}>
              <CardContent className="py-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        background: dmsForm.is_active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                        transform: dmsForm.is_active ? 'scale(1.1)' : 'scale(1)'
                      }}
                    >
                      {dmsForm.is_active ? (
                        <Shield className="w-8 h-8" style={{color: '#fff'}} />
                      ) : (
                        <AlertTriangle className="w-8 h-8" style={{color: '#9ca3af'}} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1" style={{color: '#fff'}}>
                        Dead Man's Switch {dmsForm.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </h3>
                      <p className="text-sm" style={{color: 'rgba(255,255,255,0.8)'}}>
                        {dmsForm.is_active 
                          ? 'Your family is protected. We\'ll alert them if you\'re inactive.' 
                          : 'Protection disabled. Your family won\'t be notified during inactivity.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <div 
                      onClick={() => setDmsForm({ ...dmsForm, is_active: !dmsForm.is_active })}
                      className="cursor-pointer relative w-20 h-10 rounded-full transition-all duration-300"
                      style={{
                        background: dmsForm.is_active ? '#059669' : '#4b5563',
                        boxShadow: dmsForm.is_active 
                          ? '0 0 20px rgba(16, 185, 129, 0.5)' 
                          : '0 0 10px rgba(0,0,0,0.2)'
                      }}
                    >
                      <div 
                        className="absolute top-1 w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center"
                        style={{
                          left: dmsForm.is_active ? '44px' : '4px',
                          background: '#fff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        {dmsForm.is_active ? (
                          <span style={{fontSize: '16px'}}>✓</span>
                        ) : (
                          <span style={{fontSize: '16px', color: '#9ca3af'}}>×</span>
                        )}
                      </div>
                    </div>
                    
                    {dmsForm.is_active && (
                      <div 
                        className="px-3 py-1 rounded-full text-xs font-bold animate-pulse"
                        style={{background: 'rgba(255,255,255,0.2)', color: '#fff'}}
                      >
                        🛡️ PROTECTED
                      </div>
                    )}
                  </div>
                </div>
                
                {!dmsForm.is_active && (
                  <div className="mt-4 p-4 rounded-lg" style={{background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)'}}>
                    <p className="text-sm" style={{color: 'rgba(255,255,255,0.9)'}}>
                      ⚠️ <strong>Warning:</strong> With Dead Man's Switch disabled, your nominees will NOT be notified if you become inactive. We strongly recommend keeping this enabled for your family's protection.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DMS Configuration */}
            <form onSubmit={handleDmsSubmit}>
              <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
                <CardHeader>
                  <CardTitle style={{color: theme.text}}>Configure Timing</CardTitle>
                  <CardDescription style={{color: theme.textTertiary}}>
                    Set when you should receive reminders and when nominees should be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-slate-300 flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4" />
                        Inactivity Threshold (days) *
                      </Label>
                      <Input
                        type="number"
                        value={dmsForm.inactivity_days}
                        onChange={(e) => setDmsForm({ ...dmsForm, inactivity_days: parseInt(e.target.value) })}
                        min="30"
                        max="365"
                        required
                        style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}
                      />
                      <p className="text-xs mt-1" style={{color: theme.textMuted}}>
                        Number of days of inactivity before triggering alerts
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-slate-300 flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4" style={{color: '#f59e0b'}} />
                        First Reminder (days)
                      </Label>
                      <Input
                        type="number"
                        value={dmsForm.reminder_1_days}
                        onChange={(e) => setDmsForm({ ...dmsForm, reminder_1_days: parseInt(e.target.value) })}
                        min="1"
                        max={dmsForm.inactivity_days - 1}
                        required
                        style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}
                      />
                      <p className="text-xs mt-1" style={{color: theme.textMuted}}>
                        Email reminder to check in
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-slate-300 flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4" style={{color: '#ef4444'}} />
                        Second Reminder (days)
                      </Label>
                      <Input
                        type="number"
                        value={dmsForm.reminder_2_days}
                        onChange={(e) => setDmsForm({ ...dmsForm, reminder_2_days: parseInt(e.target.value) })}
                        min={dmsForm.reminder_1_days + 1}
                        max={dmsForm.inactivity_days - 1}
                        required
                        style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}
                      />
                      <p className="text-xs mt-1" style={{color: theme.textMuted}}>
                        Urgent reminder to check in
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-slate-300 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" style={{color: '#dc2626'}} />
                        Final Warning (days)
                      </Label>
                      <Input
                        type="number"
                        value={dmsForm.reminder_3_days}
                        onChange={(e) => setDmsForm({ ...dmsForm, reminder_3_days: parseInt(e.target.value) })}
                        min={dmsForm.reminder_2_days + 1}
                        max={dmsForm.inactivity_days - 1}
                        required
                        style={{background: theme.backgroundTertiary, borderColor: theme.border, color: theme.text}}
                      />
                      <p className="text-xs mt-1" style={{color: theme.textMuted}}>
                        Last chance before notifying nominees
                      </p>
                    </div>
                  </div>

                  {dms && (
                    <div className="p-4 rounded-lg" style={{background: theme.backgroundTertiary, border: `1px solid ${theme.border}`}}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold mb-1" style={{color: theme.text}}>Last Activity</p>
                          <p className="text-sm" style={{color: theme.textTertiary}}>
                            {dms.last_reset ? new Date(dms.last_reset).toLocaleString() : 'Never'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={resetLastActivity}
                          size="sm"
                          style={{background: theme.info, color: '#fff'}}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          I'm Active
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <Button type="submit" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: '#fff'}}>
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>
            </form>

            {/* Info Card */}
            <Card style={{background: theme.cardBg, borderColor: theme.error, borderLeftWidth: '4px'}}>
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 flex-shrink-0" style={{color: theme.error}} />
                  <div>
                    <h3 className="font-semibold mb-2" style={{color: theme.error}}>Why This Matters</h3>
                    <ul className="text-sm space-y-2" style={{color: theme.textSecondary}}>
                      <li>• <strong>Life is unpredictable:</strong> Accidents, health emergencies, or sudden events can happen anytime</li>
                      <li>• <strong>Protect your legacy:</strong> Without this, your assets could be lost forever to your family</li>
                      <li>• <strong>Peace of mind:</strong> Know that your loved ones will be notified and can access important information</li>
                      <li>• <strong>You stay in control:</strong> Simply log in to reset the timer and prevent false alarms</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'appearance':
        return <AppearanceSection />;

      case 'demo':
        return <DemoDataSection />;

      case 'security':
        return <SecurityAuditSection user={user} />;

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{color: theme.text}}>Privacy & Consent</h2>
              <p style={{color: theme.textTertiary}}>Manage your data preferences</p>
            </div>
            
            <form onSubmit={handlePreferencesSubmit}>
              <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
                <CardHeader>
                  <CardTitle style={{color: theme.text}}>Communication Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg" style={{background: theme.backgroundTertiary}}>
                    <div className="flex-1">
                      <p className="font-semibold" style={{color: theme.text}}>Marketing Communications</p>
                      <p className="text-sm" style={{color: theme.textTertiary}}>Receive updates about new features and offers</p>
                    </div>
                    <Switch 
                      checked={preferencesForm.marketing_consent}
                      onCheckedChange={(checked) => setPreferencesForm({...preferencesForm, marketing_consent: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg" style={{background: theme.backgroundTertiary}}>
                    <div className="flex-1">
                      <p className="font-semibold" style={{color: theme.text}}>Important Communications</p>
                      <p className="text-sm" style={{color: theme.textTertiary}}>Security alerts and account notifications (recommended)</p>
                    </div>
                    <Switch 
                      checked={preferencesForm.communication_consent}
                      onCheckedChange={(checked) => setPreferencesForm({...preferencesForm, communication_consent: checked})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button 
                type="submit"
                className="text-white rounded-full mt-6"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
              >
                Save Privacy Preferences
              </Button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="flex gap-6 h-full" style={{padding: '2rem 1.5rem', margin: '0 auto', maxWidth: '1600px'}}>
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-24">
            <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {SECTIONS.map(section => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left"
                        style={{
                          background: isActive ? 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)' : 'transparent',
                          color: isActive ? '#f8fafc' : '#94a3b8'
                        }}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {renderSection()}
        </div>
      </div>
    </Layout>
  );
}
