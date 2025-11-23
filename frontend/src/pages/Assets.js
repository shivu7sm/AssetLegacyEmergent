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
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Grid, List, Filter, Calculator, MapPin } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ASSET_TYPES = [
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿', hasQuantity: true },
  { value: 'stock', label: 'Stocks', icon: '📈', hasQuantity: true },
  { value: 'precious_metals', label: 'Precious Metals (Gold/Silver)', icon: '🥇', hasWeight: true },
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
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [conversionRates, setConversionRates] = useState({});
  const [formData, setFormData] = useState({
    type: 'crypto',
    name: '',
    quantity: '',
    unit_price: '',
    current_unit_price: '',
    total_value: '',
    current_total_value: '',
    symbol: '',
    weight: '',
    weight_unit: 'gram',
    purity: '',
    area: '',
    area_unit: 'sqft',
    price_per_area: '',
    current_price_per_area: '',
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

  useEffect(() => {
    filterAndSortAssets();
  }, [assets, filterType, sortBy]);

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

  const calculateAssetValue = (asset, useCurrent = false) => {
    let value = 0;
    
    if (useCurrent) {
      // Calculate current value
      if (asset.current_total_value) return asset.current_total_value;
      if (asset.quantity && asset.current_unit_price) return asset.quantity * asset.current_unit_price;
      if (asset.area && asset.current_price_per_area) return asset.area * asset.current_price_per_area;
      if (asset.weight && asset.current_unit_price) return asset.weight * asset.current_unit_price;
    }
    
    // Fall back to purchase value
    value = asset.total_value || 0;
    if (asset.quantity && asset.unit_price) value = asset.quantity * asset.unit_price;
    if (asset.area && asset.price_per_area) value = asset.area * asset.price_per_area;
    if (asset.weight && asset.unit_price) value = asset.weight * asset.unit_price;
    if (asset.principal_amount) value = asset.principal_amount;
    
    return value;
  };

  const getConversionRate = async (fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return 1;
    
    const key = `${fromCurrency}_${toCurrency}`;
    if (conversionRates[key]) return conversionRates[key];
    
    try {
      const response = await axios.get(`${API}/prices/currency/${fromCurrency}/${toCurrency}`, { withCredentials: true });
      const rate = response.data.rate;
      setConversionRates(prev => ({ ...prev, [key]: rate }));
      return rate;
    } catch (error) {
      console.error('Currency conversion failed:', error);
      return 1;
    }
  };

  const convertCurrency = async (amount, fromCurrency, toCurrency) => {
    const rate = await getConversionRate(fromCurrency, toCurrency);
    return amount * rate;
  };

  const filterAndSortAssets = () => {
    let filtered = assets;
    
    if (filterType !== 'all') {
      filtered = assets.filter(a => a.type === filterType);
    }
    
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'value') {
        const aValue = calculateAssetValue(a);
        const bValue = calculateAssetValue(b);
        return bValue - aValue;
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
    
    setFilteredAssets(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        current_unit_price: formData.current_unit_price ? parseFloat(formData.current_unit_price) : null,
        total_value: formData.total_value ? parseFloat(formData.total_value) : null,
        current_total_value: formData.current_total_value ? parseFloat(formData.current_total_value) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        price_per_area: formData.price_per_area ? parseFloat(formData.price_per_area) : null,
        current_price_per_area: formData.current_price_per_area ? parseFloat(formData.current_price_per_area) : null,
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
      quantity: asset.quantity?.toString() || '',
      unit_price: asset.unit_price?.toString() || '',
      current_unit_price: asset.current_unit_price?.toString() || '',
      total_value: asset.total_value?.toString() || '',
      current_total_value: asset.current_total_value?.toString() || '',
      symbol: asset.symbol || '',
      weight: asset.weight?.toString() || '',
      weight_unit: asset.weight_unit || 'gram',
      purity: asset.purity || '',
      area: asset.area?.toString() || '',
      area_unit: asset.area_unit || 'sqft',
      price_per_area: asset.price_per_area?.toString() || '',
      location: asset.location || { address: '', lat: '', lng: '' },
      principal_amount: asset.principal_amount?.toString() || '',
      interest_rate: asset.interest_rate?.toString() || '',
      tenure_months: asset.tenure_months?.toString() || '',
      maturity_date: asset.maturity_date || '',
      expected_return: asset.expected_return?.toString() || '',
      bank_name: asset.bank_name || '',
      branch: asset.branch || '',
      locker_number: asset.locker_number || '',
      purchase_currency: asset.purchase_currency,
      purchase_date: asset.purchase_date || '',
      current_price: asset.current_price?.toString() || '',
      details: asset.details || {}
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAsset(null);
    setFormData({
      type: 'crypto',
      name: '',
      quantity: '',
      unit_price: '',
      current_unit_price: '',
      total_value: '',
      current_total_value: '',
      symbol: '',
      weight: '',
      weight_unit: 'gram',
      purity: '',
      area: '',
      area_unit: 'sqft',
      price_per_area: '',
      current_price_per_area: '',
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
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const getAssetTypeInfo = (type) => {
    return ASSET_TYPES.find(t => t.value === type) || ASSET_TYPES[0];
  };

  // Interlinked field calculations
  const handleQuantityChange = (value) => {
    const qty = parseFloat(value) || 0;
    const price = parseFloat(formData.unit_price) || 0;
    setFormData({
      ...formData,
      quantity: value,
      total_value: qty && price ? (qty * price).toString() : ''
    });
  };

  const handleUnitPriceChange = (value) => {
    const price = parseFloat(value) || 0;
    const qty = parseFloat(formData.quantity) || 0;
    setFormData({
      ...formData,
      unit_price: value,
      total_value: qty && price ? (qty * price).toString() : ''
    });
  };

  const handleTotalValueChange = (value) => {
    const total = parseFloat(value) || 0;
    const qty = parseFloat(formData.quantity) || 0;
    setFormData({
      ...formData,
      total_value: value,
      unit_price: qty && total ? (total / qty).toString() : ''
    });
  };

  const handleCurrentUnitPriceChange = (value) => {
    const price = parseFloat(value) || 0;
    const qty = parseFloat(formData.quantity) || 0;
    setFormData({
      ...formData,
      current_unit_price: value,
      current_total_value: qty && price ? (qty * price).toString() : ''
    });
  };

  const handleCurrentTotalValueChange = (value) => {
    const total = parseFloat(value) || 0;
    const qty = parseFloat(formData.quantity) || 0;
    setFormData({
      ...formData,
      current_total_value: value,
      current_unit_price: qty && total ? (total / qty).toString() : ''
    });
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
              Assets
            </h1>
            <p style={{color: '#94a3b8'}}>Track and manage all your financial assets</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
              <SelectTrigger className="w-32" style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                {CURRENCIES.map(curr => (
                  <SelectItem key={curr} value={curr} style={{color: '#f8fafc'}}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              variant="outline"
              style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  data-testid="add-asset-dialog-btn"
                  onClick={() => { resetForm(); setDialogOpen(true); }}
                  className="text-white rounded-full"
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
            <DialogContent className="text-white max-w-2xl max-h-[90vh] overflow-y-auto" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
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

                {/* Crypto/Stock - Quantity based */}
                {(formData.type === 'crypto' || formData.type === 'stock') && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-slate-300">Quantity *</Label>
                        <Input type="number" step="any" value={formData.quantity} onChange={(e) => handleQuantityChange(e.target.value)} placeholder="10" required className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                      <div>
                        <Label className="text-slate-300">Purchase Price Per Unit</Label>
                        <Input type="number" step="any" value={formData.unit_price} onChange={(e) => handleUnitPriceChange(e.target.value)} placeholder="50000" className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                      <div>
                        <Label className="text-slate-300">Total Purchase Value</Label>
                        <Input type="number" step="any" value={formData.total_value} onChange={(e) => handleTotalValueChange(e.target.value)} placeholder="Auto-calculated" className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Current Price Per Unit (optional)</Label>
                        <Input type="number" step="any" value={formData.current_unit_price} onChange={(e) => handleCurrentUnitPriceChange(e.target.value)} placeholder="Defaults to purchase price" className="bg-slate-800 border-slate-700 text-white" />
                        <p className="text-xs mt-1" style={{color: '#64748b'}}>For crypto, we'll try to fetch from API</p>
                      </div>
                      <div>
                        <Label className="text-slate-300">Current Total Value (optional)</Label>
                        <Input type="number" step="any" value={formData.current_total_value} onChange={(e) => handleCurrentTotalValueChange(e.target.value)} placeholder="Auto-calculated" className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                    </div>
                    {formData.type === 'crypto' && (
                      <div>
                        <Label className="text-slate-300">Symbol (e.g., bitcoin, ethereum)</Label>
                        <Input value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} placeholder="bitcoin" className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                    )}
                  </>
                )}

                {/* Precious Metals - Weight based */}
                {formData.type === 'precious_metals' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Weight *</Label>
                        <Input type="number" step="any" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="100" required className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                      <div>
                        <Label className="text-slate-300">Unit</Label>
                        <Select value={formData.weight_unit} onValueChange={(value) => setFormData({ ...formData, weight_unit: value })}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {WEIGHT_UNITS.map(unit => (<SelectItem key={unit} value={unit} className="text-white">{unit}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Price Per Unit</Label>
                        <Input type="number" step="any" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })} placeholder="65" className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                      <div>
                        <Label className="text-slate-300">Purity (e.g., 24K, 22K)</Label>
                        <Input value={formData.purity} onChange={(e) => setFormData({ ...formData, purity: e.target.value })} placeholder="24K" className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                    </div>
                  </>
                )}

                {/* Real Estate - Area based */}
                {formData.type === 'property' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Area *</Label>
                        <Input type="number" step="any" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} placeholder="2000" required className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                      <div>
                        <Label className="text-slate-300">Unit</Label>
                        <Select value={formData.area_unit} onValueChange={(value) => setFormData({ ...formData, area_unit: value })}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {AREA_UNITS.map(unit => (<SelectItem key={unit} value={unit} className="text-white">{unit}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-300">Price Per {formData.area_unit}</Label>
                      <Input type="number" step="any" value={formData.price_per_area} onChange={(e) => setFormData({ ...formData, price_per_area: e.target.value })} placeholder="500" className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                    <div>
                      <Label className="text-slate-300">Location Address</Label>
                      <Input value={formData.location.address} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })} placeholder="123 Main St, City" className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                  </>
                )}

                {/* Loan/Credit Card */}
                {(formData.type === 'loan' || formData.type === 'credit_card') && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Principal Amount *</Label>
                        <Input type="number" step="any" value={formData.principal_amount} onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })} placeholder="100000" required className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                      <div>
                        <Label className="text-slate-300">Interest Rate (%)</Label>
                        <Input type="number" step="any" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} placeholder="8.5" className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-300">Tenure (months)</Label>
                      <Input type="number" value={formData.tenure_months} onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })} placeholder="60" className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                  </>
                )}

                {/* Investment */}
                {formData.type === 'investment' && (
                  <>
                    <div>
                      <Label className="text-slate-300">Total Investment</Label>
                      <Input type="number" step="any" value={formData.total_value} onChange={(e) => setFormData({ ...formData, total_value: e.target.value })} placeholder="50000" className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                    <div>
                      <Label className="text-slate-300">Maturity Date</Label>
                      <Input type="date" value={formData.maturity_date} onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                  </>
                )}

                {/* Locker */}
                {formData.type === 'locker' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Bank Name</Label>
                        <Input value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} placeholder="ABC Bank" className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                      <div>
                        <Label className="text-slate-300">Branch</Label>
                        <Input value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} placeholder="Main Street" className="bg-slate-800 border-slate-700 text-white" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-300">Locker Number</Label>
                      <Input value={formData.locker_number} onChange={(e) => setFormData({ ...formData, locker_number: e.target.value })} placeholder="L-123" className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                  </>
                )}

                {/* Simple total value for other assets */}
                {!['crypto', 'stock', 'gold', 'silver', 'property', 'loan', 'credit_card', 'investment', 'locker'].includes(formData.type) && (
                  <div>
                    <Label className="text-slate-300">Total Value</Label>
                    <Input type="number" step="any" value={formData.total_value} onChange={(e) => setFormData({ ...formData, total_value: e.target.value })} placeholder="10000" className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                )}

                {/* Common fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Currency</Label>
                    <Select value={formData.purchase_currency} onValueChange={(value) => setFormData({ ...formData, purchase_currency: value })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {CURRENCIES.map((curr) => (<SelectItem key={curr} value={curr} className="text-white">{curr}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-300">Purchase Date</Label>
                    <Input type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Current Value (Optional - leave blank to use purchase value)</Label>
                  <Input 
                    type="number" 
                    step="any" 
                    value={formData.current_price || ''} 
                    onChange={(e) => setFormData({ ...formData, current_price: e.target.value })} 
                    placeholder="Manual current value or API will fetch" 
                    className="bg-slate-800 border-slate-700 text-white" 
                  />
                  <p className="text-xs mt-1" style={{color: '#94a3b8'}}>For assets with live prices (crypto, stocks), we'll fetch automatically. For others, enter manually.</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    data-testid="save-asset-btn"
                    type="submit" 
                    className="flex-1 text-white"
                    style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                  >
                    {editingAsset ? 'Update Asset' : 'Add Asset'}
                  </Button>
                  <Button 
                    data-testid="cancel-asset-btn"
                    type="button" 
                    variant="outline" 
                    onClick={handleDialogClose}
                    style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Filters and Sort */}
        {assets.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48" style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <SelectItem value="all" style={{color: '#f8fafc'}}>All Assets</SelectItem>
                {ASSET_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value} style={{color: '#f8fafc'}}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48" style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <SelectItem value="date" style={{color: '#f8fafc'}}>Date Added</SelectItem>
                <SelectItem value="value" style={{color: '#f8fafc'}}>Value (High to Low)</SelectItem>
                <SelectItem value="name" style={{color: '#f8fafc'}}>Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {assets.length === 0 ? (
          <Card data-testid="no-assets-card" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-16">
              <div className="text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-4" style={{color: '#2d1f3d'}} />
                <h3 className="text-xl font-semibold mb-2" style={{color: '#f8fafc'}}>No assets yet</h3>
                <p className="mb-6" style={{color: '#94a3b8'}}>Start tracking your wealth by adding your first asset</p>
                <Button 
                  data-testid="add-first-asset-empty-btn"
                  onClick={() => setDialogOpen(true)}
                  className="text-white rounded-full"
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Asset
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filteredAssets.length > 0 ? filteredAssets : assets).map((asset) => {
              const typeInfo = getAssetTypeInfo(asset.type);
              return (
                <Card 
                  key={asset.id} 
                  data-testid={`asset-card-${asset.id}`}
                  className="transition-all"
                  style={{background: '#1a1229', borderColor: '#2d1f3d'}}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{typeInfo.icon}</div>
                        <div>
                          <CardTitle className="text-lg" data-testid={`asset-name-${asset.id}`} style={{color: '#f8fafc'}}>
                            {asset.name}
                          </CardTitle>
                          <p className="text-sm" style={{color: '#94a3b8'}}>{typeInfo.label}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      let value = asset.total_value;
                      if (asset.quantity && asset.unit_price) value = asset.quantity * asset.unit_price;
                      if (asset.area && asset.price_per_area) value = asset.area * asset.price_per_area;
                      if (asset.weight && asset.unit_price) value = asset.weight * asset.unit_price;
                      if (asset.principal_amount) value = asset.principal_amount;
                      
                      return value ? (
                        <div className="mb-4">
                          <div className="text-sm mb-1" style={{color: '#94a3b8'}}>Value</div>
                          <div className="text-2xl font-bold" data-testid={`asset-value-${asset.id}`} style={{color: '#ec4899'}}>
                            {asset.purchase_currency} {value.toLocaleString()}
                          </div>
                        </div>
                      ) : null;
                    })()}
                    
                    {asset.quantity && (
                      <div className="text-sm mb-2" style={{color: '#94a3b8'}}>
                        Quantity: <span style={{color: '#f8fafc'}}>{asset.quantity}</span>
                      </div>
                    )}
                    
                    {asset.weight && (
                      <div className="text-sm mb-2" style={{color: '#94a3b8'}}>
                        Weight: <span style={{color: '#f8fafc'}}>{asset.weight} {asset.weight_unit}</span>
                      </div>
                    )}
                    
                    {asset.area && (
                      <div className="text-sm mb-2" style={{color: '#94a3b8'}}>
                        Area: <span style={{color: '#f8fafc'}}>{asset.area} {asset.area_unit}</span>
                      </div>
                    )}
                    
                    {asset.location?.address && (
                      <div className="text-sm mb-2" style={{color: '#94a3b8'}}>
                        📍 {asset.location.address}
                      </div>
                    )}
                    
                    {asset.maturity_date && (
                      <div className="text-sm mb-2" style={{color: '#94a3b8'}}>
                        Maturity: <span style={{color: '#f8fafc'}}>{new Date(asset.maturity_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {asset.purchase_date && (
                      <div className="text-sm mb-4" style={{color: '#94a3b8'}}>
                        Date: {new Date(asset.purchase_date).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex gap-2 pt-4" style={{borderTop: '1px solid #2d1f3d'}}>
                      <Button 
                        data-testid={`edit-asset-${asset.id}`}
                        onClick={() => handleEdit(asset)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        data-testid={`delete-asset-${asset.id}`}
                        onClick={() => handleDelete(asset.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        style={{borderColor: '#ef4444', color: '#ef4444'}}
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
        ) : (
          <div>
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{background: '#16001e', borderBottom: '1px solid #2d1f3d'}}>
                      <tr>
                        <th className="text-left p-4" style={{color: '#94a3b8', fontWeight: 600}}>Asset</th>
                        <th className="text-left p-4" style={{color: '#94a3b8', fontWeight: 600}}>Type</th>
                        <th className="text-right p-4" style={{color: '#94a3b8', fontWeight: 600}}>Quantity</th>
                        <th className="text-right p-4" style={{color: '#94a3b8', fontWeight: 600}}>Original Value</th>
                        <th className="text-right p-4" style={{color: '#94a3b8', fontWeight: 600}}>Purchase ({displayCurrency})</th>
                        <th className="text-right p-4" style={{color: '#94a3b8', fontWeight: 600}}>Current ({displayCurrency})</th>
                        <th className="text-right p-4" style={{color: '#94a3b8', fontWeight: 600}}>Gain/Loss</th>
                        <th className="text-right p-4" style={{color: '#94a3b8', fontWeight: 600}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredAssets.length > 0 ? filteredAssets : assets).map((asset) => {
                        const typeInfo = getAssetTypeInfo(asset.type);
                        const purchaseValue = calculateAssetValue(asset, false);
                        const currentValue = calculateAssetValue(asset, true) || purchaseValue;
                        const gain = currentValue - purchaseValue;
                        const gainPercent = purchaseValue ? ((gain / purchaseValue) * 100).toFixed(2) : 0;
                        
                        return (
                          <tr key={asset.id} style={{borderBottom: '1px solid #2d1f3d'}}>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{typeInfo.icon}</span>
                                <div>
                                  <div style={{color: '#f8fafc', fontWeight: 500}}>{asset.name}</div>
                                  {asset.symbol && <div className="text-xs" style={{color: '#94a3b8'}}>{asset.symbol}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="p-4" style={{color: '#94a3b8'}}>{typeInfo.label}</td>
                            <td className="p-4 text-right" style={{color: '#94a3b8'}}>
                              {asset.quantity && `${asset.quantity} units`}
                              {asset.weight && `${asset.weight} ${asset.weight_unit}`}
                              {asset.area && `${asset.area} ${asset.area_unit}`}
                              {!asset.quantity && !asset.weight && !asset.area && '-'}
                            </td>
                            <td className="p-4 text-right" style={{color: '#f8fafc'}}>
                              {displayCurrency} {purchaseValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                            <td className="p-4 text-right">
                              <div style={{color: '#ec4899', fontWeight: 600}}>
                                {displayCurrency} {currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </div>
                              {gain !== 0 && (
                                <div className="text-xs" style={{color: gain > 0 ? '#22c55e' : '#ef4444'}}>
                                  {gain > 0 ? '+' : ''}{gain.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ({gainPercent}%)
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  onClick={() => handleEdit(asset)}
                                  variant="outline"
                                  size="sm"
                                  style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  onClick={() => handleDelete(asset.id)}
                                  variant="outline"
                                  size="sm"
                                  style={{borderColor: '#ef4444', color: '#ef4444'}}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot style={{background: '#16001e', borderTop: '2px solid #2d1f3d'}}>
                      <tr>
                        <td colSpan="3" className="p-4" style={{color: '#f8fafc', fontWeight: 600}}>Total</td>
                        <td className="p-4 text-right" style={{color: '#f8fafc', fontWeight: 600}}>
                          {displayCurrency} {(filteredAssets.length > 0 ? filteredAssets : assets).reduce((sum, asset) => sum + calculateAssetValue(asset), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="p-4 text-right" style={{color: '#ec4899', fontWeight: 700, fontSize: '1.1rem'}}>
                          {displayCurrency} {(filteredAssets.length > 0 ? filteredAssets : assets).reduce((sum, asset) => sum + (asset.current_price || calculateAssetValue(asset)), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
