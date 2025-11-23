import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { User, Settings as SettingsIcon, Eye, Globe, Shield, CreditCard, Users, Clock, RefreshCw, Link } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Eye },
  { id: 'connected', label: 'Connected Accounts', icon: Link },
  { id: 'subscription', label: 'Subscription & Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'privacy', label: 'Privacy & Consent', icon: Globe }
];

export default function Settings() {
  const { selectedCurrency, currencyFormat, preferences, loadPreferences } = useApp();
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState(null);
  const [nominee, setNominee] = useState(null);
  const [dms, setDms] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [nomineeForm, setNomineeForm] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: ''
  });
  
  const [dmsForm, setDmsForm] = useState({
    inactivity_days: 90,
    reminder_1_days: 60,
    reminder_2_days: 75,
    reminder_3_days: 85
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

  const fetchData = async () => {
    try {
      const [userRes, nomineeRes, dmsRes, subRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { withCredentials: true }),
        axios.get(`${API}/nominee`, { withCredentials: true }),
        axios.get(`${API}/dms`, { withCredentials: true }),
        axios.get(`${API}/subscription/current`, { withCredentials: true })
      ]);
      
      setUser(userRes.data);
      setSubscription(subRes.data);
      
      if (nomineeRes.data) {
        setNominee(nomineeRes.data);
        setNomineeForm({
          name: nomineeRes.data.name,
          email: nomineeRes.data.email,
          phone: nomineeRes.data.phone || '',
          relationship: nomineeRes.data.relationship || ''
        });
      }
      
      if (dmsRes.data) {
        setDms(dmsRes.data);
        setDmsForm({
          inactivity_days: dmsRes.data.inactivity_days,
          reminder_1_days: dmsRes.data.reminder_1_days,
          reminder_2_days: dmsRes.data.reminder_2_days,
          reminder_3_days: dmsRes.data.reminder_3_days
        });
      }

      if (preferences) {
        setPreferencesForm({
          measurement_unit: preferences.measurement_unit || 'imperial',
          weight_unit: preferences.weight_unit || 'ounce',
          currency_format: preferences.currency_format || 'standard',
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
      await axios.post(`${API}/nominee`, nomineeForm, { withCredentials: true });
      toast.success('Nominee saved successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to save nominee:', error);
      toast.error('Failed to save nominee');
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
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{color: '#f8fafc'}}>Subscription & Billing</h2>
              <p style={{color: '#94a3b8'}}>Manage your subscription plan</p>
            </div>
            
            <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#a855f7'}}>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{color: '#94a3b8'}}>Current Plan</p>
                    <h3 className="text-3xl font-bold mt-1" style={{color: '#f8fafc'}}>{subscription?.plan || 'Free'}</h3>
                  </div>
                  <CreditCard className="w-12 h-12" style={{color: '#a855f7'}} />
                </div>
              </CardContent>
            </Card>

            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <CardTitle style={{color: '#f8fafc'}}>Plan Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4" style={{color: '#94a3b8'}}>View all available plans and manage your subscription</p>
                <Button
                  onClick={() => window.location.href = '/subscription'}
                  className="text-white rounded-full"
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                >
                  View Subscription Plans
                </Button>
              </CardContent>
            </Card>
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
