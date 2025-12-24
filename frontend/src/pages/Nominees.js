import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { Users, Plus, Mail, Phone, User, Trash2, ChevronUp, ChevronDown, Shield, Heart, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Nominees() {
  const { theme } = useTheme();
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNomineeId, setEditingNomineeId] = useState(null);
  const [nomineeForm, setNomineeForm] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    priority: 1
  });

  useEffect(() => {
    fetchNominees();
  }, []);

  const fetchNominees = async () => {
    try {
      const response = await axios.get(`${API}/nominees`, { withCredentials: true });
      if (response.data && Array.isArray(response.data)) {
        setNominees(response.data.sort((a, b) => a.priority - b.priority));
      }
    } catch (error) {
      console.error('Failed to fetch nominees:', error);
      toast.error('Failed to load nominees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
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
      setDialogOpen(false);
      fetchNominees();
    } catch (error) {
      console.error('Failed to save nominee:', error);
      toast.error('Failed to save nominee');
    }
  };

  const handleEdit = (nominee) => {
    setNomineeForm({
      name: nominee.name,
      email: nominee.email,
      phone: nominee.phone || '',
      relationship: nominee.relationship || '',
      priority: nominee.priority
    });
    setEditingNomineeId(nominee.id);
    setDialogOpen(true);
  };

  const handleDelete = async (nomineeId) => {
    if (!window.confirm('Are you sure you want to delete this nominee?')) return;
    
    try {
      await axios.delete(`${API}/nominees/${nomineeId}`, { withCredentials: true });
      toast.success('Nominee deleted successfully');
      fetchNominees();
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

    try {
      await Promise.all(
        updatedNominees.map((nominee, idx) => 
          axios.put(`${API}/nominees/${nominee.id}`, { ...nominee, priority: idx + 1 }, { withCredentials: true })
        )
      );
      fetchNominees();
      toast.success('Priority updated');
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority');
    }
  };

  return (
    <Layout>
      <div className="space-y-6" style={{padding: '1.5rem 0'}}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3" style={{color: theme.text, fontFamily: 'Space Grotesk, sans-serif'}}>
              <Users className="w-8 h-8" />
              Nominees & Beneficiaries
            </h1>
            <p className="text-base sm:text-lg" style={{color: theme.textSecondary}}>
              Designate trusted individuals to inherit your assets and receive emergency notifications
            </p>
          </div>
          
          <Button 
            onClick={() => {
              setEditingNomineeId(null);
              setNomineeForm({ name: '', email: '', phone: '', relationship: '', priority: nominees.length + 1 });
              setDialogOpen(true);
            }}
            className="text-white font-medium"
            style={{background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'}}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Nominee
          </Button>
        </div>

        {/* Legacy Protection Message */}
        <Card style={{background: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)', borderWidth: '2px'}}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 mt-0.5" style={{color: '#a855f7'}} />
              <div>
                <h3 className="font-semibold mb-2" style={{color: theme.text}}>
                  Why Nominees Matter
                </h3>
                <p className="text-sm" style={{color: theme.textSecondary}}>
                  In uncertain times, your nominees will be notified by our Dead Man&apos;s Switch and granted access to your asset information. 
                  They&apos;ll know what you own, where it&apos;s located, and how to claim it. This prevents the ₹20,000 crores lost annually because families don&apos;t know what to look for.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nominees List */}
        {loading ? (
          <div className="text-center py-12" style={{color: theme.textSecondary}}>Loading nominees...</div>
        ) : nominees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nominees.map((nominee, index) => (
              <Card key={nominee.id} style={{background: theme.cardBg, borderColor: theme.border}}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'}}>
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg" style={{color: theme.text}}>{nominee.name}</CardTitle>
                        {nominee.relationship && (
                          <p className="text-xs mt-1" style={{color: theme.textSecondary}}>
                            {nominee.relationship}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMovePriority(nominee.id, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-opacity-20 disabled:opacity-30"
                        style={{background: theme.backgroundSecondary}}
                      >
                        <ChevronUp className="w-4 h-4" style={{color: theme.textSecondary}} />
                      </button>
                      <button
                        onClick={() => handleMovePriority(nominee.id, 'down')}
                        disabled={index === nominees.length - 1}
                        className="p-1 rounded hover:bg-opacity-20 disabled:opacity-30"
                        style={{background: theme.backgroundSecondary}}
                      >
                        <ChevronDown className="w-4 h-4" style={{color: theme.textSecondary}} />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm" style={{color: theme.textSecondary}}>
                    <Mail className="w-4 h-4" />
                    <span>{nominee.email}</span>
                  </div>
                  {nominee.phone && (
                    <div className="flex items-center gap-2 text-sm" style={{color: theme.textSecondary}}>
                      <Phone className="w-4 h-4" />
                      <span>{nominee.phone}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t flex justify-between" style={{borderColor: theme.border}}>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7'}}>
                      Priority #{nominee.priority}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(nominee)}
                        style={{borderColor: theme.border, color: theme.text}}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(nominee.id)}
                        style={{borderColor: '#ef4444', color: '#ef4444'}}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4" style={{color: theme.textSecondary, opacity: 0.5}} />
              <h3 className="text-xl font-semibold mb-2" style={{color: theme.text}}>No Nominees Added Yet</h3>
              <p className="mb-6" style={{color: theme.textSecondary}}>
                Add trusted individuals who will be notified and given access to your asset information in case of emergencies
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="text-white font-medium"
                style={{background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'}}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Nominee
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg" style={{background: theme.cardBg, borderColor: theme.border}}>
            <DialogHeader>
              <DialogTitle style={{color: theme.text, fontSize: '1.5rem'}}>
                {editingNomineeId ? 'Edit Nominee' : 'Add New Nominee'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{color: theme.textSecondary}}>Name *</Label>
                  <Input
                    value={nomineeForm.name}
                    onChange={(e) => setNomineeForm({ ...nomineeForm, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                  />
                </div>
                <div>
                  <Label style={{color: theme.textSecondary}}>Relationship</Label>
                  <Select 
                    value={nomineeForm.relationship} 
                    onValueChange={(value) => setNomineeForm({ ...nomineeForm, relationship: value })}
                  >
                    <SelectTrigger style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                      <SelectItem value="spouse" style={{color: theme.text}}>Spouse</SelectItem>
                      <SelectItem value="parent" style={{color: theme.text}}>Parent</SelectItem>
                      <SelectItem value="child" style={{color: theme.text}}>Child</SelectItem>
                      <SelectItem value="sibling" style={{color: theme.text}}>Sibling</SelectItem>
                      <SelectItem value="friend" style={{color: theme.text}}>Friend</SelectItem>
                      <SelectItem value="lawyer" style={{color: theme.text}}>Lawyer</SelectItem>
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
                  style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                />
              </div>
              
              <div>
                <Label style={{color: theme.textSecondary}}>Phone</Label>
                <Input
                  type="tel"
                  value={nomineeForm.phone}
                  onChange={(e) => setNomineeForm({ ...nomineeForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit"
                  className="flex-1 text-white"
                  style={{background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'}}
                >
                  {editingNomineeId ? 'Update' : 'Add'} Nominee
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingNomineeId(null);
                  }}
                  style={{borderColor: theme.border, color: theme.textSecondary}}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
