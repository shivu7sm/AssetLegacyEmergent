import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Users, Clock, Shield, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Settings() {
  const [user, setUser] = useState(null);
  const [nominee, setNominee] = useState(null);
  const [dms, setDms] = useState(null);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, nomineeRes, dmsRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { withCredentials: true }),
        axios.get(`${API}/nominee`, { withCredentials: true }),
        axios.get(`${API}/dms`, { withCredentials: true })
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

  const handleResetTimer = async () => {
    try {
      await axios.post(`${API}/dms/reset`, {}, { withCredentials: true });
      toast.success('Timer reset successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to reset timer:', error);
      toast.error('Failed to reset timer');
    }
  };

  const getDaysRemaining = () => {
    if (!dms?.last_reset) return null;
    
    const lastReset = new Date(dms.last_reset);
    const now = new Date();
    const daysPassed = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
    const daysRemaining = dms.inactivity_days - daysPassed;
    
    return { daysPassed, daysRemaining };
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

  const timerInfo = getDaysRemaining();

  return (
    <Layout>
      <div className="space-y-8" data-testid="settings-container">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            Settings
          </h1>
          <p className="text-slate-400">Manage your profile, nominee, and security settings</p>
        </div>

        {/* User Profile */}
        <Card className="bg-slate-800/50 border-slate-700" data-testid="profile-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-emerald-500" />
              <CardTitle className="text-white">Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {user?.picture && (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <div className="text-lg font-semibold text-white" data-testid="user-name">{user?.name}</div>
                <div className="text-slate-400" data-testid="user-email">{user?.email}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nominee Configuration */}
        <Card className="bg-slate-800/50 border-slate-700" data-testid="nominee-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-emerald-500" />
              <div>
                <CardTitle className="text-white">Nominee</CardTitle>
                <CardDescription className="text-slate-400">
                  Designate a trusted person to receive your asset information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNomineeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nominee-name" className="text-slate-300">Full Name *</Label>
                  <Input
                    id="nominee-name"
                    data-testid="nominee-name-input"
                    value={nomineeForm.name}
                    onChange={(e) => setNomineeForm({ ...nomineeForm, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nominee-email" className="text-slate-300">Email *</Label>
                  <Input
                    id="nominee-email"
                    data-testid="nominee-email-input"
                    type="email"
                    value={nomineeForm.email}
                    onChange={(e) => setNomineeForm({ ...nomineeForm, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nominee-phone" className="text-slate-300">Phone</Label>
                  <Input
                    id="nominee-phone"
                    data-testid="nominee-phone-input"
                    value={nomineeForm.phone}
                    onChange={(e) => setNomineeForm({ ...nomineeForm, phone: e.target.value })}
                    placeholder="+1234567890"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nominee-relationship" className="text-slate-300">Relationship</Label>
                  <Input
                    id="nominee-relationship"
                    data-testid="nominee-relationship-input"
                    value={nomineeForm.relationship}
                    onChange={(e) => setNomineeForm({ ...nomineeForm, relationship: e.target.value })}
                    placeholder="Spouse, Child, etc."
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
              
              <Button 
                data-testid="save-nominee-btn"
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {nominee ? 'Update Nominee' : 'Save Nominee'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Dead Man Switch */}
        <Card className="bg-slate-800/50 border-slate-700" data-testid="dms-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-emerald-500" />
              <div>
                <CardTitle className="text-white">Dead Man Switch</CardTitle>
                <CardDescription className="text-slate-400">
                  Automatic asset information transfer after prolonged inactivity
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {dms && timerInfo && (
              <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-300">Current Status</div>
                  <div className="text-emerald-400 font-semibold">Active</div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-slate-300">Days Remaining</div>
                  <div className="text-2xl font-bold text-white" data-testid="days-remaining">
                    {timerInfo.daysRemaining} days
                  </div>
                </div>
                <Button 
                  data-testid="reset-timer-btn"
                  onClick={handleResetTimer}
                  variant="outline"
                  className="w-full border-emerald-600 text-emerald-400 hover:bg-emerald-900/30"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Timer
                </Button>
              </div>
            )}
            
            <form onSubmit={handleDmsSubmit} className="space-y-4">
              <div>
                <Label htmlFor="inactivity-days" className="text-slate-300">Inactivity Threshold (days)</Label>
                <Input
                  id="inactivity-days"
                  data-testid="inactivity-days-input"
                  type="number"
                  min="30"
                  max="365"
                  value={dmsForm.inactivity_days}
                  onChange={(e) => setDmsForm({ ...dmsForm, inactivity_days: parseInt(e.target.value) })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Nominee will be contacted after this many days of inactivity
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="reminder-1" className="text-slate-300">Reminder 1</Label>
                  <Input
                    id="reminder-1"
                    data-testid="reminder-1-input"
                    type="number"
                    min="1"
                    value={dmsForm.reminder_1_days}
                    onChange={(e) => setDmsForm({ ...dmsForm, reminder_1_days: parseInt(e.target.value) })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="reminder-2" className="text-slate-300">Reminder 2</Label>
                  <Input
                    id="reminder-2"
                    data-testid="reminder-2-input"
                    type="number"
                    min="1"
                    value={dmsForm.reminder_2_days}
                    onChange={(e) => setDmsForm({ ...dmsForm, reminder_2_days: parseInt(e.target.value) })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="reminder-3" className="text-slate-300">Reminder 3</Label>
                  <Input
                    id="reminder-3"
                    data-testid="reminder-3-input"
                    type="number"
                    min="1"
                    value={dmsForm.reminder_3_days}
                    onChange={(e) => setDmsForm({ ...dmsForm, reminder_3_days: parseInt(e.target.value) })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
              <p className="text-sm text-slate-500">
                You'll receive reminders at these day intervals to reset the timer
              </p>
              
              <Button 
                data-testid="save-dms-btn"
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {dms ? 'Update Configuration' : 'Activate Dead Man Switch'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-900/20 border-blue-800/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">How it Works</h3>
                <ul className="text-slate-300 space-y-2 text-sm">
                  <li>• The system tracks your login activity automatically</li>
                  <li>• You'll receive email reminders before the final deadline</li>
                  <li>• Simply logging in resets the timer</li>
                  <li>• After the threshold, your nominee receives secure access to your asset list</li>
                  <li>• All data is encrypted and protected with bank-grade security</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
