import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, DollarSign, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ASSET_TYPES = [
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿', hasQuantity: true },
  { value: 'stock', label: 'Stocks', icon: '📈', hasQuantity: true },
  { value: 'gold', label: 'Gold', icon: '🥇', hasWeight: true },
  { value: 'silver', label: 'Silver', icon: '⚪', hasWeight: true },
  { value: 'property', label: 'Real Estate', icon: '🏠', hasArea: true },
  { value: 'bank', label: 'Bank Account', icon: '🏦' },
  { value: 'investment', label: 'Investment', icon: '💰', hasMaturity: true },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'loan', label: 'Loan', icon: '💸', isLiability: true },
  { value: 'credit_card', label: 'Credit Card', icon: '💳', isLiability: true },
  { value: 'locker', label: 'Safe/Locker', icon: '🔐' },
  { value: 'diamond', label: 'Diamond/Jewelry', icon: '💎' }
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'];
const AREA_UNITS = ['sqft', 'sqmt', 'yard', 'acre'];
const WEIGHT_UNITS = ['gram', 'kilogram', 'ounce', 'pound'];

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    type: 'crypto',
    name: '',
    quantity: '',
    unit_price: '',
    total_value: '',
    symbol: '',
    weight: '',
    weight_unit: 'gram',
    purity: '',
    area: '',
    area_unit: 'sqft',
    price_per_area: '',
    location: { address: '', lat: '', lng: '' },
    principal_amount: '',
    interest_rate: '',
    tenure_months: '',
    maturity_date: '',
    expected_return: '',
    bank_name: '',
    branch: '',
    locker_number: '',
    purchase_currency: 'USD',
    purchase_date: '',
    details: {}
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API}/assets`, { withCredentials: true });
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        total_value: formData.total_value ? parseFloat(formData.total_value) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        price_per_area: formData.price_per_area ? parseFloat(formData.price_per_area) : null,
        principal_amount: formData.principal_amount ? parseFloat(formData.principal_amount) : null,
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
        tenure_months: formData.tenure_months ? parseInt(formData.tenure_months) : null,
        expected_return: formData.expected_return ? parseFloat(formData.expected_return) : null
      };

      if (editingAsset) {
        await axios.put(`${API}/assets/${editingAsset.id}`, payload, { withCredentials: true });
        toast.success('Asset updated successfully');
      } else {
        await axios.post(`${API}/assets`, payload, { withCredentials: true });
        toast.success('Asset added successfully');
      } setDialogOpen(false);
      resetForm();
      fetchAssets();
    } catch (error) {
      console.error('Failed to save asset:', error);
      toast.error('Failed to save asset');
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    
    try {
      await axios.delete(`${API}/assets/${assetId}`, { withCredentials: true });
      toast.success('Asset deleted successfully');
      fetchAssets();
    } catch (error) {
      console.error('Failed to delete asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      type: asset.type,
      name: asset.name,
      purchase_price: asset.purchase_price?.toString() || '',
      purchase_currency: asset.purchase_currency,
      purchase_date: asset.purchase_date || '',
      details: asset.details || {}
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAsset(null);
    setFormData({
      type: 'bank',
      name: '',
      purchase_price: '',
      purchase_currency: 'USD',
      purchase_date: '',
      details: {}
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const getAssetTypeInfo = (type) => {
    return ASSET_TYPES.find(t => t.value === type) || ASSET_TYPES[0];
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
      <div className="space-y-8" data-testid="assets-container">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              Assets
            </h1>
            <p className="text-slate-400">Manage all your financial assets</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                data-testid="add-asset-dialog-btn"
                onClick={() => { resetForm(); setDialogOpen(true); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingAsset ? 'Edit Asset' : 'Add New Asset'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="asset-type" className="text-slate-300">Asset Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="asset-type" data-testid="asset-type-select" className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {ASSET_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white">
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="asset-name" className="text-slate-300">Asset Name *</Label>
                  <Input
                    id="asset-name"
                    data-testid="asset-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Chase Savings Account, Bitcoin Wallet"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase-price" className="text-slate-300">Purchase/Current Value</Label>
                    <Input
                      id="purchase-price"
                      data-testid="purchase-price-input"
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      placeholder="0.00"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currency" className="text-slate-300">Currency</Label>
                    <Select 
                      value={formData.purchase_currency} 
                      onValueChange={(value) => setFormData({ ...formData, purchase_currency: value })}
                    >
                      <SelectTrigger id="currency" data-testid="currency-select" className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr} value={curr} className="text-white">{curr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="purchase-date" className="text-slate-300">Purchase/Start Date</Label>
                  <Input
                    id="purchase-date"
                    data-testid="purchase-date-input"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                {/* Type-specific fields */}
                {formData.type === 'bank' && (
                  <div>
                    <Label htmlFor="account-number" className="text-slate-300">Account Number (optional)</Label>
                    <Input
                      id="account-number"
                      value={formData.details.account_number || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        details: { ...formData.details, account_number: e.target.value }
                      })}
                      placeholder="Last 4 digits for security"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                )}

                {formData.type === 'crypto' && (
                  <div>
                    <Label htmlFor="crypto-symbol" className="text-slate-300">Cryptocurrency Symbol (optional)</Label>
                    <Input
                      id="crypto-symbol"
                      value={formData.details.symbol || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        details: { ...formData.details, symbol: e.target.value }
                      })}
                      placeholder="BTC, ETH, etc."
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                )}

                {formData.type === 'property' && (
                  <div>
                    <Label htmlFor="property-address" className="text-slate-300">Property Address (optional)</Label>
                    <Input
                      id="property-address"
                      value={formData.details.address || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        details: { ...formData.details, address: e.target.value }
                      })}
                      placeholder="Property location"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    data-testid="save-asset-btn"
                    type="submit" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {editingAsset ? 'Update Asset' : 'Add Asset'}
                  </Button>
                  <Button 
                    data-testid="cancel-asset-btn"
                    type="button" 
                    variant="outline" 
                    onClick={handleDialogClose}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {assets.length === 0 ? (
          <Card className="bg-slate-800/30 border-slate-700" data-testid="no-assets-card">
            <CardContent className="py-16">
              <div className="text-center">
                <DollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No assets yet</h3>
                <p className="text-slate-400 mb-6">Start tracking your wealth by adding your first asset</p>
                <Button 
                  data-testid="add-first-asset-empty-btn"
                  onClick={() => setDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Asset
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => {
              const typeInfo = getAssetTypeInfo(asset.type);
              return (
                <Card 
                  key={asset.id} 
                  data-testid={`asset-card-${asset.id}`}
                  className="bg-slate-800/50 border-slate-700 hover:border-emerald-600/50 transition-all"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{typeInfo.icon}</div>
                        <div>
                          <CardTitle className="text-white text-lg" data-testid={`asset-name-${asset.id}`}>
                            {asset.name}
                          </CardTitle>
                          <p className="text-sm text-slate-400">{typeInfo.label}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {asset.purchase_price && (
                      <div className="mb-4">
                        <div className="text-sm text-slate-400 mb-1">Value</div>
                        <div className="text-2xl font-bold text-emerald-500" data-testid={`asset-value-${asset.id}`}>
                          {asset.purchase_currency} {asset.purchase_price.toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    {asset.purchase_date && (
                      <div className="text-sm text-slate-400 mb-4">
                        Date: {new Date(asset.purchase_date).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t border-slate-700">
                      <Button 
                        data-testid={`edit-asset-${asset.id}`}
                        onClick={() => handleEdit(asset)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        data-testid={`delete-asset-${asset.id}`}
                        onClick={() => handleDelete(asset.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-600/50 text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
