import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Edit2, Check, X, Trash2, Calculator, Sparkles, TrendingUp, TrendingDown, Plus, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currencyConversion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddAssetForm from '@/components/AddAssetForm';
import { calculateLoanSummary } from '@/utils/loanCalculator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Asset type groups for organized display
const ASSET_GROUPS = {
  investments: {
    label: 'Stocks & Bonds',
    icon: '📈',
    types: ['stock', 'investment', 'mutual_fund'],
    color: '#10b981',        // Emerald green - good contrast on both themes
    colorLight: '#059669'    // Darker emerald for light theme
  },
  crypto: {
    label: 'Cryptocurrency & NFT',
    icon: '₿',
    types: ['crypto', 'portfolio', 'nft'],
    color: '#06b6d4',        // Cyan - good contrast
    colorLight: '#0891b2'    // Darker cyan for light theme
  },
  realEstate: {
    label: 'Real Estate',
    icon: '🏠',
    types: ['property'],
    color: '#f97316',        // Orange - vibrant and visible
    colorLight: '#ea580c'    // Darker orange for light theme
  },
  banking: {
    label: 'Banking & Cash',
    icon: '🏦',
    types: ['bank'],
    color: '#eab308',        // Yellow - matches gold theme
    colorLight: '#ca8a04'    // Darker yellow for light theme
  },
  valuables: {
    label: 'Valuables & Others',
    icon: '💎',
    types: ['precious_metals', 'diamond', 'locker', 'insurance', 'vehicle', 'art'],
    color: '#a855f7',        // Purple - elegant
    colorLight: '#9333ea'    // Darker purple for light theme
  },
  liabilities: {
    label: 'Loans & Debts',
    icon: '💳',
    types: ['loan', 'credit_card'],
    color: '#ef4444',        // Red - attention grabbing
    colorLight: '#dc2626'    // Darker red for light theme
  }
};

