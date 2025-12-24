import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { Clock, Shield, Bell, Mail, Phone, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DeadManSwitch() {
  const { theme } = useTheme();
  const [dms, setDms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    inactivity_days: 90,
    reminder_1_days: 60,
    reminder_2_days: 75,
    reminder_3_days: 85,
    reminder_method: 'email',
    is_active: true
  });

  useEffect(() => {
    fetchDMS();
  }, []);

  const fetchDMS = async () => {
    try {
      const response = await axios.get(`${API}/dms`, { withCredentials: true });
      if (response.data) {
        setDms(response.data);
        setFormData({
          inactivity_days: response.data.inactivity_days,
          reminder_1_days: response.data.reminder_1_days,
          reminder_2_days: response.data.reminder_2_days,
          reminder_3_days: response.data.reminder_3_days,
          reminder_method: response.data.reminder_method || 'email',
          is_active: response.data.is_active !== false
        });
      }
    } catch (error) {
      console.error('Failed to fetch DMS:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Backend only supports POST for create or update
      await axios.post(`${API}/dms`, formData, { withCredentials: true });
      toast.success(dms ? 'Dead Man\'s Switch updated successfully' : 'Dead Man\'s Switch activated successfully');
      fetchDMS();
    } catch (error) {
      console.error('Failed to save DMS:', error);
      toast.error('Failed to save Dead Man\'s Switch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6" style={{padding: '1.5rem 0'}}>
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3" style={{color: theme.text, fontFamily: 'Space Grotesk, sans-serif'}}>
            <Clock className="w-8 h-8" />
            Dead Man&apos;s Switch
          </h1>
          <p className="text-base sm:text-lg" style={{color: theme.textSecondary}}>
            Automatic notifications to your nominees if you&apos;re inactive for too long
          </p>
        </div>

        {/* Info Card */}
        <Card style={{background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: '2px'}}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 mt-0.5" style={{color: '#ef4444'}} />
              <div>
                <h3 className="font-semibold mb-2" style={{color: theme.text}}>
                  How Dead Man&apos;s Switch Protects Your Family
                </h3>
                <p className="text-sm mb-3" style={{color: theme.textSecondary}}>
                  If you don&apos;t log in for the specified days, we&apos;ll send reminders. If you still don&apos;t respond, 
                  your nominees are automatically notified and granted access to your asset information. 
                  This ensures your family can find and claim everything, even during the most difficult times.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs" style={{color: theme.textSecondary}}>
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" style={{color: '#fbbf24'}} />
                    <span>Reminder alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{color: '#3b82f6'}} />
                    <span>Email/Phone notify</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" style={{color: '#10b981'}} />
                    <span>Auto access grant</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Configuration */}
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardHeader>
              <CardTitle style={{color: theme.text}}>Notification Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 block">
                  Reminder 1 (After Days of Inactivity)
                </Label>
                <Input
                  type="number"
                  value={formData.reminder_1_days}
                  onChange={(e) => setFormData({ ...formData, reminder_1_days: parseInt(e.target.value) })}
                  min="1"
                  max={formData.reminder_2_days - 1}
                  style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                />
                <p className="text-xs mt-1" style={{color: theme.textSecondary}}>
                  First reminder sent to you
                </p>
              </div>

              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 block">
                  Reminder 2 (After Days of Inactivity)
                </Label>
                <Input
                  type="number"
                  value={formData.reminder_2_days}
                  onChange={(e) => setFormData({ ...formData, reminder_2_days: parseInt(e.target.value) })}
                  min={formData.reminder_1_days + 1}
                  max={formData.reminder_3_days - 1}
                  style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                />
                <p className="text-xs mt-1" style={{color: theme.textSecondary}}>
                  Second reminder sent to you
                </p>
              </div>

              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 block">
                  Reminder 3 (After Days of Inactivity)
                </Label>
                <Input
                  type="number"
                  value={formData.reminder_3_days}
                  onChange={(e) => setFormData({ ...formData, reminder_3_days: parseInt(e.target.value) })}
                  min={formData.reminder_2_days + 1}
                  max={formData.inactivity_days - 1}
                  style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                />
                <p className="text-xs mt-1" style={{color: theme.textSecondary}}>
                  Final reminder sent to you
                </p>
              </div>

              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 block">
                  Trigger Day (Notify Nominees)
                </Label>
                <Input
                  type="number"
                  value={formData.inactivity_days}
                  onChange={(e) => setFormData({ ...formData, inactivity_days: parseInt(e.target.value) })}
                  min={formData.reminder_3_days + 1}
                  max="365"
                  style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                />
                <p className="text-xs mt-1" style={{color: '#ef4444'}}>
                  ⚠️ On day {formData.inactivity_days}, if you haven&apos;t responded, your nominees will be notified and granted access
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardHeader>
              <CardTitle style={{color: theme.text}}>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label style={{color: theme.textSecondary}} className="mb-3 block">
                  Reminder Method
                </Label>
                <Select 
                  value={formData.reminder_method} 
                  onValueChange={(value) => setFormData({ ...formData, reminder_method: value })}
                >
                  <SelectTrigger style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                    <SelectItem value="email" style={{color: theme.text}}>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="phone" style={{color: theme.text}}>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>Phone (SMS)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp" style={{color: theme.text}}>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="telegram" style={{color: theme.text}}>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>Telegram</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="all" style={{color: theme.text}}>
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        <span>All Methods</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{background: theme.backgroundSecondary}}>
                <div>
                  <Label style={{color: theme.text}} className="font-semibold">
                    Enable Dead Man&apos;s Switch
                  </Label>
                  <p className="text-xs mt-1" style={{color: theme.textSecondary}}>
                    Activate automatic monitoring and notifications
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full text-white font-medium"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Visualization */}
        {formData.is_active && (
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardHeader>
              <CardTitle style={{color: theme.text}}>Your Protection Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{background: theme.border}} />
                  
                  {/* Day 0 */}
                  <div className="relative flex gap-4 pb-8">
                    <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="font-semibold mb-1" style={{color: theme.text}}>Today - Active</h4>
                      <p className="text-sm" style={{color: theme.textSecondary}}>
                        You&apos;re logged in. Timer resets with each login.
                      </p>
                    </div>
                  </div>

                  {/* Reminder 1 */}
                  <div className="relative flex gap-4 pb-8">
                    <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'}}>
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="font-semibold mb-1" style={{color: theme.text}}>Day {formData.reminder_1_days} - First Reminder</h4>
                      <p className="text-sm" style={{color: theme.textSecondary}}>
                        We&apos;ll send you a gentle reminder to check in
                      </p>
                    </div>
                  </div>

                  {/* Reminder 2 */}
                  <div className="relative flex gap-4 pb-8">
                    <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)'}}>
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="font-semibold mb-1" style={{color: theme.text}}>Day {formData.reminder_2_days} - Second Reminder</h4>
                      <p className="text-sm" style={{color: theme.textSecondary}}>
                        Another reminder - we&apos;re getting concerned
                      </p>
                    </div>
                  </div>

                  {/* Reminder 3 */}
                  <div className="relative flex gap-4 pb-8">
                    <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)'}}>
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="font-semibold mb-1" style={{color: theme.text}}>Day {formData.reminder_3_days} - Final Reminder</h4>
                      <p className="text-sm" style={{color: theme.textSecondary}}>
                        Last chance to check in before we notify your nominees
                      </p>
                    </div>
                  </div>

                  {/* Day 90 - Trigger */}
                  <div className="relative flex gap-4">
                    <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'}}>
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="font-semibold mb-1" style={{color: '#ef4444'}}>Day {formData.inactivity_days} - Nominees Notified</h4>
                      <p className="text-sm mb-2" style={{color: theme.textSecondary}}>
                        Your nominees will be notified and granted access to your asset information
                      </p>
                      <div className="p-3 rounded-lg" style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)'}}>
                        <p className="text-xs" style={{color: '#ef4444'}}>
                          ⚠️ This is when your family protection activates. They&apos;ll receive complete asset details, 
                          bank information, and instructions to claim everything.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card style={{background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)'}}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 mt-0.5" style={{color: '#3b82f6'}} />
              <div>
                <h3 className="font-semibold mb-2" style={{color: theme.text}}>Important Notes</h3>
                <ul className="text-sm space-y-1" style={{color: theme.textSecondary}}>
                  <li>• Timer resets automatically every time you log in</li>
                  <li>• You can pause the Dead Man&apos;s Switch anytime (toggle above)</li>
                  <li>• Day {formData.inactivity_days} is the final trigger - your nominees will be contacted</li>
                  <li>• Make sure your nominees are added and their contact information is current</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
