import { useState, useEffect } from 'react';
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
import { formatCurrency } from '@/utils/currencyConversion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddAssetForm from '@/components/AddAssetForm';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Asset type groups for organized display
const ASSET_GROUPS = {
  investments: {
    label: 'Stocks & Bonds',
    icon: '📈',
    types: ['stock', 'investment'],
    color: '#4BE0A1'
  },
  crypto: {
    label: 'Cryptocurrency',
    icon: '₿',
    types: ['crypto', 'portfolio'],
    color: '#5CE3D7'
  },
  realEstate: {
    label: 'Real Estate',
    icon: '🏠',
    types: ['property'],
    color: '#CF8F86'
  },
  banking: {
    label: 'Banking & Cash',
    icon: '🏦',
    types: ['bank'],
    color: '#E8C27C'
  },
  valuables: {
    label: 'Valuables & Others',
    icon: '💎',
    types: ['precious_metals', 'diamond', 'locker', 'insurance'],
    color: '#F5C26B'
  },
  liabilities: {
    label: 'Loans & Debts',
    icon: '💳',
    types: ['loan', 'credit_card'],
    color: '#FF5C73'
  }
};

export default function AssetsNew() {
  const { selectedCurrency, currencyFormat } = useApp();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState(Object.keys(ASSET_GROUPS));
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loanCalcData, setLoanCalcData] = useState(null);
  const [calculatingLoan, setCalculatingLoan] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailViewMode, setDetailViewMode] = useState('sidebar'); // 'sidebar' or 'modal'
  const [activeFilter, setActiveFilter] = useState('all'); // Filter by asset group

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
    Object.keys(ASSET_GROUPS).forEach(key => {
      const group = ASSET_GROUPS[key];
      grouped[key] = assets.filter(asset => group.types.includes(asset.type));
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

  const startInlineEdit = (asset) => {
    setEditingAssetId(asset.id);
    setEditValues({
      name: asset.name,
      current_value: calculateAssetValue(asset, true),
      notes: asset.details?.notes || ''
    });
  };

  const saveInlineEdit = async (assetId) => {
    try {
      const asset = assets.find(a => a.id === assetId);
      await axios.put(`${API}/assets/${assetId}`, {
        ...asset,
        name: editValues.name,
        current_value: parseFloat(editValues.current_value) || undefined,
        details: { ...asset.details, notes: editValues.notes }
      }, { withCredentials: true });
      
      toast.success('Asset updated');
      setEditingAssetId(null);
      fetchAssets();
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Update failed');
    }
  };

  const calculateLoanDetails = async (asset) => {
    if (!asset.principal_amount || !asset.interest_rate || !asset.tenure_months) {
      toast.error('Missing loan details for calculation');
      return;
    }

    setCalculatingLoan(true);
    try {
      const response = await axios.post(`${API}/loan-calculator`, {
        principal: asset.principal_amount || asset.total_value,
        annual_interest_rate: asset.interest_rate,
        tenure_months: asset.tenure_months,
        loan_type: asset.type
      }, { withCredentials: true });
      
      setLoanCalcData(response.data);
    } catch (error) {
      console.error('Loan calculation failed:', error);
      toast.error('Failed to calculate loan details');
    } finally {
      setCalculatingLoan(false);
    }
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
      <div className="min-h-screen" style={{background: '#0b0b11'}}>
        <div className="space-y-6" style={{padding: '2rem', maxWidth: '95%', margin: '0 auto'}}>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{color: '#FFFFFF'}}>Assets & Portfolio</h1>
              <p className="text-lg" style={{color: 'rgba(255,255,255,0.65)'}}>Manage your wealth in one place</p>
            </div>
            <div className="flex gap-3 items-center">
              {/* View Mode Toggle */}
              <div className="flex gap-2 p-1 rounded-lg" style={{background: 'rgba(255,255,255,0.05)'}}>
                <button
                  onClick={() => setDetailViewMode('sidebar')}
                  className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
                  style={{
                    background: detailViewMode === 'sidebar' ? '#E8C27C' : 'transparent',
                    color: detailViewMode === 'sidebar' ? '#0B0B11' : 'rgba(255,255,255,0.6)'
                  }}
                >
                  Side Panel
                </button>
                <button
                  onClick={() => setDetailViewMode('modal')}
                  className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
                  style={{
                    background: detailViewMode === 'modal' ? '#E8C27C' : 'transparent',
                    color: detailViewMode === 'modal' ? '#0B0B11' : 'rgba(255,255,255,0.6)'
                  }}
                >
                  Modal
                </button>
              </div>
              
              <Button 
                onClick={() => setDialogOpen(true)}
                className="text-white"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </Button>
            </div>
          </div>

        {/* Jump Pills - Section Shortcuts with ALL filter */}
        <div className="flex flex-wrap gap-2">
          {/* ALL pill */}
          <button
            onClick={() => setActiveFilter('all')}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: activeFilter === 'all' ? '#E8C27C' : 'rgba(232, 194, 124, 0.15)',
              border: `1.5px solid ${activeFilter === 'all' ? '#E8C27C' : 'rgba(232, 194, 124, 0.4)'}`,
              color: activeFilter === 'all' ? '#0B0B11' : '#E8C27C',
              fontWeight: activeFilter === 'all' ? 700 : 600
            }}
          >
            ALL
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{
              background: activeFilter === 'all' ? 'rgba(11, 11, 17, 0.2)' : 'rgba(232, 194, 124, 0.2)'
            }}>
              {assets.length}
            </span>
          </button>
          
          {Object.keys(ASSET_GROUPS).map(groupKey => {
            const group = ASSET_GROUPS[groupKey];
            const groupAssets = groupedAssets[groupKey] || [];
            if (groupAssets.length === 0) return null;
            
            return (
              <button
                key={groupKey}
                onClick={() => setActiveFilter(groupKey)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                style={{
                  background: activeFilter === groupKey ? group.color : `${group.color}15`,
                  border: `1.5px solid ${activeFilter === groupKey ? group.color : `${group.color}40`}`,
                  color: activeFilter === groupKey ? '#0B0B11' : group.color,
                  fontWeight: activeFilter === groupKey ? 700 : 600
                }}
              >
                <span className="mr-2">{group.icon}</span>
                {group.label}
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{
                  background: activeFilter === groupKey ? 'rgba(11, 11, 17, 0.2)' : `${group.color}20`
                }}>
                  {groupAssets.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Layout: Table + Detail Panel */}
        <div className="grid grid-cols-12 gap-6">
          {/* Assets Table - Left Side - Scrollable */}
          <div className={selectedAsset ? 'col-span-7' : 'col-span-12'}>
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d', padding: 0}}>
              <CardContent className="p-0">
                <div style={{maxHeight: 'calc(100vh - 280px)', overflowY: 'auto'}}>
                  <table className="w-full" style={{fontSize: '0.813rem'}}>
                    <thead style={{background: '#0E0F16', borderBottom: '2px solid #2d1f3d', position: 'sticky', top: 0, zIndex: 10}}>
                      <tr>
                        <th className="text-left p-3" style={{color: '#94a3b8', fontWeight: 600, width: '30%'}}>Asset</th>
                        <th className="text-right p-3" style={{color: '#94a3b8', fontWeight: 600}}>Purchase (Original)</th>
                        <th className="text-right p-3" style={{color: '#94a3b8', fontWeight: 600}}>Purchase ({selectedCurrency})</th>
                        <th className="text-right p-3" style={{color: '#94a3b8', fontWeight: 600}}>Current ({selectedCurrency})</th>
                        <th className="text-right p-3" style={{color: '#94a3b8', fontWeight: 600}}>Gain/Loss</th>
                        <th className="text-center p-3" style={{color: '#94a3b8', fontWeight: 600}}>Actions</th>
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
                      
                      return (
                        <>
                          {/* Group Header Row */}
                          <tr 
                            id={`group-${groupKey}`}
                            key={`group-${groupKey}`}
                            onClick={() => toggleGroup(groupKey)}
                            className="cursor-pointer transition-all"
                            style={{
                              background: isLiability 
                                ? 'rgba(255, 92, 115, 0.12)' 
                                : `${group.color}15`,
                              borderTop: `2px solid ${group.color}40`,
                              borderBottom: `1px solid ${group.color}30`
                            }}
                          >
                            <td colSpan="2" className="p-3">
                              <div className="flex items-center gap-3">
                                {isExpanded ? 
                                  <ChevronDown className="w-4 h-4" style={{color: group.color}} /> : 
                                  <ChevronRight className="w-4 h-4" style={{color: group.color}} />
                                }
                                <span className="text-xl">{group.icon}</span>
                                <span className="font-bold" style={{color: '#f8fafc', fontSize: '0.938rem'}}>
                                  {group.label}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{background: `${group.color}20`, color: group.color}}>
                                  {groupAssets.length}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-right" colSpan="2">
                              <span className="font-bold" style={{color: group.color, fontSize: '0.938rem'}}>
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
                            const isEditing = editingAssetId === asset.id;
                            
                            return (
                              <tr 
                                key={asset.id}
                                className="cursor-pointer transition-all"
                                style={{
                                  background: selectedAsset?.id === asset.id ? 'rgba(232, 194, 124, 0.08)' : 'transparent',
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  borderLeft: selectedAsset?.id === asset.id ? '3px solid #E8C27C' : '3px solid transparent'
                                }}
                              >
                                {/* Asset Name - Clickable but stops propagation for edit mode */}
                                <td className="p-3" onClick={(e) => {
                                  if (!isEditing) setSelectedAsset(asset);
                                  else e.stopPropagation();
                                }}>
                                  {isEditing ? (
                                    <Input 
                                      value={editValues.name}
                                      onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                                      className="bg-slate-800 border-slate-700 text-white text-sm"
                                      style={{height: '32px', padding: '0.5rem'}}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span style={{color: '#f8fafc', fontWeight: 500}}>{asset.name}</span>
                                      {asset.symbol && (
                                        <span className="text-xs px-2 py-0.5 rounded" style={{background: '#2d1f3d', color: '#94a3b8'}}>
                                          {asset.symbol}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                
                                {/* Purchase Value - Original Currency */}
                                <td className="p-3 text-right" onClick={() => setSelectedAsset(asset)} style={{color: '#94a3b8', fontSize: '0.813rem'}}>
                                  {asset.purchase_currency} {purchaseValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                </td>
                                
                                {/* Purchase Value - Converted Currency */}
                                <td className="p-3 text-right" onClick={() => setSelectedAsset(asset)} style={{color: '#cbd5e1', fontSize: '0.813rem', fontWeight: 500}}>
                                  {formatCurrency(purchaseValue, selectedCurrency, currencyFormat)}
                                </td>
                                
                                {/* Current Value - Converted Currency - Editable */}
                                <td className="p-3 text-right" onClick={(e) => {
                                  if (!isEditing) setSelectedAsset(asset);
                                  else e.stopPropagation();
                                }}>
                                  {isEditing ? (
                                    <Input 
                                      type="number"
                                      value={editValues.current_value}
                                      onChange={(e) => setEditValues({...editValues, current_value: e.target.value})}
                                      className="bg-slate-800 border-slate-700 text-white text-right text-sm"
                                      style={{height: '32px', padding: '0.5rem'}}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span style={{color: isLiability ? '#FF5C73' : '#5CE3D7', fontWeight: 600}}>
                                      {formatCurrency(currentValue, selectedCurrency, currencyFormat)}
                                    </span>
                                  )}
                                </td>
                                
                                {/* Gain/Loss */}
                                <td className="p-3 text-right" onClick={() => setSelectedAsset(asset)}>
                                  {!isLiability && gain !== 0 && (
                                    <div>
                                      <div style={{color: gain > 0 ? '#4BE0A1' : '#FF5C73', fontWeight: 600, fontSize: '0.813rem'}}>
                                        {gain > 0 ? '↑' : '↓'} {formatCurrency(Math.abs(gain), selectedCurrency, currencyFormat)}
                                      </div>
                                      <div className="text-xs" style={{color: gain > 0 ? '#4BE0A1' : '#FF5C73'}}>
                                        ({gainPercent}%)
                                      </div>
                                    </div>
                                  )}
                                </td>
                                
                                {/* Actions - Stop propagation */}
                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-center gap-1">
                                    {isEditing ? (
                                      <>
                                        <Button size="sm" onClick={() => saveInlineEdit(asset.id)} style={{background: '#10b981', color: '#fff', height: '28px', padding: '0 0.5rem'}}>
                                          <Check className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" onClick={() => setEditingAssetId(null)} style={{background: '#ef4444', color: '#fff', height: '28px', padding: '0 0.5rem'}}>
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          onClick={() => startInlineEdit(asset)} 
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
                                      </>
                                    )}
                                  </div>
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

          {/* Detail Panel - Right Side - FIXED POSITION (Sidebar Mode) */}
          {selectedAsset && detailViewMode === 'sidebar' && (
            <div className="col-span-5" style={{position: 'relative'}}>
              <div style={{position: 'sticky', top: '1rem', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto'}}>
                <Card style={{background: '#1a1229', borderColor: '#a855f7', borderWidth: '2px'}}>
                  <CardHeader style={{borderBottom: '1px solid #2d1f3d', padding: '1rem'}}>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle style={{color: '#f8fafc', fontSize: '1.125rem'}}>{selectedAsset.name}</CardTitle>
                        <p className="text-xs mt-1" style={{color: '#94a3b8'}}>Side Panel View</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedAsset(null);
                          setLoanCalcData(null);
                        }} 
                        style={{
                          height: '32px', 
                          width: '32px', 
                          padding: 0,
                          background: 'rgba(255, 92, 115, 0.15)',
                          border: '1px solid rgba(255, 92, 115, 0.3)',
                          color: '#FF5C73'
                        }}
                        title="Close panel"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4" style={{padding: '1rem'}}>
                    {/* Asset Details */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{color: '#94a3b8'}}>Type:</span>
                        <span style={{color: '#f8fafc', fontWeight: 600}}>{selectedAsset.type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{color: '#94a3b8'}}>Purchase Date:</span>
                        <span style={{color: '#f8fafc'}}>{selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      {selectedAsset.quantity && (
                        <div className="flex justify-between text-sm">
                          <span style={{color: '#94a3b8'}}>Quantity:</span>
                          <span style={{color: '#f8fafc', fontWeight: 600}}>{selectedAsset.quantity}</span>
                        </div>
                      )}
                      {selectedAsset.area && (
                        <div className="flex justify-between text-sm">
                          <span style={{color: '#94a3b8'}}>Area:</span>
                          <span style={{color: '#f8fafc'}}>{selectedAsset.area} {selectedAsset.area_unit}</span>
                        </div>
                      )}
                      {selectedAsset.weight && (
                        <div className="flex justify-between text-sm">
                          <span style={{color: '#94a3b8'}}>Weight:</span>
                          <span style={{color: '#f8fafc'}}>{selectedAsset.weight} {selectedAsset.weight_unit}</span>
                        </div>
                      )}
                    </div>

                    {/* Loan Calculator Section - Only for Loans/Credit Cards */}
                    {(selectedAsset.type === 'loan' || selectedAsset.type === 'credit_card') && (
                      <div className="pt-4" style={{borderTop: '2px solid #2d1f3d'}}>
                        <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{color: '#f8fafc'}}>
                          <Calculator className="w-4 h-4" style={{color: '#E8C27C'}} />
                          Repayment Calculator
                        </h3>
                        
                        <Button 
                          onClick={() => calculateLoanDetails(selectedAsset)}
                          disabled={calculatingLoan}
                          className="w-full mb-3"
                          style={{background: 'linear-gradient(135deg, #E8C27C 0%, #F5D49F 100%)', color: '#0B0B11', fontSize: '0.875rem', padding: '0.625rem'}}
                        >
                          {calculatingLoan ? 'Calculating...' : 'Calculate Payment Schedule'}
                        </Button>

                        {loanCalcData && (
                          <div className="space-y-3">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                                <div className="text-xs mb-1" style={{color: '#94a3b8'}}>Monthly</div>
                                <div className="text-base font-bold" style={{color: '#a855f7'}}>
                                  ${loanCalcData.monthly_payment.toLocaleString()}
                                </div>
                              </div>
                              <div className="p-2 rounded-lg" style={{background: 'rgba(255, 92, 115, 0.1)', border: '1px solid rgba(255, 92, 115, 0.3)'}}>
                                <div className="text-xs mb-1" style={{color: '#94a3b8'}}>Interest</div>
                                <div className="text-base font-bold" style={{color: '#FF5C73'}}>
                                  ${loanCalcData.total_interest.toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {/* AI Tips */}
                            {loanCalcData.ai_tips && !loanCalcData.ai_tips.includes('unavailable') && (
                              <div className="p-3 rounded-lg" style={{background: 'rgba(232, 194, 124, 0.08)', border: '1px solid rgba(232, 194, 124, 0.2)'}}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="w-3 h-3" style={{color: '#E8C27C'}} />
                                  <span className="text-xs font-semibold" style={{color: '#E8C27C'}}>AI TIPS</span>
                                </div>
                                <div className="text-xs whitespace-pre-wrap" style={{color: '#cbd5e1', lineHeight: '1.5', maxHeight: '120px', overflowY: 'auto'}}>
                                  {loanCalcData.ai_tips}
                                </div>
                              </div>
                            )}

                            {/* Amortization Preview */}
                            <div>
                              <div className="text-xs font-semibold mb-2" style={{color: '#94a3b8'}}>
                                PAYMENT SCHEDULE (First 12 months)
                              </div>
                              <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                                <table className="w-full" style={{fontSize: '0.75rem'}}>
                                  <thead style={{background: '#16001e', position: 'sticky', top: 0}}>
                                    <tr>
                                      <th className="p-1.5 text-left" style={{color: '#94a3b8'}}>Mo</th>
                                      <th className="p-1.5 text-right" style={{color: '#94a3b8'}}>Principal</th>
                                      <th className="p-1.5 text-right" style={{color: '#94a3b8'}}>Interest</th>
                                      <th className="p-1.5 text-right" style={{color: '#94a3b8'}}>Balance</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {loanCalcData.amortization_schedule.slice(0, 12).map((entry) => (
                                      <tr key={entry.month} style={{borderBottom: '1px solid rgba(255,255,255,0.03)'}}>
                                        <td className="p-1.5" style={{color: '#cbd5e1'}}>{entry.month}</td>
                                        <td className="p-1.5 text-right" style={{color: '#4BE0A1'}}>${entry.principal_payment.toLocaleString()}</td>
                                        <td className="p-1.5 text-right" style={{color: '#FF5C73'}}>${entry.interest_payment.toLocaleString()}</td>
                                        <td className="p-1.5 text-right" style={{color: '#94a3b8'}}>${entry.remaining_balance.toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* More Details Button */}
                    <Button 
                      onClick={() => toast.info('Full edit modal - to be implemented')}
                      className="w-full"
                      variant="outline"
                      style={{borderColor: '#2d1f3d', color: '#94a3b8', fontSize: '0.875rem', padding: '0.625rem'}}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      View All Details
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Detail Panel - Modal Mode */}
          {selectedAsset && detailViewMode === 'modal' && (
            <Dialog open={true} onOpenChange={() => {
              setSelectedAsset(null);
              setLoanCalcData(null);
            }}>
              <DialogContent className="max-w-3xl" style={{background: '#1a1229', borderColor: '#a855f7', borderWidth: '2px', maxHeight: '90vh', overflowY: 'auto'}}>
                <DialogHeader>
                  <DialogTitle style={{color: '#f8fafc', fontSize: '1.25rem'}}>{selectedAsset.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {/* Asset Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex justify-between text-sm p-2 rounded" style={{background: 'rgba(255,255,255,0.03)'}}>
                      <span style={{color: '#94a3b8'}}>Type:</span>
                      <span style={{color: '#f8fafc', fontWeight: 600}}>{selectedAsset.type}</span>
                    </div>
                    <div className="flex justify-between text-sm p-2 rounded" style={{background: 'rgba(255,255,255,0.03)'}}>
                      <span style={{color: '#94a3b8'}}>Date:</span>
                      <span style={{color: '#f8fafc'}}>{selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    {selectedAsset.quantity && (
                      <div className="flex justify-between text-sm p-2 rounded" style={{background: 'rgba(255,255,255,0.03)'}}>
                        <span style={{color: '#94a3b8'}}>Quantity:</span>
                        <span style={{color: '#f8fafc', fontWeight: 600}}>{selectedAsset.quantity}</span>
                      </div>
                    )}
                    {selectedAsset.area && (
                      <div className="flex justify-between text-sm p-2 rounded" style={{background: 'rgba(255,255,255,0.03)'}}>
                        <span style={{color: '#94a3b8'}}>Area:</span>
                        <span style={{color: '#f8fafc'}}>{selectedAsset.area} {selectedAsset.area_unit}</span>
                      </div>
                    )}
                  </div>

                  {/* Loan Calculator for Modal View */}
                  {(selectedAsset.type === 'loan' || selectedAsset.type === 'credit_card') && (
                    <div className="pt-4" style={{borderTop: '2px solid #2d1f3d'}}>
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{color: '#f8fafc'}}>
                        <Calculator className="w-5 h-5" style={{color: '#E8C27C'}} />
                        Repayment Calculator
                      </h3>
                      
                      <Button 
                        onClick={() => calculateLoanDetails(selectedAsset)}
                        disabled={calculatingLoan}
                        className="w-full mb-4"
                        style={{background: 'linear-gradient(135deg, #E8C27C 0%, #F5D49F 100%)', color: '#0B0B11'}}
                      >
                        {calculatingLoan ? 'Calculating...' : 'Calculate Payment Schedule'}
                      </Button>

                      {loanCalcData && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                              <div className="text-xs mb-1" style={{color: '#94a3b8'}}>Monthly Payment</div>
                              <div className="text-xl font-bold" style={{color: '#a855f7'}}>
                                ${loanCalcData.monthly_payment.toLocaleString()}
                              </div>
                            </div>
                            <div className="p-3 rounded-lg" style={{background: 'rgba(255, 92, 115, 0.1)', border: '1px solid rgba(255, 92, 115, 0.3)'}}>
                              <div className="text-xs mb-1" style={{color: '#94a3b8'}}>Total Interest</div>
                              <div className="text-xl font-bold" style={{color: '#FF5C73'}}>
                                ${loanCalcData.total_interest.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {loanCalcData.ai_tips && !loanCalcData.ai_tips.includes('unavailable') && (
                            <div className="p-4 rounded-lg" style={{background: 'rgba(232, 194, 124, 0.08)', border: '1px solid rgba(232, 194, 124, 0.2)'}}>
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4" style={{color: '#E8C27C'}} />
                                <span className="text-sm font-semibold" style={{color: '#E8C27C'}}>AI TIPS</span>
                              </div>
                              <div className="text-sm whitespace-pre-wrap" style={{color: '#cbd5e1', lineHeight: '1.6', maxHeight: '200px', overflowY: 'auto'}}>
                                {loanCalcData.ai_tips}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-xs font-semibold mb-2" style={{color: '#94a3b8'}}>
                              PAYMENT SCHEDULE (First 12 months)
                            </div>
                            <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                              <table className="w-full" style={{fontSize: '0.813rem'}}>
                                <thead style={{background: '#16001e', position: 'sticky', top: 0}}>
                                  <tr>
                                    <th className="p-2 text-left" style={{color: '#94a3b8'}}>Month</th>
                                    <th className="p-2 text-right" style={{color: '#94a3b8'}}>Principal</th>
                                    <th className="p-2 text-right" style={{color: '#94a3b8'}}>Interest</th>
                                    <th className="p-2 text-right" style={{color: '#94a3b8'}}>Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {loanCalcData.amortization_schedule.slice(0, 12).map((entry) => (
                                    <tr key={entry.month} style={{borderBottom: '1px solid rgba(255,255,255,0.03)'}}>
                                      <td className="p-2" style={{color: '#cbd5e1'}}>{entry.month}</td>
                                      <td className="p-2 text-right" style={{color: '#4BE0A1'}}>${entry.principal_payment.toLocaleString()}</td>
                                      <td className="p-2 text-right" style={{color: '#FF5C73'}}>${entry.interest_payment.toLocaleString()}</td>
                                      <td className="p-2 text-right" style={{color: '#94a3b8'}}>${entry.remaining_balance.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Add Asset Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl" style={{background: '#1a1229', borderColor: '#2d1f3d', maxHeight: '90vh', overflowY: 'auto'}}>
            <DialogHeader>
              <DialogTitle style={{color: '#f8fafc', fontSize: '1.5rem'}}>Add New Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Asset Name *</Label>
                  <Input 
                    placeholder="e.g., Chase Savings, Bitcoin Wallet"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Asset Type *</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="bank" className="text-white">🏦 Bank Account</SelectItem>
                      <SelectItem value="crypto" className="text-white">₿ Cryptocurrency</SelectItem>
                      <SelectItem value="stock" className="text-white">📈 Stocks</SelectItem>
                      <SelectItem value="property" className="text-white">🏠 Real Estate</SelectItem>
                      <SelectItem value="loan" className="text-white">💸 Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Purchase Value *</Label>
                  <Input 
                    type="number"
                    placeholder="10000"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Currency</Label>
                  <Select defaultValue="USD">
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="USD" className="text-white">USD</SelectItem>
                      <SelectItem value="EUR" className="text-white">EUR</SelectItem>
                      <SelectItem value="GBP" className="text-white">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => {
                    toast.success('Asset will be added (full implementation pending)');
                    setDialogOpen(false);
                  }}
                  className="flex-1"
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: '#fff'}}
                >
                  Add Asset
                </Button>
                <Button 
                  onClick={() => setDialogOpen(false)}
                  variant="outline"
                  style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </Layout>
  );
}
