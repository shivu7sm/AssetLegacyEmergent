import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Filter, Grid, List, MapPin, Calculator } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  { value: 'locker', label: 'Safe/Locker', icon: '🔐', hasLocation: true },
  { value: 'diamond', label: 'Diamond/Jewelry', icon: '💎' }
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'];
const AREA_UNITS = ['sqft', 'sqmt', 'yard', 'acre'];
const WEIGHT_UNITS = ['gram', 'kilogram', 'ounce', 'pound'];

export default function AssetsNew() {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'value', 'name'
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [loanSchedule, setLoanSchedule] = useState(null);
  const [showLoanSchedule, setShowLoanSchedule] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'crypto',
    name: '',
    // Quantity-based
    quantity: '',
    unit_price: '',
    total_value: '',
    symbol: '',
    // Weight-based (precious metals)
    weight: '',
    weight_unit: 'gram',
    purity: '',
    // Area-based (real estate)
    area: '',
    area_unit: 'sqft',
    price_per_area: '',
    location: { address: '', lat: '', lng: '' },
    // Loan/Credit Card
    principal_amount: '',
    interest_rate: '',
    tenure_months: '',
    outstanding_balance: '',
    // Investment
    maturity_date: '',
    expected_return: '',
    // Locker
    bank_name: '',
    branch: '',
    locker_number: '',
    // Common
    purchase_currency: 'USD',
    purchase_date: '',
    details: {}
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAndSortAssets();
  }, [assets, filterType, sortBy, displayCurrency]);

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

  const calculateAssetValue = (asset) => {
    if (asset.total_value) return asset.total_value;
    if (asset.quantity && asset.unit_price) return asset.quantity * asset.unit_price;
    if (asset.area && asset.price_per_area) return asset.area * asset.price_per_area;
    if (asset.principal_amount) return asset.principal_amount;
    if (asset.weight && asset.unit_price) return asset.weight * asset.unit_price;
    return 0;
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
        outstanding_balance: formData.outstanding_balance ? parseFloat(formData.outstanding_balance) : null,
        expected_return: formData.expected_return ? parseFloat(formData.expected_return) : null
      };

      if (editingAsset) {
        await axios.put(`${API}/assets/${editingAsset.id}`, payload, { withCredentials: true });
        toast.success('Asset updated successfully');
      } else {
        await axios.post(`${API}/assets`, payload, { withCredentials: true });
        toast.success('Asset added successfully');
      }
      
      setDialogOpen(false);
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
      total_value: asset.total_value?.toString() || '',
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
      outstanding_balance: asset.outstanding_balance?.toString() || '',
      maturity_date: asset.maturity_date || '',
      expected_return: asset.expected_return?.toString() || '',
      bank_name: asset.bank_name || '',
      branch: asset.branch || '',
      locker_number: asset.locker_number || '',
      purchase_currency: asset.purchase_currency,
      purchase_date: asset.purchase_date || '',
      details: asset.details || {}
    });
    setDialogOpen(true);
  };

  const viewLoanSchedule = async (asset) => {
    try {
      const response = await axios.get(`${API}/assets/${asset.id}/loan-schedule`, { withCredentials: true });
      setLoanSchedule(response.data);
      setShowLoanSchedule(true);
    } catch (error) {
      toast.error('Failed to calculate loan schedule');
    }
  };

  const resetForm = () => {
    setEditingAsset(null);
    setFormData({
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
      outstanding_balance: '',
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

  const getAssetTypeInfo = (type) => {
    return ASSET_TYPES.find(t => t.value === type) || ASSET_TYPES[0];
  };

  const renderAssetFields = () => {
    const typeInfo = ASSET_TYPES.find(t => t.value === formData.type);
    
    return (
      <div className=\"space-y-4\">
        {/* Quantity-based assets (Crypto, Stocks) */}
        {typeInfo?.hasQuantity && (
          <>
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label className=\"text-slate-300\">Quantity *</Label>
                <Input
                  type=\"number\"
                  step=\"any\"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder=\"10\"
                  required
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
              <div>
                <Label className=\"text-slate-300\">Price Per Unit</Label>
                <Input
                  type=\"number\"
                  step=\"any\"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder=\"50000\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
            </div>
            {formData.type === 'crypto' && (
              <div>
                <Label className=\"text-slate-300\">Symbol (e.g., bitcoin, ethereum)</Label>
                <Input
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder=\"bitcoin\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
            )}
          </>
        )}

        {/* Weight-based assets (Gold, Silver) */}
        {typeInfo?.hasWeight && (
          <>
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label className=\"text-slate-300\">Weight *</Label>
                <Input
                  type=\"number\"
                  step=\"any\"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder=\"100\"
                  required
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
              <div>
                <Label className=\"text-slate-300\">Unit</Label>
                <Select value={formData.weight_unit} onValueChange={(value) => setFormData({ ...formData, weight_unit: value })}>
                  <SelectTrigger className=\"bg-slate-900 border-slate-700 text-white\">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className=\"bg-slate-800 border-slate-700\">
                    {WEIGHT_UNITS.map(unit => (
                      <SelectItem key={unit} value={unit} className=\"text-white\">{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label className=\"text-slate-300\">Price Per Unit</Label>
                <Input
                  type=\"number\"
                  step=\"any\"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder=\"65\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
              <div>
                <Label className=\"text-slate-300\">Purity (e.g., 24K, 22K)</Label>
                <Input
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                  placeholder=\"24K\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
            </div>
          </>
        )}

        {/* Area-based assets (Real Estate) */}
        {typeInfo?.hasArea && (
          <>
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label className=\"text-slate-300\">Area *</Label>
                <Input
                  type=\"number\"
                  step=\"any\"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder=\"2000\"
                  required
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
              <div>
                <Label className=\"text-slate-300\">Unit</Label>
                <Select value={formData.area_unit} onValueChange={(value) => setFormData({ ...formData, area_unit: value })}>
                  <SelectTrigger className=\"bg-slate-900 border-slate-700 text-white\">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className=\"bg-slate-800 border-slate-700\">
                    {AREA_UNITS.map(unit => (
                      <SelectItem key={unit} value={unit} className=\"text-white\">{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className=\"text-slate-300\">Price Per {formData.area_unit}</Label>
              <Input
                type=\"number\"
                step=\"any\"
                value={formData.price_per_area}
                onChange={(e) => setFormData({ ...formData, price_per_area: e.target.value })}
                placeholder=\"500\"
                className=\"bg-slate-900 border-slate-700 text-white\"
              />
            </div>
            <div>
              <Label className=\"text-slate-300\">
                <MapPin className=\"w-4 h-4 inline mr-1\" />
                Location Address
              </Label>
              <Input
                value={formData.location.address}
                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                placeholder=\"123 Main St, City, State\"
                className=\"bg-slate-900 border-slate-700 text-white\"
              />
            </div>
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label className=\"text-slate-300\">Latitude</Label>
                <Input
                  value={formData.location.lat}
                  onChange={(e) => setFormData({ ...formData, location: { ...formData.location, lat: e.target.value } })}
                  placeholder=\"40.7128\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
              <div>
                <Label className=\"text-slate-300\">Longitude</Label>
                <Input
                  value={formData.location.lng}
                  onChange={(e) => setFormData({ ...formData, location: { ...formData.location, lng: e.target.value } })}
                  placeholder=\"-74.0060\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
            </div>
          </>
        )}

        {/* Loan/Credit Card */}
        {typeInfo?.isLiability && (
          <>
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label className=\"text-slate-300\">Principal Amount *</Label>
                <Input
                  type=\"number\"
                  step=\"any\"
                  value={formData.principal_amount}
                  onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                  placeholder=\"100000\"
                  required
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
              <div>
                <Label className=\"text-slate-300\">Interest Rate (% per annum)</Label>
                <Input
                  type=\"number\"
                  step=\"any\"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  placeholder=\"8.5\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
            </div>
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label className=\"text-slate-300\">Tenure (months)</Label>
                <Input
                  type=\"number\"
                  value={formData.tenure_months}
                  onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })}
                  placeholder=\"60\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
              <div>
                <Label className=\"text-slate-300\">Outstanding Balance</Label>
                <Input
                  type=\"number\"
                  step=\"any\"
                  value={formData.outstanding_balance}
                  onChange={(e) => setFormData({ ...formData, outstanding_balance: e.target.value })}
                  placeholder=\"75000\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
            </div>
          </>
        )}

        {/* Investment specific */}
        {typeInfo?.hasMaturity && (
          <>
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label className=\"text-slate-300\">Total Investment</Label>
                <Input
                  type=\"number\"
                  step=\"any\"
                  value={formData.total_value}
                  onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                  placeholder=\"50000\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
              <div>
                <Label className=\"text-slate-300\">Expected Return (%)</Label>
                <Input
                  type=\"number\"
                  step=\"any\"
                  value={formData.expected_return}
                  onChange={(e) => setFormData({ ...formData, expected_return: e.target.value })}
                  placeholder=\"12\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
            </div>
            <div>
              <Label className=\"text-slate-300\">Maturity Date</Label>
              <Input
                type=\"date\"
                value={formData.maturity_date}
                onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                className=\"bg-slate-900 border-slate-700 text-white\"
              />
            </div>
          </>
        )}

        {/* Locker specific */}
        {typeInfo?.hasLocation && (
          <>
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label className=\"text-slate-300\">Bank Name</Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder=\"ABC Bank\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
              <div>
                <Label className=\"text-slate-300\">Branch</Label>
                <Input
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder=\"Main Street\"
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>
            </div>
            <div>
              <Label className=\"text-slate-300\">Locker Number</Label>
              <Input
                value={formData.locker_number}
                onChange={(e) => setFormData({ ...formData, locker_number: e.target.value })}
                placeholder=\"L-123\"
                className=\"bg-slate-900 border-slate-700 text-white\"
              />
            </div>
          </>
        )}

        {/* Simple total value for other assets */}
        {!typeInfo?.hasQuantity && !typeInfo?.hasWeight && !typeInfo?.hasArea && !typeInfo?.isLiability && !typeInfo?.hasMaturity && (
          <div>
            <Label className=\"text-slate-300\">Total Value</Label>
            <Input
              type=\"number\"
              step=\"any\"
              value={formData.total_value}
              onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
              placeholder=\"10000\"
              className=\"bg-slate-900 border-slate-700 text-white\"
            />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className=\"flex items-center justify-center h-96\">
          <div className=\"text-slate-400 text-xl\">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className=\"space-y-8\" data-testid=\"assets-container\">
        {/* Header with Controls */}
        <div className=\"flex flex-col md:flex-row justify-between items-start md:items-center gap-4\">
          <div>
            <h1 className=\"text-3xl sm:text-4xl font-bold mb-2\" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
              Assets
            </h1>
            <p style={{color: '#94a3b8'}}>Track and manage all your financial assets</p>
          </div>
          
          <div className=\"flex items-center gap-3\">
            <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
              <SelectTrigger className=\"w-32\" style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                {CURRENCIES.map(curr => (
                  <SelectItem key={curr} value={curr} style={{color: '#f8fafc'}}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              variant=\"outline\"
              style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
            >
              {viewMode === 'grid' ? <List className=\"w-4 h-4\" /> : <Grid className=\"w-4 h-4\" />}
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <Button 
                onClick={() => { resetForm(); setDialogOpen(true); }}
                className=\"rounded-full\"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: 'white'}}
              >
                <Plus className=\"w-4 h-4 mr-2\" />
                Add Asset
              </Button>
            </Dialog>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className=\"flex flex-wrap gap-4\">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className=\"w-48\" style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
              <Filter className=\"w-4 h-4 mr-2\" />
              <SelectValue placeholder=\"Filter by type\" />
            </SelectTrigger>
            <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <SelectItem value=\"all\" style={{color: '#f8fafc'}}>All Assets</SelectItem>
              {ASSET_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value} style={{color: '#f8fafc'}}>
                  {type.icon} {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className=\"w-48\" style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
              <SelectValue placeholder=\"Sort by\" />
            </SelectTrigger>
            <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <SelectItem value=\"date\" style={{color: '#f8fafc'}}>Date Added</SelectItem>
              <SelectItem value=\"value\" style={{color: '#f8fafc'}}>Value (High to Low)</SelectItem>
              <SelectItem value=\"name\" style={{color: '#f8fafc'}}>Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assets Display */}
        {filteredAssets.length === 0 ? (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className=\"py-16\">
              <div className=\"text-center\">
                <div className=\"text-6xl mb-4\">💰</div>
                <h3 className=\"text-xl font-semibold mb-2\" style={{color: '#f8fafc'}}>No assets yet</h3>
                <p className=\"mb-6\" style={{color: '#94a3b8'}}>Start tracking your wealth by adding your first asset</p>
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className=\"rounded-full\"
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: 'white'}}
                >
                  <Plus className=\"w-4 h-4 mr-2\" />
                  Add Your First Asset
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
            {filteredAssets.map((asset) => {
              const typeInfo = getAssetTypeInfo(asset.type);
              const value = calculateAssetValue(asset);
              return (
                <Card 
                  key={asset.id}
                  className=\"transition-all hover:scale-105\"
                  style={{background: '#1a1229', borderColor: '#2d1f3d'}}
                >
                  <CardHeader>
                    <div className=\"flex justify-between items-start\">
                      <div className=\"flex items-center gap-3\">
                        <div className=\"text-3xl\">{typeInfo.icon}</div>
                        <div>
                          <CardTitle style={{color: '#f8fafc', fontSize: '1.1rem'}}>{asset.name}</CardTitle>
                          <p className=\"text-sm\" style={{color: '#94a3b8'}}>{typeInfo.label}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {value > 0 && (
                      <div className=\"mb-4\">
                        <div className=\"text-sm mb-1\" style={{color: '#94a3b8'}}>Value</div>
                        <div className=\"text-2xl font-bold\" style={{color: '#ec4899'}}>
                          {displayCurrency} {value.toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    {asset.quantity && (
                      <div className=\"text-sm mb-2\" style={{color: '#94a3b8'}}>
                        Quantity: <span style={{color: '#f8fafc'}}>{asset.quantity}</span>
                      </div>
                    )}
                    
                    {asset.weight && (
                      <div className=\"text-sm mb-2\" style={{color: '#94a3b8'}}>
                        Weight: <span style={{color: '#f8fafc'}}>{asset.weight} {asset.weight_unit}</span>
                      </div>
                    )}
                    
                    {asset.area && (
                      <div className=\"text-sm mb-2\" style={{color: '#94a3b8'}}>
                        Area: <span style={{color: '#f8fafc'}}>{asset.area} {asset.area_unit}</span>
                      </div>
                    )}
                    
                    {asset.location?.address && (
                      <div className=\"text-sm mb-2\" style={{color: '#94a3b8'}}>
                        <MapPin className=\"w-3 h-3 inline mr-1\" />
                        {asset.location.address}
                      </div>
                    )}
                    
                    {asset.maturity_date && (
                      <div className=\"text-sm mb-2\" style={{color: '#94a3b8'}}>
                        Maturity: <span style={{color: '#f8fafc'}}>{new Date(asset.maturity_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {asset.purchase_date && (
                      <div className=\"text-sm mb-4\" style={{color: '#94a3b8'}}>
                        Date: {new Date(asset.purchase_date).toLocaleDateString()}
                      </div>
                    )}

                    <div className=\"flex gap-2 pt-4\" style={{borderTop: '1px solid #2d1f3d'}}>
                      <Button 
                        onClick={() => handleEdit(asset)}
                        variant=\"outline\"
                        size=\"sm\"
                        className=\"flex-1\"
                        style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                      >
                        <Edit className=\"w-4 h-4 mr-2\" />
                        Edit
                      </Button>
                      {(asset.type === 'loan' || asset.type === 'credit_card') && asset.principal_amount && (
                        <Button 
                          onClick={() => viewLoanSchedule(asset)}
                          variant=\"outline\"
                          size=\"sm\"
                          style={{borderColor: '#2d1f3d', color: '#a855f7'}}
                        >
                          <Calculator className=\"w-4 h-4\" />
                        </Button>
                      )}
                      <Button 
                        onClick={() => handleDelete(asset.id)}
                        variant=\"outline\"
                        size=\"sm\"
                        style={{borderColor: '#ef4444', color: '#ef4444'}}
                      >
                        <Trash2 className=\"w-4 h-4\" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className=\"p-0\">
              <div className=\"overflow-x-auto\">
                <table className=\"w-full\">
                  <thead style={{background: '#16001e', borderBottom: '1px solid #2d1f3d'}}>
                    <tr>
                      <th className=\"text-left p-4\" style={{color: '#94a3b8'}}>Asset</th>
                      <th className=\"text-left p-4\" style={{color: '#94a3b8'}}>Type</th>
                      <th className=\"text-right p-4\" style={{color: '#94a3b8'}}>Quantity/Details</th>
                      <th className=\"text-right p-4\" style={{color: '#94a3b8'}}>Value</th>
                      <th className=\"text-right p-4\" style={{color: '#94a3b8'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset) => {
                      const typeInfo = getAssetTypeInfo(asset.type);
                      const value = calculateAssetValue(asset);
                      return (
                        <tr key={asset.id} style={{borderBottom: '1px solid #2d1f3d'}}>
                          <td className=\"p-4\">
                            <div className=\"flex items-center gap-3\">
                              <span className=\"text-2xl\">{typeInfo.icon}</span>
                              <span style={{color: '#f8fafc'}}>{asset.name}</span>
                            </div>
                          </td>
                          <td className=\"p-4\" style={{color: '#94a3b8'}}>{typeInfo.label}</td>
                          <td className=\"p-4 text-right\" style={{color: '#94a3b8'}}>
                            {asset.quantity && `${asset.quantity} units`}
                            {asset.weight && `${asset.weight} ${asset.weight_unit}`}
                            {asset.area && `${asset.area} ${asset.area_unit}`}
                          </td>
                          <td className=\"p-4 text-right font-bold\" style={{color: '#ec4899'}}>
                            {displayCurrency} {value.toLocaleString()}
                          </td>
                          <td className=\"p-4 text-right\">
                            <div className=\"flex justify-end gap-2\">
                              <Button 
                                onClick={() => handleEdit(asset)}
                                variant=\"outline\"
                                size=\"sm\"
                                style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                              >
                                <Edit className=\"w-4 h-4\" />
                              </Button>
                              <Button 
                                onClick={() => handleDelete(asset.id)}
                                variant=\"outline\"
                                size=\"sm\"
                                style={{borderColor: '#ef4444', color: '#ef4444'}}
                              >
                                <Trash2 className=\"w-4 h-4\" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className=\"max-w-3xl max-h-[90vh] overflow-y-auto\" style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
            <DialogHeader>
              <DialogTitle className=\"text-2xl\" style={{color: '#f8fafc'}}>
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className=\"space-y-6\">
              <div>
                <Label className=\"text-slate-300\">Asset Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger style={{background: '#0f0a1e', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    {ASSET_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} style={{color: '#f8fafc'}}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className=\"text-slate-300\">Asset Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder=\"e.g., Bitcoin Wallet, Downtown Apartment\"
                  required
                  className=\"bg-slate-900 border-slate-700 text-white\"
                />
              </div>

              {renderAssetFields()}

              <div className=\"grid grid-cols-2 gap-4\">
                <div>
                  <Label className=\"text-slate-300\">Currency</Label>
                  <Select value={formData.purchase_currency} onValueChange={(value) => setFormData({ ...formData, purchase_currency: value })}>
                    <SelectTrigger style={{background: '#0f0a1e', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr} value={curr} style={{color: '#f8fafc'}}>{curr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className=\"text-slate-300\">Purchase/Start Date</Label>
                  <Input
                    type=\"date\"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className=\"bg-slate-900 border-slate-700 text-white\"
                  />
                </div>
              </div>

              <div className=\"flex gap-3 pt-4\">
                <Button 
                  type=\"submit\" 
                  className=\"flex-1\"
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: 'white'}}
                >
                  {editingAsset ? 'Update Asset' : 'Add Asset'}
                </Button>
                <Button 
                  type=\"button\" 
                  variant=\"outline\" 
                  onClick={() => { setDialogOpen(false); resetForm(); }}
                  style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Loan Schedule Dialog */}
        <Dialog open={showLoanSchedule} onOpenChange={setShowLoanSchedule}>
          <DialogContent className=\"max-w-4xl max-h-[90vh] overflow-y-auto\" style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
            <DialogHeader>
              <DialogTitle className=\"text-2xl\" style={{color: '#f8fafc'}}>Loan Payment Schedule</DialogTitle>
            </DialogHeader>
            
            {loanSchedule && (
              <div className=\"space-y-6\">
                <div className=\"grid grid-cols-3 gap-4\">
                  <Card style={{background: '#16001e', borderColor: '#2d1f3d'}}>
                    <CardContent className=\"pt-6\">
                      <div className=\"text-sm\" style={{color: '#94a3b8'}}>Monthly EMI</div>
                      <div className=\"text-2xl font-bold\" style={{color: '#ec4899'}}>
                        ${loanSchedule.emi?.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card style={{background: '#16001e', borderColor: '#2d1f3d'}}>
                    <CardContent className=\"pt-6\">
                      <div className=\"text-sm\" style={{color: '#94a3b8'}}>Total Interest</div>
                      <div className=\"text-2xl font-bold\" style={{color: '#a855f7'}}>
                        ${loanSchedule.total_interest?.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card style={{background: '#16001e', borderColor: '#2d1f3d'}}>
                    <CardContent className=\"pt-6\">
                      <div className=\"text-sm\" style={{color: '#94a3b8'}}>Total Amount</div>
                      <div className=\"text-2xl font-bold\" style={{color: '#f8fafc'}}>
                        ${loanSchedule.total_amount?.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className=\"overflow-x-auto\">
                  <table className=\"w-full\">
                    <thead style={{background: '#16001e', borderBottom: '1px solid #2d1f3d'}}>
                      <tr>
                        <th className=\"text-left p-3\" style={{color: '#94a3b8'}}>Month</th>
                        <th className=\"text-right p-3\" style={{color: '#94a3b8'}}>EMI</th>
                        <th className=\"text-right p-3\" style={{color: '#94a3b8'}}>Principal</th>
                        <th className=\"text-right p-3\" style={{color: '#94a3b8'}}>Interest</th>
                        <th className=\"text-right p-3\" style={{color: '#94a3b8'}}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanSchedule.schedule?.map((row) => (
                        <tr key={row.month} style={{borderBottom: '1px solid #2d1f3d'}}>
                          <td className=\"p-3\" style={{color: '#f8fafc'}}>{row.month}</td>
                          <td className=\"p-3 text-right\" style={{color: '#94a3b8'}}>${row.emi}</td>
                          <td className=\"p-3 text-right\" style={{color: '#22c55e'}}>${row.principal}</td>
                          <td className=\"p-3 text-right\" style={{color: '#ef4444'}}>${row.interest}</td>
                          <td className=\"p-3 text-right font-bold\" style={{color: '#f8fafc'}}>${row.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
