import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar, Plus, Trash2, Mail, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ScheduleMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_email: '',
    subject: '',
    message: '',
    send_date: '',
    occasion: ''
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/scheduled-messages`, { withCredentials: true });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load scheduled messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(
        `${API}/scheduled-messages`,
        formData,
        { withCredentials: true }
      );
      toast.success('Message scheduled successfully');
      setDialogOpen(false);
      resetForm();
      fetchMessages();
    } catch (error) {
      console.error('Failed to schedule message:', error);
      toast.error('Failed to schedule message');
    }
  };

  const handleDelete = async (messageId) => {
    if (!confirm('Are you sure you want to delete this scheduled message?')) return;
    
    try {
      await axios.delete(`${API}/scheduled-messages/${messageId}`, { withCredentials: true });
      toast.success('Message deleted');
      fetchMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  const resetForm = () => {
    setFormData({
      recipient_name: '',
      recipient_email: '',
      subject: '',
      message: '',
      send_date: '',
      occasion: ''
    });
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <Layout>
      <div className="space-y-8" style={{padding: '2rem 1.5rem', margin: '0 auto', maxWidth: '1600px'}}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
              Scheduled Messages
            </h1>
            <p style={{color: '#94a3b8'}}>Schedule messages to be sent to your loved ones in the future</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="text-white rounded-full"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <DialogHeader>
                <DialogTitle style={{color: '#f8fafc'}}>Schedule a New Message</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Recipient Name *</Label>
                    <Input
                      value={formData.recipient_name}
                      onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                      placeholder="John Doe"
                      required
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Recipient Email *</Label>
                    <Input
                      type="email"
                      value={formData.recipient_email}
                      onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                      placeholder="john@example.com"
                      required
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Occasion</Label>
                    <Input
                      value={formData.occasion}
                      onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                      placeholder="Birthday, Anniversary, etc."
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Send Date *</Label>
                    <Input
                      type="date"
                      min={getMinDate()}
                      value={formData.send_date}
                      onChange={(e) => setFormData({ ...formData, send_date: e.target.value })}
                      required
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Subject *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Happy Birthday!"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Message *</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write your message here..."
                    required
                    rows={6}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="text-white rounded-full"
                    style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                  >
                    Schedule Message
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-16">
              <div className="text-center" style={{color: '#94a3b8'}}>Loading...</div>
            </CardContent>
          </Card>
        ) : messages.length === 0 ? (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-16">
              <div className="text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4" style={{color: '#2d1f3d'}} />
                <h3 className="text-xl font-semibold mb-2" style={{color: '#f8fafc'}}>No Scheduled Messages</h3>
                <p className="mb-6" style={{color: '#94a3b8'}}>Schedule messages for future occasions and special moments</p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="text-white rounded-full"
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Your First Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {messages.map((message) => (
              <Card key={message.id} style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5" style={{color: '#ec4899'}} />
                      <div>
                        <CardTitle className="text-lg" style={{color: '#f8fafc'}}>
                          {message.recipient_name}
                        </CardTitle>
                        <p className="text-sm" style={{color: '#94a3b8'}}>{message.recipient_email}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {message.occasion && (
                      <div className="flex items-center gap-2 text-sm">
                        <span style={{color: '#94a3b8'}}>Occasion:</span>
                        <span style={{color: '#f8fafc'}}>{message.occasion}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" style={{color: '#a855f7'}} />
                      <span style={{color: '#94a3b8'}}>Send Date:</span>
                      <span style={{color: '#f8fafc'}}>
                        {new Date(message.send_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{color: '#f8fafc'}}>{message.subject}</p>
                      <p className="text-sm line-clamp-3" style={{color: '#94a3b8'}}>{message.message}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-3" style={{borderTop: '1px solid #2d1f3d'}}>
                      <span 
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: message.status === 'sent' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                          color: message.status === 'sent' ? '#10b981' : '#a855f7'
                        }}
                      >
                        {message.status === 'sent' ? 'Sent' : 'Scheduled'}
                      </span>
                      {message.status !== 'sent' && (
                        <Button
                          onClick={() => handleDelete(message.id)}
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          style={{borderColor: '#ef4444', color: '#ef4444'}}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
