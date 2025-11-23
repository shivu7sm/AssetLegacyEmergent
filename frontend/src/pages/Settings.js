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
import { User, Users, Clock, Shield, RefreshCw, Settings as SettingsIcon, Globe, Eye } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Settings() {
  const [user, setUser] = useState(null);
  const [nominee, setNominee] = useState(null);
  const [dms, setDms] = useState(null);
  const [preferences, setPreferences] = useState(null);
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
    default_asset_view: 'grid',
    marketing_consent: false,
    communication_consent: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, nomineeRes, dmsRes, prefsRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { withCredentials: true }),
        axios.get(`${API}/nominee`, { withCredentials: true }),
        axios.get(`${API}/dms`, { withCredentials: true }),
        axios.get(`${API}/user/preferences`, { withCredentials: true })
      ]);
      
      setUser(userRes.data);
      
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

      if (prefsRes.data) {
        setPreferences(prefsRes.data);
        setPreferencesForm(prefsRes.data);
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
      // Reload page to apply currency format changes
      window.location.reload();
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

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            Settings
          </h1>
          <p style={{color: '#94a3b8'}}>Manage your account and preferences</p>
        </div>

        {/* User Profile */}
        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5" style={{color: '#ec4899'}} />
              <CardTitle style={{color: '#f8fafc'}}>Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {user?.picture && (
                <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full" />
              )}
              <div>
                <p className="text-lg font-semibold" style={{color: '#f8fafc'}}>{user?.name}</p>
                <p style={{color: '#94a3b8'}}>{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display & View Preferences */}
        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5" style={{color: '#a855f7'}} />
              <CardTitle style={{color: '#f8fafc'}}>Display Preferences</CardTitle>
            </div>
            <CardDescription style={{color: '#94a3b8'}}>Customize how you view your assets and data</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div>
                  <Label className="text-slate-300">Default Asset View</Label>
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
                </div>

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

              <Button 
                type="submit"
                className="text-white rounded-full"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
              >
                Save Display Preferences
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Consent Management */}
        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" style={{color: '#10b981'}} />
              <CardTitle style={{color: '#f8fafc'}}>Consent & Privacy</CardTitle>
            </div>
            <CardDescription style={{color: '#94a3b8'}}>Manage your communication and data preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
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
                  <p className="text-sm" style={{color: '#94a3b8'}}>Security alerts and account notifications</p>
                </div>
                <Switch 
                  checked={preferencesForm.communication_consent}
                  onCheckedChange={(checked) => setPreferencesForm({...preferencesForm, communication_consent: checked})}
                />
              </div>

              <Button 
                type="submit"
                className="text-white rounded-full"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
              >
                Save Privacy Preferences
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Nominee Settings */}
        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" style={{color: '#ec4899'}} />
              <CardTitle style={{color: '#f8fafc'}}>Nominee</CardTitle>
            </div>
            <CardDescription style={{color: '#94a3b8'}}>The person who will be notified in case of prolonged inactivity</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNomineeSubmit} className="space-y-4">
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
                    placeholder="Spouse, Parent, Child, etc."
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
            </form>
          </CardContent>
        </Card>

        {/* Dead Man Switch */}
        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" style={{color: '#a855f7'}} />
              <CardTitle style={{color: '#f8fafc'}}>Dead Man Switch</CardTitle>
            </div>
            <CardDescription style={{color: '#94a3b8'}}>Automatic notification system triggered by inactivity</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDmsSubmit} className="space-y-4">
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
                  Reset Activity Timer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
