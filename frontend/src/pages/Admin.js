import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Users, Package, CreditCard, Clock, AlertCircle, Sparkles, 
  Shield, RefreshCw, Trash2, CheckCircle, XCircle, Timer 
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [dmsReminders, setDmsReminders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, jobs, analytics, audit

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, messagesRes, dmsRes, analyticsRes, auditRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/users?limit=100`, { withCredentials: true }),
        axios.get(`${API}/admin/jobs/scheduled-messages`, { withCredentials: true }),
        axios.get(`${API}/admin/jobs/dms-reminders`, { withCredentials: true }),
        axios.get(`${API}/admin/subscription-analytics`, { withCredentials: true }),
        axios.get(`${API}/admin/audit-logs?limit=50`, { withCredentials: true })
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setScheduledMessages(messagesRes.data.messages);
      setDmsReminders(dmsRes.data.dms_reminders);
      setAnalytics(analyticsRes.data);
      setAuditLogs(auditRes.data.logs);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error('Failed to load admin data');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await axios.put(
        `${API}/admin/users/${userId}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      toast.success('User role updated successfully');
      fetchAllData();
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error(error.response?.data?.detail || 'Failed to update user role');
    }
  };

  const deleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This will delete all their data and cannot be undone.`)) {
      return;
    }
    
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { withCredentials: true });
      toast.success('User deleted successfully');
      fetchAllData();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-400 text-xl">Loading admin panel...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            Admin Dashboard
          </h1>
          <p style={{color: '#94a3b8'}}>Platform management and monitoring</p>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            onClick={fetchAllData}
            className="text-white rounded-full"
            style={{background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'}}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b overflow-x-auto" style={{borderColor: '#2d1f3d'}}>
          <button
            onClick={() => setActiveTab('overview')}
            className="px-6 py-3 font-semibold transition-all whitespace-nowrap"
            style={{
              color: activeTab === 'overview' ? '#ec4899' : '#94a3b8',
              borderBottom: activeTab === 'overview' ? '2px solid #ec4899' : 'none'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className="px-6 py-3 font-semibold transition-all whitespace-nowrap"
            style={{
              color: activeTab === 'users' ? '#ec4899' : '#94a3b8',
              borderBottom: activeTab === 'users' ? '2px solid #ec4899' : 'none'
            }}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className="px-6 py-3 font-semibold transition-all whitespace-nowrap"
            style={{
              color: activeTab === 'analytics' ? '#ec4899' : '#94a3b8',
              borderBottom: activeTab === 'analytics' ? '2px solid #ec4899' : 'none'
            }}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className="px-6 py-3 font-semibold transition-all whitespace-nowrap"
            style={{
              color: activeTab === 'jobs' ? '#ec4899' : '#94a3b8',
              borderBottom: activeTab === 'jobs' ? '2px solid #ec4899' : 'none'
            }}
          >
            Scheduled Jobs
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className="px-6 py-3 font-semibold transition-all whitespace-nowrap"
            style={{
              color: activeTab === 'audit' ? '#ec4899' : '#94a3b8',
              borderBottom: activeTab === 'audit' ? '2px solid #ec4899' : 'none'
            }}
          >
            Audit Logs
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#3b82f6'}}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2" style={{color: '#94a3b8'}}>TOTAL USERS</p>
                      <div className="text-4xl font-bold mb-1" style={{color: '#3b82f6'}}>{stats.users.total}</div>
                      <p className="text-xs" style={{color: '#64748b'}}>+{stats.users.recent_30_days} in last 30 days</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
                      <Users className="w-8 h-8" style={{color: '#3b82f6'}} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#10b981'}}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2" style={{color: '#94a3b8'}}>TOTAL ASSETS</p>
                      <div className="text-4xl font-bold mb-1" style={{color: '#10b981'}}>{stats.assets.total}</div>
                      <p className="text-xs" style={{color: '#64748b'}}>across all users</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{background: 'rgba(16, 185, 129, 0.1)'}}>
                      <Package className="w-8 h-8" style={{color: '#10b981'}} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#ec4899'}}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2" style={{color: '#94a3b8'}}>SUBSCRIPTIONS</p>
                      <div className="text-4xl font-bold mb-1" style={{color: '#ec4899'}}>
                        {(stats.users.by_subscription?.Pro || 0) + (stats.users.by_subscription?.Family || 0)}
                      </div>
                      <p className="text-xs" style={{color: '#64748b'}}>Pro: {stats.users.by_subscription?.Pro || 0}, Family: {stats.users.by_subscription?.Family || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{background: 'rgba(236, 72, 153, 0.1)'}}>
                      <CreditCard className="w-8 h-8" style={{color: '#ec4899'}} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#a855f7'}}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2" style={{color: '#94a3b8'}}>AI INSIGHTS</p>
                      <div className="text-4xl font-bold mb-1" style={{color: '#a855f7'}}>{stats.ai_insights.total_generated}</div>
                      <p className="text-xs" style={{color: '#64748b'}}>total generated</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{background: 'rgba(168, 85, 247, 0.1)'}}>
                      <Sparkles className="w-8 h-8" style={{color: '#a855f7'}} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Asset Distribution */}
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <CardTitle style={{color: '#f8fafc'}}>Asset Distribution by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(stats.assets.by_type || {}).map(([type, count]) => (
                    <div key={type} className="p-4 rounded-lg" style={{background: '#16001e'}}>
                      <div className="text-2xl font-bold mb-1" style={{color: '#10b981'}}>{count}</div>
                      <div className="text-sm capitalize" style={{color: '#94a3b8'}}>{type.replace('_', ' ')}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Scheduled Messages Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>Scheduled Messages Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg" style={{background: '#16001e'}}>
                      <span style={{color: '#94a3b8'}}>Pending</span>
                      <span className="font-bold" style={{color: '#f59e0b'}}>{stats.scheduled_messages.pending}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg" style={{background: '#16001e'}}>
                      <span style={{color: '#94a3b8'}}>Sent</span>
                      <span className="font-bold" style={{color: '#10b981'}}>{stats.scheduled_messages.sent}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg" style={{background: '#16001e'}}>
                      <span style={{color: '#94a3b8'}}>Failed</span>
                      <span className="font-bold" style={{color: '#ef4444'}}>{stats.scheduled_messages.failed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>Dead Man Switch Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg" style={{background: '#16001e'}}>
                      <span style={{color: '#94a3b8'}}>Total Configured</span>
                      <span className="font-bold" style={{color: '#3b82f6'}}>{stats.dead_man_switches.total}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg" style={{background: '#16001e'}}>
                      <span style={{color: '#94a3b8'}}>Active</span>
                      <span className="font-bold" style={{color: '#10b981'}}>{stats.dead_man_switches.active}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardHeader>
              <CardTitle style={{color: '#f8fafc'}}>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{borderBottom: '2px solid #2d1f3d'}}>
                      <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>USER</th>
                      <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>EMAIL</th>
                      <th className="text-center py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>ROLE</th>
                      <th className="text-center py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>PLAN</th>
                      <th className="text-center py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>ASSETS</th>
                      <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>JOINED</th>
                      <th className="text-center py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={{borderBottom: '1px solid #1a1229'}}>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {user.picture && (
                              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                            )}
                            <span style={{color: '#f8fafc', fontWeight: 500}}>{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2" style={{color: '#94a3b8'}}>{user.email}</td>
                        <td className="py-3 px-2 text-center">
                          <Select
                            value={user.role}
                            onValueChange={(value) => updateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-32 mx-auto" style={{borderColor: '#2d1f3d'}}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="readonly">Readonly</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: user.subscription_plan === 'Free' ? '#16001e' : 
                                         user.subscription_plan === 'Pro' ? 'rgba(236, 72, 153, 0.2)' : 
                                         'rgba(168, 85, 247, 0.2)',
                              color: user.subscription_plan === 'Free' ? '#94a3b8' : 
                                     user.subscription_plan === 'Pro' ? '#ec4899' : '#a855f7'
                            }}
                          >
                            {user.subscription_plan || 'Free'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center" style={{color: '#10b981', fontWeight: 600}}>
                          {user.asset_count}
                        </td>
                        <td className="py-3 px-2" style={{color: '#94a3b8', fontSize: '13px'}}>
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {user.role !== 'admin' && (
                            <Button
                              onClick={() => deleteUser(user.id, user.email)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Scheduled Messages */}
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" style={{color: '#f59e0b'}} />
                  <CardTitle style={{color: '#f8fafc'}}>Scheduled Messages</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {scheduledMessages.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{borderBottom: '2px solid #2d1f3d'}}>
                          <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>RECIPIENT</th>
                          <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>SUBJECT</th>
                          <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>SEND DATE</th>
                          <th className="text-center py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduledMessages.map((msg) => (
                          <tr key={msg.id} style={{borderBottom: '1px solid #1a1229'}}>
                            <td className="py-3 px-2">
                              <div>
                                <div style={{color: '#f8fafc', fontWeight: 500}}>{msg.recipient_name}</div>
                                <div style={{color: '#64748b', fontSize: '12px'}}>{msg.recipient_email}</div>
                              </div>
                            </td>
                            <td className="py-3 px-2" style={{color: '#94a3b8'}}>{msg.subject}</td>
                            <td className="py-3 px-2" style={{color: '#94a3b8', fontSize: '13px'}}>{msg.send_date}</td>
                            <td className="py-3 px-2 text-center">
                              {msg.status === 'sent' && <CheckCircle className="w-5 h-5 mx-auto" style={{color: '#10b981'}} />}
                              {msg.status === 'scheduled' && <Clock className="w-5 h-5 mx-auto" style={{color: '#f59e0b'}} />}
                              {msg.status === 'failed' && <XCircle className="w-5 h-5 mx-auto" style={{color: '#ef4444'}} />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{color: '#94a3b8', textAlign: 'center', padding: '2rem'}}>No scheduled messages</p>
                )}
              </CardContent>
            </Card>

            {/* DMS Reminders */}
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" style={{color: '#a855f7'}} />
                  <CardTitle style={{color: '#f8fafc'}}>Dead Man Switch Monitoring</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {dmsReminders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{borderBottom: '2px solid #2d1f3d'}}>
                          <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>USER</th>
                          <th className="text-center py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>DAYS INACTIVE</th>
                          <th className="text-center py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>DAYS UNTIL TRIGGER</th>
                          <th className="text-center py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>REMINDERS SENT</th>
                          <th className="text-center py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dmsReminders.map((dms) => (
                          <tr key={dms.id} style={{borderBottom: '1px solid #1a1229'}}>
                            <td className="py-3 px-2">
                              <div>
                                <div style={{color: '#f8fafc', fontWeight: 500}}>{dms.user_name}</div>
                                <div style={{color: '#64748b', fontSize: '12px'}}>{dms.user_email}</div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span 
                                className="px-3 py-1 rounded-full text-sm font-semibold"
                                style={{
                                  background: dms.days_inactive > 60 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                  color: dms.days_inactive > 60 ? '#ef4444' : '#10b981'
                                }}
                              >
                                {dms.days_inactive}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span 
                                className="px-3 py-1 rounded-full text-sm font-semibold"
                                style={{
                                  background: dms.days_until_trigger < 10 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                  color: dms.days_until_trigger < 10 ? '#f59e0b' : '#3b82f6'
                                }}
                              >
                                {dms.days_until_trigger}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center" style={{color: '#94a3b8', fontWeight: 600}}>
                              {dms.reminders_sent}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {dms.is_active ? (
                                <CheckCircle className="w-5 h-5 mx-auto" style={{color: '#10b981'}} />
                              ) : (
                                <XCircle className="w-5 h-5 mx-auto" style={{color: '#64748b'}} />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{color: '#94a3b8', textAlign: 'center', padding: '2rem'}}>No DMS configured</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#10b981'}}>
                <CardContent className="p-6">
                  <p className="text-sm font-medium mb-2" style={{color: '#94a3b8'}}>MONTHLY RECURRING REVENUE</p>
                  <div className="text-4xl font-bold" style={{color: '#10b981'}}>
                    ${analytics.monthly_recurring_revenue}
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#3b82f6'}}>
                <CardContent className="p-6">
                  <p className="text-sm font-medium mb-2" style={{color: '#94a3b8'}}>ANNUAL RECURRING REVENUE</p>
                  <div className="text-4xl font-bold" style={{color: '#3b82f6'}}>
                    ${analytics.annual_recurring_revenue}
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#ec4899'}}>
                <CardContent className="p-6">
                  <p className="text-sm font-medium mb-2" style={{color: '#94a3b8'}}>PAID SUBSCRIBERS</p>
                  <div className="text-4xl font-bold" style={{color: '#ec4899'}}>
                    {analytics.total_paid_subscribers}
                  </div>
                  <p className="text-xs mt-1" style={{color: '#64748b'}}>+{analytics.recent_subscriptions_30d} this month</p>
                </CardContent>
              </Card>
            </div>

            {/* Current Subscriptions Breakdown */}
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <CardTitle style={{color: '#f8fafc'}}>Current Subscription Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(analytics.current_subscriptions).map(([plan, count]) => (
                    <div key={plan} className="p-4 rounded-lg text-center" style={{background: '#16001e'}}>
                      <div className="text-3xl font-bold mb-2" style={{
                        color: plan === 'Free' ? '#64748b' : plan === 'Pro' ? '#ec4899' : '#a855f7'
                      }}>
                        {count}
                      </div>
                      <div className="text-sm" style={{color: '#94a3b8'}}>{plan}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <CardTitle style={{color: '#f8fafc'}}>12-Month Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.revenue_trend_12_months.slice(-6).map((month, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 text-sm" style={{color: '#94a3b8'}}>{month.month}</div>
                      <div className="flex-1">
                        <div className="h-8 rounded-lg flex items-center px-3" style={{
                          background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                          width: `${(month.revenue / Math.max(...analytics.revenue_trend_12_months.map(m => m.revenue))) * 100}%`,
                          minWidth: '60px'
                        }}>
                          <span className="text-sm font-semibold text-white">${month.revenue}</span>
                        </div>
                      </div>
                      <div className="w-20 text-sm text-right" style={{color: '#64748b'}}>
                        {month.subscribers} subs
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" style={{color: '#a855f7'}} />
                <CardTitle style={{color: '#f8fafc'}}>Audit Logs</CardTitle>
              </div>
              <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Track all system changes and admin actions</p>
            </CardHeader>
            <CardContent>
              {auditLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{borderBottom: '2px solid #2d1f3d'}}>
                        <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>TIME</th>
                        <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>USER</th>
                        <th className="text-center py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>ACTION</th>
                        <th className="text-center py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>RESOURCE</th>
                        <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>IP ADDRESS</th>
                        <th className="text-left py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>DETAILS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr 
                          key={log.id} 
                          style={{
                            borderBottom: '1px solid #1a1229',
                            background: log.is_admin_action ? 'rgba(168, 85, 247, 0.1)' : 'transparent'
                          }}
                        >
                          <td className="py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <div style={{color: '#f8fafc', fontWeight: 500}}>{log.user_email}</div>
                              {log.is_admin_action && (
                                <span className="text-xs px-2 py-1 rounded-full" style={{background: '#a855f7', color: '#fff'}}>
                                  ADMIN
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span 
                              className="px-3 py-1 rounded-full text-xs font-semibold"
                              style={{
                                background: log.action === 'CREATE' ? 'rgba(16, 185, 129, 0.2)' : 
                                           log.action === 'DELETE' ? 'rgba(239, 68, 68, 0.2)' : 
                                           'rgba(59, 130, 246, 0.2)',
                                color: log.action === 'CREATE' ? '#10b981' : 
                                       log.action === 'DELETE' ? '#ef4444' : '#3b82f6'
                              }}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center" style={{color: '#cbd5e1'}}>
                            {log.resource_type}
                          </td>
                          <td className="py-3 px-2" style={{color: '#64748b', fontSize: '12px', fontFamily: 'monospace'}}>
                            {log.ip_address || 'N/A'}
                          </td>
                          <td className="py-3 px-2" style={{color: '#94a3b8', fontSize: '12px'}}>
                            {log.changes ? JSON.stringify(log.changes).substring(0, 50) + '...' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{color: '#94a3b8', textAlign: 'center', padding: '2rem'}}>No audit logs found</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