export default function AssetsNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCurrency, currencyFormat } = useApp();
  const { theme, colorTheme } = useTheme();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState(Object.keys(ASSET_GROUPS));
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loanCalcData, setLoanCalcData] = useState(null);
  const [calculatingLoan, setCalculatingLoan] = useState(false);
  const [loanParams, setLoanParams] = useState({ interestRate: 0, tenure: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('asset'); // 'asset' or 'liability'
  const [activeFilter, setActiveFilter] = useState('all'); // Filter by asset group
  const [activeAccount, setActiveAccount] = useState('own'); // 'own' or 'test_account' or account_id
  const [testAccountData, setTestAccountData] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchAssets();
    checkDemoMode();
    fetchConnectedAccounts();
  }, []);

  // Show converting state when currency changes
  useEffect(() => {
    if (assets.length > 0) {
      setConverting(true);
      const timer = setTimeout(() => setConverting(false), 800);
      return () => clearTimeout(timer);
    }
  }, [selectedCurrency]);

  const fetchConnectedAccounts = async () => {
    try {
      const response = await axios.get(`${API}/nominees/my-accesses`, { withCredentials: true });
      setConnectedAccounts(response.data.accessible_accounts || []);
    } catch (error) {
      console.error('Failed to fetch connected accounts:', error);
    }
  };

  const fetchAccountAssets = async (accountId, accessToken) => {
    setLoading(true);
    try {
      console.log('Fetching assets for account:', accountId, 'with token:', accessToken?.substring(0, 10) + '...');
      const response = await axios.get(`${API}/nominee/dashboard`, {
        params: { access_token: accessToken }
      });
      console.log('Nominee dashboard response:', response.data);
      return response.data.assets || [];
    } catch (error) {
      console.error('Failed to fetch account assets:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to load account assets: ${error.response?.data?.detail || error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Update assets when account switches
  useEffect(() => {
    const loadAccountAssets = async () => {
      if (activeAccount === 'own') {
        fetchAssets();
      } else if (activeAccount === 'test_account' && testAccountData) {
        // Use test account data
        const testAssets = [...(testAccountData.assets || []), ...(testAccountData.portfolios || [])];
        setAssets(testAssets);
        setLoading(false);
      } else if (activeAccount !== 'own' && activeAccount !== 'test_account') {
        // It's a connected account - wait for connectedAccounts to load
        if (connectedAccounts.length > 0) {
          const account = connectedAccounts.find(a => a.account_id === activeAccount);
          if (account && account.access_token) {
            console.log('Loading connected account:', account.account_name);
            const accountAssets = await fetchAccountAssets(activeAccount, account.access_token);
            setAssets(accountAssets);
          } else {
            console.error('Account not found or no access token:', activeAccount);
            toast.error('Account access token not found');
            setActiveAccount('own');
          }
        }
      }
    };
    
    loadAccountAssets();
  }, [activeAccount, connectedAccounts, testAccountData]);

  const checkDemoMode = async () => {
    try {
      const response = await axios.get(`${API}/demo/status`, { withCredentials: true });
      setDemoMode(response.data.demo_mode);
      
      // If in demo mode, fetch test account data
      if (response.data.demo_mode && response.data.test_account_access) {
        fetchTestAccountAssets();
      }
    } catch (error) {
      console.error('Failed to check demo mode:', error);
    }
  };

  const fetchTestAccountAssets = async () => {
    try {
      const response = await axios.get(`${API}/demo/test-account-assets`, { withCredentials: true });
      setTestAccountData(response.data);
    } catch (error) {
      console.error('Failed to fetch test account:', error);
    }
  };

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

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => 
      prev.includes(groupKey) 
        ? prev.filter(g => g !== groupKey)
        : [...prev, groupKey]
    );
  };

  const scrollToGroup = (groupKey) => {
    const element = document.getElementById(`group-${groupKey}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const groupAssetsByType = () => {
    const grouped = {};
    
    // Use test account assets if that's selected
    const assetsToGroup = activeAccount === 'test_account' && testAccountData 
      ? [...testAccountData.assets, ...testAccountData.portfolios]
      : assets;
    
    Object.keys(ASSET_GROUPS).forEach(key => {
      const group = ASSET_GROUPS[key];
      grouped[key] = assetsToGroup.filter(asset => group.types.includes(asset.type));
    });
    return grouped;
  };

  const calculateAssetValue = (asset, useCurrent = false) => {
    if (useCurrent) {
      if (asset.current_total_value) return asset.current_total_value;
      if (asset.current_value) return asset.current_value;
      if (asset.quantity && asset.current_unit_price) return asset.quantity * asset.current_unit_price;
      if (asset.area && asset.current_price_per_area) return asset.area * asset.current_price_per_area;
      if (asset.weight && asset.current_unit_price) return asset.weight * asset.current_unit_price;
    }
    
    if (asset.total_value) return asset.total_value;
    if (asset.quantity && asset.unit_price) return asset.quantity * asset.unit_price;
    if (asset.area && asset.price_per_area) return asset.area * asset.price_per_area;
    if (asset.weight && asset.unit_price) return asset.weight * asset.unit_price;
    if (asset.principal_amount) return asset.principal_amount;
    
    return 0;
  };

  const calculateLoanDetails = async (asset) => {
    if (!asset.principal_amount || !asset.interest_rate || !asset.tenure_months) {
      toast.error('Missing loan details for calculation');
      return;
    }

    // Use client-side calculation (instant, no API call)
    const principal = asset.principal_amount || asset.total_value;
    const rate = loanParams.interestRate || asset.interest_rate;
    const months = loanParams.tenure || asset.tenure_months;
    
    const result = calculateLoanSummary(principal, rate, months);
    setLoanCalcData(result);
    setLoanParams({ interestRate: rate, tenure: months });
  };

  // Real-time recalculation when sliders change
  const recalculateLoan = (principal, rate, months) => {
    const result = calculateLoanSummary(principal, rate, months);
    setLoanCalcData(result);
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Delete this asset? This cannot be undone.')) return;
    
    try {
      await axios.delete(`${API}/assets/${assetId}`, { withCredentials: true });
      toast.success('Asset deleted');
      fetchAssets();
      if (selectedAsset?.id === assetId) setSelectedAsset(null);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete asset');
    }
  };

  const groupedAssets = groupAssetsByType();

  return (
    <Layout>
      <div className="min-h-screen" style={{background: ''}}>
        <div className="space-y-6" style={{padding: '2rem', maxWidth: '95%', margin: '0 auto'}}>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{color: theme.text}}>Assets & Portfolio</h1>
                <p className="text-lg" style={{color: theme.textSecondary}}>Manage your wealth in one place</p>
              </div>
              
              {/* Account Switcher - Demo Mode & Connected Accounts */}
              {((demoMode && testAccountData) || connectedAccounts.length > 0) && (
                <div className="ml-6">
                  <Label className="text-xs mb-2 block" style={{color: theme.textSecondary}}>VIEWING ACCOUNT</Label>
                  <Select value={activeAccount} onValueChange={setActiveAccount}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white" style={{width: '320px'}}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {/* Own Account */}
                      <SelectItem value="own" className="text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{background: '#a855f7'}}></div>
                          <span>My Portfolio</span>
                        </div>
                      </SelectItem>
                      
                      {/* Test Account - Demo Mode Only */}
                      {demoMode && testAccountData && (
                        <SelectItem value="test_account" className="text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{background: '#f59e0b'}}></div>
                            <span>🔍 {testAccountData.account_name} (Demo)</span>
                          </div>
                        </SelectItem>
                      )}
                      
                      {/* Connected Accounts Where User is Nominee */}
                      {connectedAccounts.map((account) => (
                        <SelectItem key={account.account_id} value={account.account_id} className="text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{background: '#10b981'}}></div>
                            <span>👤 {account.account_name} ({account.access_type})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeAccount !== 'own' && (
                    <p className="text-xs mt-1" style={{color: '#10b981'}}>
                      ✓ Viewing as nominee - Read-only access
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 items-center">
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setDialogType('asset');
                    setDialogOpen(true);
                  }}
                  className="text-white"
                  style={{background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'}}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>
                <Button 
                  onClick={() => {
                    setDialogType('liability');
                    setDialogOpen(true);
                  }}
                  className="text-white"
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)'}}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Liability
                </Button>
              </div>
            </div>
          </div>

        {/* Jump Pills - Section Shortcuts with ALL filter */}
        <div className="flex flex-wrap gap-2">
          {/* ALL pill */}
          <button
            onClick={() => setActiveFilter('all')}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: activeFilter === 'all' 
                ? (colorTheme === 'light' ? '#ca8a04' : '#eab308')
                : (colorTheme === 'light' ? 'rgba(202, 138, 4, 0.15)' : 'rgba(234, 179, 8, 0.15)'),
              border: `1.5px solid ${activeFilter === 'all' 
                ? (colorTheme === 'light' ? '#ca8a04' : '#eab308')
                : (colorTheme === 'light' ? 'rgba(202, 138, 4, 0.4)' : 'rgba(234, 179, 8, 0.4)')}`,
              color: activeFilter === 'all' 
                ? '#ffffff'
                : (colorTheme === 'light' ? '#ca8a04' : '#eab308'),
              fontWeight: activeFilter === 'all' ? 700 : 600
            }}
          >
            ALL
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{
              background: activeFilter === 'all' 
                ? 'rgba(255, 255, 255, 0.25)' 
                : (colorTheme === 'light' ? 'rgba(202, 138, 4, 0.2)' : 'rgba(234, 179, 8, 0.2)')
            }}>
              {assets.length}
            </span>
          </button>
          
          {Object.keys(ASSET_GROUPS).map(groupKey => {
            const group = ASSET_GROUPS[groupKey];
            const groupAssets = groupedAssets[groupKey] || [];
            if (groupAssets.length === 0) return null;
            
            const pillColor = colorTheme === 'light' ? group.colorLight : group.color;
            
            return (
              <button
                key={groupKey}
                onClick={() => setActiveFilter(groupKey)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                style={{
                  background: activeFilter === groupKey 
                    ? pillColor
                    : (colorTheme === 'light' ? `${pillColor}20` : `${pillColor}15`),
                  border: `1.5px solid ${activeFilter === groupKey 
                    ? pillColor
                    : (colorTheme === 'light' ? `${pillColor}50` : `${pillColor}40`)}`,
                  color: activeFilter === groupKey 
                    ? '#ffffff'
                    : pillColor,
                  fontWeight: activeFilter === groupKey ? 700 : 600
                }}
              >
                <span className="mr-2">{group.icon}</span>
                {group.label}
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{
                  background: activeFilter === groupKey 
                    ? 'rgba(255, 255, 255, 0.25)' 
                    : (colorTheme === 'light' ? `${pillColor}25` : `${pillColor}20`)
                }}>
                  {groupAssets.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Layout: Full Width Table */}
        <div className="w-full relative">
          {/* Converting Overlay */}
          {converting && (
            <div className="absolute inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center rounded-lg">
              <div className="p-4 rounded-lg" style={{background: theme.cardBg, border: '2px solid #E8C27C'}}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor: '#E8C27C', borderTopColor: 'transparent'}}></div>
                  <span style={{color: '#E8C27C', fontWeight: 600}}>Converting to {selectedCurrency}...</span>
                </div>
              </div>
            </div>
          )}
          
          <Card style={{background: theme.cardBg, borderColor: theme.border, padding: 0}}>
            <CardContent className="p-0">
              <div style={{maxHeight: 'calc(100vh - 280px)', overflowY: 'auto'}}>
                <table className="w-full" style={{fontSize: '0.813rem'}}>
                    <thead style={{background: theme.backgroundTertiary, borderBottom: `2px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 10}}>
                      <tr>
                        <th className="text-left p-3" style={{color: theme.textSecondary, fontWeight: 600, width: '30%'}}>Asset</th>
                        <th className="text-right p-3" style={{color: theme.textSecondary, fontWeight: 600}}>Purchase (Original)</th>
                        <th className="text-right p-3" style={{color: theme.textSecondary, fontWeight: 600}}>Purchase ({selectedCurrency})</th>
                        <th className="text-right p-3" style={{color: theme.textSecondary, fontWeight: 600}}>Current ({selectedCurrency})</th>
                        <th className="text-right p-3" style={{color: theme.textSecondary, fontWeight: 600}}>Gain/Loss</th>
                        <th className="text-center p-3" style={{color: theme.textSecondary, fontWeight: 600}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                    {Object.keys(ASSET_GROUPS).map(groupKey => {
                      const group = ASSET_GROUPS[groupKey];
                      const groupAssets = groupedAssets[groupKey] || [];
                      
                      // Skip if no assets or filtered out
                      if (groupAssets.length === 0) return null;
                      if (activeFilter !== 'all' && activeFilter !== groupKey) return null;
                      
                      const isExpanded = expandedGroups.includes(groupKey);
                      const isLiability = groupKey === 'liabilities';
                      
                      // Calculate group total
                      const groupTotal = groupAssets.reduce((sum, asset) => {
                        return sum + calculateAssetValue(asset, true);
                      }, 0);
                      
                      const groupColor = colorTheme === 'light' ? group.colorLight : group.color;
                      
                      return (
                        <>
                          {/* Group Header Row */}
                          <tr 
                            id={`group-${groupKey}`}
                            key={`group-${groupKey}`}
                            onClick={() => toggleGroup(groupKey)}
                            className="cursor-pointer transition-all"
                            style={{
                              background: colorTheme === 'light'
                                ? (isLiability ? 'rgba(220, 38, 38, 0.08)' : `${groupColor}15`)
                                : (isLiability ? 'rgba(239, 68, 68, 0.12)' : `${groupColor}15`),
                              borderTop: `2px solid ${groupColor}${colorTheme === 'light' ? '50' : '40'}`,
                              borderBottom: `1px solid ${groupColor}${colorTheme === 'light' ? '40' : '30'}`
                            }}
                          >
                            <td colSpan="2" className="p-3">
                              <div className="flex items-center gap-3">
                                {isExpanded ? 
                                  <ChevronDown className="w-4 h-4" style={{color: groupColor}} /> : 
                                  <ChevronRight className="w-4 h-4" style={{color: groupColor}} />
                                }
                                <span className="text-xl">{group.icon}</span>
                                <span className="font-bold" style={{color: theme.text, fontSize: '0.938rem'}}>
                                  {group.label}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{
                                  background: colorTheme === 'light' ? `${groupColor}20` : `${groupColor}20`, 
                                  color: groupColor
                                }}>
                                  {groupAssets.length}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-right" colSpan="2">
                              <span className="font-bold" style={{color: groupColor, fontSize: '0.938rem'}}>
                                {isLiability ? '-' : ''}{formatCurrency(groupTotal, selectedCurrency, currencyFormat)}
                              </span>
                            </td>
                            <td colSpan="2"></td>
                          </tr>
                          
                          {/* Group Assets Rows */}
                          {isExpanded && groupAssets.map((asset) => {
                            const purchaseValue = calculateAssetValue(asset, false);
                            const currentValue = calculateAssetValue(asset, true) || purchaseValue;
                            const gain = currentValue - purchaseValue;
                            const gainPercent = purchaseValue ? ((gain / purchaseValue) * 100).toFixed(2) : 0;
                            
                            return (
                              <tr 
                                key={asset.id}
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setEditModalOpen(true);
                                }}
                                className="cursor-pointer transition-all"
                                style={{
                                  background: 'transparent',
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  borderLeft: '3px solid transparent'
                                }}
                              >
                                {/* Asset Name - Clickable */}
                                <td className="p-3" onClick={() => {
                                  setSelectedAsset(asset);
                                  setEditModalOpen(true);
                                }}>
                                  <div className="flex items-center gap-2">
                                    <span style={{color: theme.text, fontWeight: 500}}>{asset.name}</span>
                                    {asset.symbol && (
                                      <span className="text-xs px-2 py-0.5 rounded" style={{background: theme.backgroundSecondary, color: theme.textSecondary}}>
                                        {asset.symbol}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                
                                {/* Purchase Value - Original Currency */}
                                <td className="p-3 text-right" onClick={() => setSelectedAsset(asset)} style={{color: theme.textSecondary, fontSize: '0.813rem'}}>
                                  {asset.purchase_currency} {purchaseValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                </td>
                                
                                {/* Purchase Value - Converted Currency */}
                                <td className="p-3 text-right" onClick={() => setSelectedAsset(asset)} style={{color: theme.textSecondary, fontSize: '0.813rem', fontWeight: 500}}>
                                  {formatCurrency(purchaseValue, selectedCurrency, currencyFormat)}
                                </td>
                                
                                {/* Current Value - Converted Currency */}
                                <td className="p-3 text-right" onClick={() => {
                                  setSelectedAsset(asset);
                                  setEditModalOpen(true);
                                }}>
                                  <span style={{
                                    color: isLiability 
                                      ? (colorTheme === 'light' ? '#dc2626' : '#ef4444')
                                      : (colorTheme === 'light' ? '#0891b2' : '#06b6d4'), 
                                    fontWeight: 600
                                  }}>
                                    {formatCurrency(currentValue, selectedCurrency, currencyFormat)}
                                  </span>
                                </td>
                                
                                {/* Gain/Loss */}
                                <td className="p-3 text-right" onClick={() => setSelectedAsset(asset)}>
                                  {!isLiability && gain !== 0 && (
                                    <div>
                                      <div style={{
                                        color: gain > 0 
                                          ? (colorTheme === 'light' ? '#059669' : '#10b981')
                                          : (colorTheme === 'light' ? '#dc2626' : '#ef4444'), 
                                        fontWeight: 600, 
                                        fontSize: '0.813rem'
                                      }}>
                                        {gain > 0 ? '↑' : '↓'} {formatCurrency(Math.abs(gain), selectedCurrency, currencyFormat)}
                                      </div>
                                      <div className="text-xs" style={{
                                        color: gain > 0 
                                          ? (colorTheme === 'light' ? '#059669' : '#10b981')
                                          : (colorTheme === 'light' ? '#dc2626' : '#ef4444')
                                      }}>
                                        ({gainPercent}%)
                                      </div>
                                    </div>
                                  )}
                                </td>
                                
                                {/* Actions - Stop propagation */}
                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  {(activeAccount === 'test_account' || activeAccount !== 'own') ? (
                                    // Read-only mode for test account or connected accounts
                                    <div className="text-xs px-2 py-1 rounded" style={{background: 'rgba(148, 163, 184, 0.1)', color: theme.textSecondary}}>
                                      Read-Only
                                    </div>
                                  ) : (
                                    <div className="flex justify-center gap-1">
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => {
                                          setSelectedAsset(asset);
                                          setEditModalOpen(true);
                                        }} 
                                        style={{
                                          height: '28px', 
                                          padding: '0 0.5rem',
                                          background: 'rgba(232, 194, 124, 0.1)',
                                          border: '1px solid rgba(232, 194, 124, 0.3)',
                                          color: '#E8C27C'
                                        }}
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => handleDeleteAsset(asset.id)} 
                                        style={{
                                          color: '#FF5C73', 
                                          height: '28px', 
                                          padding: '0 0.5rem',
                                          background: 'rgba(255, 92, 115, 0.1)',
                                          border: '1px solid rgba(255, 92, 115, 0.3)'
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      );
                    })}
                  </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Comprehensive Edit Asset Modal */}
        {selectedAsset && editModalOpen && (
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="max-w-4xl" style={{background: theme.cardBg, borderColor: theme.border, maxHeight: '90vh', overflowY: 'auto'}}>
              <DialogHeader>
                <DialogTitle style={{color: theme.text, fontSize: '1.5rem'}}>
                  Edit Asset: {selectedAsset.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="pt-4">
                <p className="text-sm mb-4" style={{color: theme.textSecondary}}>
                  Update asset details below. Changes are saved immediately.
                </p>
                
                {/* Full edit form will go here - using AddAssetForm component */}
                <AddAssetForm 
                  editingAsset={selectedAsset}
                  onSuccess={() => {
                    setEditModalOpen(false);
                    setSelectedAsset(null);
                    fetchAssets();
                  }}
                  onCancel={() => {
                    setEditModalOpen(false);
                    setSelectedAsset(null);
                  }}
                />
                
                {/* Loan Calculator for Loans/Credit Cards */}
                {(selectedAsset.type === 'loan' || selectedAsset.type === 'credit_card') && (
                  <div className="mt-6 pt-6" style={{borderTop: '2px solid #2d1f3d'}}>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{color: theme.text}}>
                      <Calculator className="w-5 h-5" style={{color: '#E8C27C'}} />
                      Loan Repayment Calculator
                    </h3>
                    
                    {!loanCalcData ? (
                      <Button 
                        onClick={() => calculateLoanDetails(selectedAsset)}
                        className="w-full mb-4"
                        style={{background: 'linear-gradient(135deg, #E8C27C 0%, #F5D49F 100%)', color: '#0B0B11'}}
                      >
                        Calculate Payment Schedule
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {/* Interactive Sliders */}
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg" style={{background: 'rgba(232, 194, 124, 0.05)', border: '1px solid rgba(232, 194, 124, 0.2)'}}>
                          <div>
                            <Label className="text-slate-300 text-sm mb-2 flex justify-between">
                              <span>Interest Rate (%)</span>
                              <span className="font-bold" style={{color: '#E8C27C'}}>{loanParams.interestRate}%</span>
                            </Label>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              step="0.5"
                              value={loanParams.interestRate}
                              onChange={(e) => {
                                const newRate = parseFloat(e.target.value);
                                setLoanParams({...loanParams, interestRate: newRate});
                                recalculateLoan(selectedAsset.principal_amount, newRate, loanParams.tenure);
                              }}
                              className="w-full"
                              style={{accentColor: '#E8C27C'}}
                            />
                            <p className="text-xs mt-1" style={{color: '#64748b'}}>Adjust to see impact</p>
                          </div>
                          
                          <div>
                            <Label className="text-slate-300 text-sm mb-2 flex justify-between">
                              <span>Tenure (months)</span>
                              <span className="font-bold" style={{color: '#E8C27C'}}>{loanParams.tenure} mo</span>
                            </Label>
                            <input
                              type="range"
                              min="6"
                              max="360"
                              step="6"
                              value={loanParams.tenure}
                              onChange={(e) => {
                                const newTenure = parseInt(e.target.value);
                                setLoanParams({...loanParams, tenure: newTenure});
                                recalculateLoan(selectedAsset.principal_amount, loanParams.interestRate, newTenure);
                              }}
                              className="w-full"
                              style={{accentColor: '#E8C27C'}}
                            />
                            <p className="text-xs mt-1" style={{color: '#64748b'}}>
                              {Math.floor(loanParams.tenure / 12)} years {loanParams.tenure % 12} months
                            </p>
                          </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                            <div className="text-xs mb-1" style={{color: theme.textSecondary}}>Monthly Payment</div>
                            <div className="text-xl font-bold" style={{color: '#a855f7'}}>
                              ${loanCalcData.monthly_payment.toLocaleString()}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg" style={{background: 'rgba(255, 92, 115, 0.1)', border: '1px solid rgba(255, 92, 115, 0.3)'}}>
                            <div className="text-xs mb-1" style={{color: theme.textSecondary}}>Total Interest</div>
                            <div className="text-xl font-bold" style={{color: '#FF5C73'}}>
                              ${loanCalcData.total_interest.toLocaleString()}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg" style={{background: 'rgba(75, 224, 161, 0.1)', border: '1px solid rgba(75, 224, 161, 0.3)'}}>
                            <div className="text-xs mb-1" style={{color: theme.textSecondary}}>Total Amount</div>
                            <div className="text-xl font-bold" style={{color: '#4BE0A1'}}>
                              ${loanCalcData.total_amount.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Savings Indicator */}
                        {(loanParams.interestRate < selectedAsset.interest_rate || loanParams.tenure < selectedAsset.tenure_months) && (
                          <div className="p-3 rounded-lg" style={{background: 'rgba(75, 224, 161, 0.1)', border: '1px solid rgba(75, 224, 161, 0.3)'}}>
                            <p className="text-sm font-semibold" style={{color: '#4BE0A1'}}>
                              💰 Potential Savings Detected!
                            </p>
                            <p className="text-xs" style={{color: theme.textSecondary}}>
                              By adjusting your loan terms, you could save on interest. Consider refinancing.
                            </p>
                          </div>
                        )}

                        {/* Amortization Schedule */}
                        <div>
                          <div className="text-xs font-semibold mb-2" style={{color: theme.textSecondary}}>
                            PAYMENT SCHEDULE (First 12 months)
                          </div>
                          <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                            <table className="w-full" style={{fontSize: '0.75rem'}}>
                              <thead style={{background: theme.backgroundTertiary, position: 'sticky', top: 0}}>
                                <tr>
                                  <th className="p-1.5 text-left" style={{color: theme.textSecondary}}>Mo</th>
                                  <th className="p-1.5 text-right" style={{color: theme.textSecondary}}>Principal</th>
                                  <th className="p-1.5 text-right" style={{color: theme.textSecondary}}>Interest</th>
                                  <th className="p-1.5 text-right" style={{color: theme.textSecondary}}>Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {loanCalcData.amortization_schedule.slice(0, 12).map((entry) => (
                                  <tr key={entry.month} style={{borderBottom: '1px solid rgba(255,255,255,0.03)'}}>
                                    <td className="p-1.5" style={{color: theme.textSecondary}}>{entry.month}</td>
                                    <td className="p-1.5 text-right" style={{color: '#4BE0A1'}}>${entry.principal_payment.toLocaleString()}</td>
                                    <td className="p-1.5 text-right" style={{color: '#FF5C73'}}>${entry.interest_payment.toLocaleString()}</td>
                                    <td className="p-1.5 text-right" style={{color: theme.textSecondary}}>${entry.remaining_balance.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => setLoanCalcData(null)}
                          variant="outline"
                          size="sm"
                          style={{borderColor: theme.border, color: theme.textSecondary}}
                        >
                          Reset Calculator
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl" style={{background: theme.cardBg, borderColor: theme.border, maxHeight: '90vh', overflowY: 'auto'}}>
            <DialogHeader>
              <DialogTitle style={{color: theme.text, fontSize: '1.5rem'}}>
                {dialogType === 'liability' ? 'Add New Liability' : 'Add New Asset'}
              </DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <AddAssetForm
                initialType={dialogType} 
                onSuccess={() => {
                  setDialogOpen(false);
                  fetchAssets();
                }}
                onCancel={() => setDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </Layout>
  );
}
