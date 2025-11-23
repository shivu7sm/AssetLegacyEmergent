import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { User, Settings as SettingsIcon, Eye, Globe, Shield, CreditCard, Users, Clock, RefreshCw, Link, Bell, AlertTriangle, ChevronUp, ChevronDown, Trash2, Heart } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Eye },
  { id: 'nominees', label: 'Nominees', icon: Users },
  { id: 'dms', label: 'Dead Man\'s Switch', icon: Clock },
  { id: 'connected', label: 'Connected Accounts', icon: Link },
  { id: 'subscription', label: 'Subscription & Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'privacy', label: 'Privacy & Consent', icon: Globe }
];

export default function Settings() {
  const { selectedCurrency, currencyFormat, preferences, loadPreferences } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(searchParams.get('tab') || 'profile');
  const [user, setUser] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [dms, setDms] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
  }, []);

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
              <h2 className="text-2xl font-bold mb-2" style={{color: '#f8fafc'}}>Profile</h2>
              <p style={{color: '#94a3b8'}}>Your account information</p>
            </div>
            
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardContent className="py-6">
                <div className="flex items-center gap-6">
                  {user?.picture && (
                    <img src={user.picture} alt={user.name} className="w-20 h-20 rounded-full" />
                  )}
                  <div>
                    <p className="text-2xl font-semibold mb-1" style={{color: '#f8fafc'}}>{user?.name}</p>
                    <p className="text-lg" style={{color: '#94a3b8'}}>{user?.email}</p>
                    <p className="text-sm mt-2" style={{color: '#64748b'}}>Member since {new Date(user?.created_at).toLocaleDateString()}</p>
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
              <h2 className="text-2xl font-bold mb-2" style={{color: '#f8fafc'}}>Display Preferences</h2>
              <p style={{color: '#94a3b8'}}>Customize how you view your data</p>
            </div>
            
            <form onSubmit={handlePreferencesSubmit} className="space-y-6">
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>Currency & Format</CardTitle>
                  <CardDescription style={{color: '#94a3b8'}}>Set your default currency and format preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Default Currency</Label>
                    <Select 
                      value={preferencesForm.default_currency || 'USD'} 
                      onValueChange={(value) => setPreferencesForm({...preferencesForm, default_currency: value})}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
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
                    <p className="text-xs mt-1" style={{color: '#64748b'}}>This will be your default currency when you log in</p>
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Currency Format</Label>
                    <Select 
                      value={preferencesForm.currency_format} 
                      onValueChange={(value) => setPreferencesForm({...preferencesForm, currency_format: value})}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="standard" className="text-white">Standard (1,000,000)</SelectItem>
                        <SelectItem value="indian" className="text-white">Indian (10,00,000 / Lakhs & Crores)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs mt-1" style={{color: '#64748b'}}>Change how currency amounts are displayed</p>
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>Assets View</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Default View</Label>
                    <Select 
                      value={preferencesForm.default_asset_view} 
                      onValueChange={(value) => setPreferencesForm({...preferencesForm, default_asset_view: value})}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="grid" className="text-white">Grid View</SelectItem>
                        <SelectItem value="table" className="text-white">Table View</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs mt-1" style={{color: '#64748b'}}>Choose your default assets view layout</p>
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>Measurement Units</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Area Unit</Label>
                      <Select 
                        value={preferencesForm.measurement_unit} 
                        onValueChange={(value) => setPreferencesForm({...preferencesForm, measurement_unit: value})}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="imperial" className="text-white">Imperial (sqft)</SelectItem>
                          <SelectItem value="metric" className="text-white">Metric (sqmt)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-300">Weight Unit</Label>
                      <Select 
                        value={preferencesForm.weight_unit} 
                        onValueChange={(value) => setPreferencesForm({...preferencesForm, weight_unit: value})}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
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
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{color: '#f8fafc'}}>Connected Accounts</h2>
              <p style={{color: '#94a3b8'}}>Manage your bank and exchange connections</p>
            </div>
            
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardContent className="py-16">
                <div className="text-center">
                  <Link className="w-16 h-16 mx-auto mb-4" style={{color: '#2d1f3d'}} />
                  <h3 className="text-xl font-semibold mb-2" style={{color: '#f8fafc'}}>No Connected Accounts</h3>
                  <p className="mb-6" style={{color: '#94a3b8'}}>Connect your banks, brokers, and exchanges for automatic sync</p>
                  <Button
                    className="text-white rounded-full"
                    style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Connect Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'subscription':
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
              <h2 className="text-2xl font-bold mb-2" style={{color: '#f8fafc'}}>Subscription & Billing</h2>
              <p style={{color: '#94a3b8'}}>Manage your subscription plan and billing information</p>
            </div>
            
            {/* Detailed Subscription Card */}
            <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#a855f7'}}>
              <CardContent className="py-6">
                <div className="flex items-start justify-between flex-wrap gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <p className="text-sm" style={{color: '#94a3b8'}}>Current Plan</p>
                      {hasActiveSubscription && getStatusIcon(subDetails.status)}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold" style={{color: '#f8fafc'}}>{currentPlan}</h3>
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
                          <span style={{color: '#94a3b8'}}>Status:</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                            background: subDetails.status === 'active' ? '#10b98120' : '#ef444420',
                            color: subDetails.status === 'active' ? '#10b981' : '#ef4444'
                          }}>
                            {subDetails.status === 'active' ? 'Active' : subDetails.cancel_at ? 'Canceling' : 'Inactive'}
                          </span>
                        </div>

                        {/* Subscription Start Date */}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" style={{color: '#94a3b8'}} />
                          <span style={{color: '#94a3b8'}}>Started:</span>
                          <span style={{color: '#f8fafc'}}>{formatDate(subDetails.created)}</span>
                        </div>

                        {/* Current Billing Period */}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" style={{color: '#94a3b8'}} />
                          <span style={{color: '#94a3b8'}}>Current Period:</span>
                          <span style={{color: '#f8fafc'}}>
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
                              <p className="text-xs" style={{color: '#94a3b8'}}>
                                Access until {formatDate(subDetails.cancel_at)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            <RefreshCw className="w-4 h-4" style={{color: '#94a3b8'}} />
                            <span style={{color: '#94a3b8'}}>Next Renewal:</span>
                            <span style={{color: '#10b981', fontWeight: 600}}>
                              {formatDate(subDetails.current_period_end)}
                            </span>
                          </div>
                        )}

                        {/* Auto Renewal Status */}
                        <div className="flex items-center gap-2 text-sm">
                          <RefreshCw className="w-4 h-4" style={{color: '#94a3b8'}} />
                          <span style={{color: '#94a3b8'}}>Auto-Renewal:</span>
                          <span style={{color: subDetails.cancel_at ? '#ef4444' : '#10b981', fontWeight: 600}}>
                            {subDetails.cancel_at ? 'Disabled' : 'Enabled'}
                          </span>
                        </div>

                        {/* Payment Method */}
                        {subDetails.payment_method && (
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="w-4 h-4" style={{color: '#94a3b8'}} />
                            <span style={{color: '#94a3b8'}}>Payment Method:</span>
                            <span style={{color: '#f8fafc'}}>
                              {subDetails.payment_method.brand.toUpperCase()} ••••{subDetails.payment_method.last4}
                            </span>
                            <span className="text-xs" style={{color: '#64748b'}}>
                              (Expires {subDetails.payment_method.exp_month}/{subDetails.payment_method.exp_year})
                            </span>
                          </div>
                        )}

                        {/* Billing Amount */}
                        <div className="flex items-center gap-2 text-sm">
                          <span style={{color: '#94a3b8'}}>Amount:</span>
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
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>Current Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Assets Usage */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span style={{color: '#94a3b8'}}>Assets</span>
                        <span style={{color: '#f8fafc', fontWeight: 600}}>
                          {subscription.usage.assets} / {subscription.features.max_assets > 0 ? subscription.features.max_assets : '∞'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{background: '#16001e'}}>
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
                        <span style={{color: '#94a3b8'}}>Documents</span>
                        <span style={{color: '#f8fafc', fontWeight: 600}}>
                          {subscription.usage.documents} / {subscription.features.max_documents > 0 ? subscription.features.max_documents : '∞'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{background: '#16001e'}}>
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
                        <span style={{color: '#94a3b8'}}>Storage</span>
                        <span style={{color: '#f8fafc', fontWeight: 600}}>
                          {subscription.features.storage_mb >= 1024 
                            ? `${(subscription.usage.storage_mb / 1024).toFixed(2)} GB / ${(subscription.features.storage_mb / 1024).toFixed(0)} GB`
                            : `${subscription.usage.storage_mb.toFixed(1)} MB / ${subscription.features.storage_mb} MB`
                          }
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{background: '#16001e'}}>
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

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{color: '#f8fafc'}}>Security Settings</h2>
              <p style={{color: '#94a3b8'}}>Protect your assets and data</p>
            </div>
            
            <form onSubmit={handleNomineeSubmit}>
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}} className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Nominee Configuration
                  </CardTitle>
                  <CardDescription style={{color: '#94a3b8'}}>Person to be notified in case of prolonged inactivity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Name *</Label>
                      <Input
                        value={nomineeForm.name}
                        onChange={(e) => setNomineeForm({...nomineeForm, name: e.target.value})}
                        placeholder="John Doe"
                        required
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Email *</Label>
                      <Input
                        type="email"
                        value={nomineeForm.email}
                        onChange={(e) => setNomineeForm({...nomineeForm, email: e.target.value})}
                        placeholder="john@example.com"
                        required
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Phone</Label>
                      <Input
                        value={nomineeForm.phone}
                        onChange={(e) => setNomineeForm({...nomineeForm, phone: e.target.value})}
                        placeholder="+1 (555) 000-0000"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Relationship</Label>
                      <Input
                        value={nomineeForm.relationship}
                        onChange={(e) => setNomineeForm({...nomineeForm, relationship: e.target.value})}
                        placeholder="Spouse, Parent, etc."
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit"
                    className="text-white rounded-full"
                    style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                  >
                    {nominee ? 'Update Nominee' : 'Save Nominee'}
                  </Button>
                </CardContent>
              </Card>
            </form>

            <form onSubmit={handleDmsSubmit}>
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}} className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Dead Man Switch
                  </CardTitle>
                  <CardDescription style={{color: '#94a3b8'}}>Automatic notification triggered by inactivity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Inactivity Period (days)</Label>
                      <Input
                        type="number"
                        value={dmsForm.inactivity_days}
                        onChange={(e) => setDmsForm({...dmsForm, inactivity_days: parseInt(e.target.value)})}
                        min="30"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">First Reminder (days)</Label>
                      <Input
                        type="number"
                        value={dmsForm.reminder_1_days}
                        onChange={(e) => setDmsForm({...dmsForm, reminder_1_days: parseInt(e.target.value)})}
                        min="1"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Second Reminder (days)</Label>
                      <Input
                        type="number"
                        value={dmsForm.reminder_2_days}
                        onChange={(e) => setDmsForm({...dmsForm, reminder_2_days: parseInt(e.target.value)})}
                        min="1"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Final Reminder (days)</Label>
                      <Input
                        type="number"
                        value={dmsForm.reminder_3_days}
                        onChange={(e) => setDmsForm({...dmsForm, reminder_3_days: parseInt(e.target.value)})}
                        min="1"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      type="submit"
                      className="text-white rounded-full"
                      style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                    >
                      {dms ? 'Update DMS' : 'Configure DMS'}
                    </Button>
                    <Button 
                      type="button"
                      onClick={resetLastActivity}
                      variant="outline"
                      className="rounded-full"
                      style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{color: '#f8fafc'}}>Privacy & Consent</h2>
              <p style={{color: '#94a3b8'}}>Manage your data preferences</p>
            </div>
            
            <form onSubmit={handlePreferencesSubmit}>
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>Communication Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg" style={{background: '#16001e'}}>
                    <div className="flex-1">
                      <p className="font-semibold" style={{color: '#f8fafc'}}>Marketing Communications</p>
                      <p className="text-sm" style={{color: '#94a3b8'}}>Receive updates about new features and offers</p>
                    </div>
                    <Switch 
                      checked={preferencesForm.marketing_consent}
                      onCheckedChange={(checked) => setPreferencesForm({...preferencesForm, marketing_consent: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg" style={{background: '#16001e'}}>
                    <div className="flex-1">
                      <p className="font-semibold" style={{color: '#f8fafc'}}>Important Communications</p>
                      <p className="text-sm" style={{color: '#94a3b8'}}>Security alerts and account notifications (recommended)</p>
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
      <div className="flex gap-6 h-full">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-24">
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
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
