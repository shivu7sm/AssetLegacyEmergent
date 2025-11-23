import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileText, Plus, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DigitalWill() {
  const [loading, setLoading] = useState(true);
  const [will, setWill] = useState(null);
  const [willText, setWillText] = useState('');
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [assetDistribution, setAssetDistribution] = useState({});

  useEffect(() => {
    fetchWill();
  }, []);

  const fetchWill = async () => {
    try {
      const response = await axios.get(`${API}/will`, { withCredentials: true });
      if (response.data) {
        setWill(response.data);
        setWillText(response.data.will_text || '');
        setBeneficiaries(response.data.beneficiaries || []);
        setAssetDistribution(response.data.asset_distribution || {});
      }
    } catch (error) {
      console.error('Failed to fetch will:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post(`${API}/will`, {
        will_text: willText,
        beneficiaries,
        asset_distribution: assetDistribution
      }, { withCredentials: true });
      toast.success('Digital will saved successfully');
      fetchWill();
    } catch (error) {
      console.error('Failed to save will:', error);
      toast.error('Failed to save digital will');
    }
  };

  const addBeneficiary = () => {
    setBeneficiaries([...beneficiaries, { name: '', email: '', phone: '', relationship: '' }]);
  };

  const updateBeneficiary = (index, field, value) => {
    const updated = [...beneficiaries];
    updated[index][field] = value;
    setBeneficiaries(updated);
  };

  const removeBeneficiary = (index) => {
    setBeneficiaries(beneficiaries.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-xl" style={{color: '#94a3b8'}}>Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            Digital Will
          </h1>
          <p style={{color: '#94a3b8'}}>Create and manage your digital will for asset distribution</p>
        </div>

        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardHeader>
            <CardTitle style={{color: '#f8fafc'}}>
              <FileText className="w-6 h-6 inline mr-2" />
              Will Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label style={{color: '#94a3b8'}}>Your Will Text</Label>
              <Textarea
                value={willText}
                onChange={(e) => setWillText(e.target.value)}
                placeholder="I, [Your Name], being of sound mind, do hereby declare this to be my Last Will and Testament..."
                rows={10}
                className="mt-2"
                style={{background: '#0f0a1e', borderColor: '#2d1f3d', color: '#f8fafc'}}
              />
              <p className="text-xs mt-2" style={{color: '#64748b'}}>
                Write your will in detail. This will be shared with your nominee when the dead man switch activates.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle style={{color: '#f8fafc'}}>Beneficiaries</CardTitle>
              <Button
                onClick={addBeneficiary}
                className="text-white"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Beneficiary
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {beneficiaries.length === 0 ? (
              <p style={{color: '#94a3b8'}}>No beneficiaries added yet. Click "Add Beneficiary" to start.</p>
            ) : (
              beneficiaries.map((beneficiary, index) => (
                <Card key={index} style={{background: '#0f0a1e', borderColor: '#2d1f3d'}}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label style={{color: '#94a3b8'}}>Name</Label>
                        <Input
                          value={beneficiary.name}
                          onChange={(e) => updateBeneficiary(index, 'name', e.target.value)}
                          placeholder="Full Name"
                          style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}
                        />
                      </div>
                      <div>
                        <Label style={{color: '#94a3b8'}}>Email</Label>
                        <Input
                          value={beneficiary.email}
                          onChange={(e) => updateBeneficiary(index, 'email', e.target.value)}
                          placeholder="email@example.com"
                          style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}
                        />
                      </div>
                      <div>
                        <Label style={{color: '#94a3b8'}}>Phone</Label>
                        <Input
                          value={beneficiary.phone}
                          onChange={(e) => updateBeneficiary(index, 'phone', e.target.value)}
                          placeholder="+1234567890"
                          style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}
                        />
                      </div>
                      <div>
                        <Label style={{color: '#94a3b8'}}>Relationship</Label>
                        <Input
                          value={beneficiary.relationship}
                          onChange={(e) => updateBeneficiary(index, 'relationship', e.target.value)}
                          placeholder="Son, Daughter, Spouse"
                          style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => removeBeneficiary(index)}
                      variant="outline"
                      className="mt-4"
                      style={{borderColor: '#ef4444', color: '#ef4444'}}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            size="lg"
            className="text-white"
            style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
          >
            Save Digital Will
          </Button>
        </div>
      </div>
    </Layout>
  );
}
