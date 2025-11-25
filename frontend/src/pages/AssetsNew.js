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
      <div className="space-y-6" style={{padding: '2rem 0'}}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{color: '#f8fafc'}}>Assets & Portfolio</h1>
            <p className="text-lg" style={{color: '#94a3b8'}}>Manage your wealth in one place</p>
          </div>
          <Button 
            onClick={() => toast.info('Add Asset dialog - to be implemented')}
            className="text-white"
            style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </div>

        {/* Main Layout: Table + Detail Panel */}
        <div className="grid grid-cols-12 gap-6">
          {/* Assets Table - Left Side */}
          <div className={selectedAsset ? 'col-span-7' : 'col-span-12'}>
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead style={{background: '#16001e', borderBottom: '2px solid #2d1f3d'}}>
                    <tr>
                      <th className="text-left p-4" style={{color: '#94a3b8', fontWeight: 600, width: '40%'}}>Asset</th>
                      <th className="text-right p-4" style={{color: '#94a3b8', fontWeight: 600}}>Purchase Value</th>
                      <th className="text-right p-4" style={{color: '#94a3b8', fontWeight: 600}}>Current Value</th>
                      <th className="text-right p-4" style={{color: '#94a3b8', fontWeight: 600}}>Gain/Loss</th>
                      <th className="text-center p-4" style={{color: '#94a3b8', fontWeight: 600}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(ASSET_GROUPS).map(groupKey => {
                      const group = ASSET_GROUPS[groupKey];
                      const groupAssets = groupedAssets[groupKey] || [];
                      
                      if (groupAssets.length === 0) return null;
                      
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
                            key={`group-${groupKey}`}
                            onClick={() => toggleGroup(groupKey)}
                            className="cursor-pointer transition-all"
                            style={{
                              background: isLiability 
                                ? 'rgba(220, 38, 38, 0.15)' 
                                : 'rgba(168, 85, 247, 0.1)',
                              borderTop: '2px solid #2d1f3d',
                              borderBottom: '1px solid #2d1f3d'
                            }}
                          >
                            <td colSpan="3" className="p-4">
                              <div className="flex items-center gap-3">
                                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                <span className="text-2xl">{group.icon}</span>
                                <span className="font-bold text-lg" style={{color: '#f8fafc'}}>
                                  {group.label}
                                </span>
                                <span className="text-sm px-3 py-1 rounded-full" style={{background: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1'}}>
                                  {groupAssets.length} {groupAssets.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <span className="font-bold text-lg" style={{color: group.color}}>
                                {isLiability ? '-' : ''}{formatCurrency(groupTotal, selectedCurrency, currencyFormat)}
                              </span>
                            </td>
                            <td></td>
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
                                onClick={() => setSelectedAsset(asset)}
                                className="cursor-pointer transition-all"
                                style={{
                                  background: selectedAsset?.id === asset.id ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                                  borderBottom: '1px solid #2d1f3d'
                                }}
                              >
                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                  {isEditing ? (
                                    <Input 
                                      value={editValues.name}
                                      onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                                      className="bg-slate-800 border-slate-700 text-white"
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
                                <td className="p-4 text-right" style={{color: '#cbd5e1'}}>
                                  {asset.purchase_currency} {purchaseValue.toLocaleString()}
                                </td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  {isEditing ? (
                                    <Input 
                                      type="number"
                                      value={editValues.current_value}
                                      onChange={(e) => setEditValues({...editValues, current_value: e.target.value})}
                                      className="bg-slate-800 border-slate-700 text-white text-right"
                                    />
                                  ) : (
                                    <span style={{color: isLiability ? '#FF5C73' : '#5CE3D7', fontWeight: 600}}>
                                      {formatCurrency(currentValue, selectedCurrency, currencyFormat)}
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-right">
                                  {!isLiability && gain !== 0 && (
                                    <div>
                                      <div style={{color: gain > 0 ? '#4BE0A1' : '#FF5C73', fontWeight: 600}}>
                                        {gain > 0 ? '↑' : '↓'} {formatCurrency(Math.abs(gain), selectedCurrency, currencyFormat)}
                                      </div>
                                      <div className="text-xs" style={{color: gain > 0 ? '#4BE0A1' : '#FF5C73'}}>
                                        ({gainPercent}%)
                                      </div>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-center gap-2">
                                    {isEditing ? (
                                      <>
                                        <Button size="sm" onClick={() => saveInlineEdit(asset.id)} style={{background: '#10b981', color: '#fff'}}>
                                          <Check className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" onClick={() => setEditingAssetId(null)} style={{background: '#ef4444', color: '#fff'}}>
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button size="sm" variant="ghost" onClick={() => startInlineEdit(asset)}>
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDeleteAsset(asset.id)} style={{color: '#ef4444'}}>
                                          <Trash2 className="w-4 h-4" />
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
              </CardContent>
            </Card>
          </div>

          {/* Detail Panel - Right Side */}
          {selectedAsset && (
            <div className="col-span-5">
              <Card style={{background: '#1a1229', borderColor: '#a855f7', borderWidth: '2px', position: 'sticky', top: '2rem'}}>
                <CardHeader style={{borderBottom: '1px solid #2d1f3d'}}>
                  <div className="flex justify-between items-start">
                    <CardTitle style={{color: '#f8fafc'}}>{selectedAsset.name}</CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedAsset(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Asset Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span style={{color: '#94a3b8'}}>Type:</span>
                      <span style={{color: '#f8fafc', fontWeight: 600}}>{selectedAsset.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{color: '#94a3b8'}}>Purchase Date:</span>
                      <span style={{color: '#f8fafc'}}>{selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    {selectedAsset.quantity && (
                      <div className="flex justify-between">
                        <span style={{color: '#94a3b8'}}>Quantity:</span>
                        <span style={{color: '#f8fafc', fontWeight: 600}}>{selectedAsset.quantity}</span>
                      </div>
                    )}
                    {selectedAsset.area && (
                      <div className="flex justify-between">
                        <span style={{color: '#94a3b8'}}>Area:</span>
                        <span style={{color: '#f8fafc'}}>{selectedAsset.area} {selectedAsset.area_unit}</span>
                      </div>
                    )}
                    {selectedAsset.weight && (
                      <div className="flex justify-between">
                        <span style={{color: '#94a3b8'}}>Weight:</span>
                        <span style={{color: '#f8fafc'}}>{selectedAsset.weight} {selectedAsset.weight_unit}</span>
                      </div>
                    )}
                  </div>

                  {/* Loan Calculator Section - Only for Loans/Credit Cards */}
                  {(selectedAsset.type === 'loan' || selectedAsset.type === 'credit_card') && (
                    <div className="pt-6" style={{borderTop: '2px solid #2d1f3d'}}>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{color: '#f8fafc'}}>
                        <Calculator className="w-5 h-5" style={{color: '#E8C27C'}} />
                        Loan Calculator
                      </h3>
                      
                      <Button 
                        onClick={() => calculateLoanDetails(selectedAsset)}
                        disabled={calculatingLoan}
                        className="w-full mb-4"
                        style={{background: 'linear-gradient(135deg, #E8C27C 0%, #F5D49F 100%)', color: '#0B0B11'}}
                      >
                        {calculatingLoan ? 'Calculating...' : 'Calculate Repayment Schedule'}
                      </Button>

                      {loanCalcData && (
                        <div className="space-y-4">
                          {/* Summary Cards */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                              <div className="text-xs mb-1" style={{color: '#94a3b8'}}>Monthly Payment</div>
                              <div className="text-xl font-bold" style={{color: '#a855f7'}}>
                                ${loanCalcData.monthly_payment.toLocaleString()}
                              </div>
                            </div>
                            <div className="p-3 rounded-lg" style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)'}}>
                              <div className="text-xs mb-1" style={{color: '#94a3b8'}}>Total Interest</div>
                              <div className="text-xl font-bold" style={{color: '#ef4444'}}>
                                ${loanCalcData.total_interest.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* AI Tips */}
                          {loanCalcData.ai_tips && (
                            <div className="p-4 rounded-lg" style={{background: 'rgba(232, 194, 124, 0.1)', border: '1px solid rgba(232, 194, 124, 0.3)'}}>
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4" style={{color: '#E8C27C'}} />
                                <span className="text-sm font-semibold" style={{color: '#E8C27C'}}>AI Tips</span>
                              </div>
                              <div className="text-xs whitespace-pre-wrap" style={{color: '#cbd5e1', lineHeight: '1.6'}}>
                                {loanCalcData.ai_tips}
                              </div>
                            </div>
                          )}

                          {/* Amortization Preview - First 12 months */}
                          <div className="max-h-64 overflow-y-auto">
                            <div className="text-xs font-semibold mb-2" style={{color: '#94a3b8'}}>
                              AMORTIZATION SCHEDULE (First 12 months)
                            </div>
                            <table className="w-full text-xs">
                              <thead style={{background: '#16001e'}}>
                                <tr>
                                  <th className="p-2 text-left" style={{color: '#94a3b8'}}>Month</th>
                                  <th className="p-2 text-right" style={{color: '#94a3b8'}}>Principal</th>
                                  <th className="p-2 text-right" style={{color: '#94a3b8'}}>Interest</th>
                                  <th className="p-2 text-right" style={{color: '#94a3b8'}}>Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {loanCalcData.amortization_schedule.slice(0, 12).map((entry) => (
                                  <tr key={entry.month} style={{borderBottom: '1px solid #2d1f3d'}}>
                                    <td className="p-2" style={{color: '#cbd5e1'}}>{entry.month}</td>
                                    <td className="p-2 text-right" style={{color: '#10b981'}}>${entry.principal_payment.toLocaleString()}</td>
                                    <td className="p-2 text-right" style={{color: '#ef4444'}}>${entry.interest_payment.toLocaleString()}</td>
                                    <td className="p-2 text-right" style={{color: '#94a3b8'}}>${entry.remaining_balance.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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
                    style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                  >
                    <Info className="w-4 h-4 mr-2" />
                    View All Details
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
