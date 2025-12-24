import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { 
  PiggyBank, TrendingUp, ShoppingBag, AlertTriangle, CheckCircle2, 
  DollarSign, Plus, RefreshCw, Download, Calendar, Info, Target,
  TrendingDown, Sparkles, Save, BarChart, X
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BudgetPlanner() {
  const { theme } = useTheme();
  const { selectedCurrency } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [budgetRule, setBudgetRule] = useState('65/25/10');
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState('auto');
  const [showAddItem, setShowAddItem] = useState({ bucket: null, open: false });
  const [customItems, setCustomItems] = useState({ needs: [], savings: [], wants: [] });
  const [newItem, setNewItem] = useState({ label: '', amount: '' });
  const [comparisonData, setComparisonData] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [activeView, setActiveView] = useState('current');
  const [editingItem, setEditingItem] = useState({ bucket: null, index: null, type: null, item: null }); // 'current' or 'trends'

  useEffect(() => {
    if (dataSource === 'auto') {
      fetchBudgetAnalysis();
    }
    if (activeView === 'trends') {
      fetchComparisonData();
    }
  }, [selectedMonth, budgetRule, activeView]);

  const fetchBudgetAnalysis = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/budget/analysis`, {
        params: {
          month: selectedMonth,
          rule: budgetRule,
          target_currency: selectedCurrency
        },
        withCredentials: true
      });
      setBudgetData(response.data);
    } catch (error) {
      console.error('Failed to fetch budget:', error);
      toast.error('Failed to load budget analysis');
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      // Get last 6 months
      const months = [];
      const date = new Date(selectedMonth);
      for (let i = 5; i >= 0; i--) {
        const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
      
      const response = await axios.get(`${API}/budget/comparison`, {
        params: {
          months: months.join(','),
          rule: budgetRule,
          target_currency: selectedCurrency
        },
        withCredentials: true
      });
      setComparisonData(response.data);
    } catch (error) {
      console.error('Failed to fetch comparison:', error);
      toast.error('Failed to load budget trends');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomItem = (bucket) => {
    if (!newItem.label || !newItem.amount) {
      toast.error('Please enter both label and amount');
      return;
    }

    setCustomItems(prev => ({
      ...prev,
      [bucket]: [...prev[bucket], { label: newItem.label, amount: parseFloat(newItem.amount) }]
    }));

    setNewItem({ label: '', amount: '' });
    setShowAddItem({ bucket: null, open: false });
    toast.success('Item added successfully');
  };

  const handleEditItem = (bucket, index, type, item) => {
    setEditingItem({ bucket, index, type, item: { ...item } });
  };

  const handleSaveEdit = () => {
    if (editingItem.type === 'custom') {
      setCustomItems(prev => ({
        ...prev,
        [editingItem.bucket]: prev[editingItem.bucket].map((item, idx) => 
          idx === editingItem.index ? editingItem.item : item
        )
      }));
    } else {
      // For auto items, convert to custom after editing
      setCustomItems(prev => ({
        ...prev,
        [editingItem.bucket]: [...prev[editingItem.bucket], editingItem.item]
      }));
    }
    
    setEditingItem({ bucket: null, index: null, type: null, item: null });
    toast.success('Item updated successfully');
  };

  const handleDeleteCustomItem = (bucket, index) => {
    setCustomItems(prev => ({
      ...prev,
      [bucket]: prev[bucket].filter((_, i) => i !== index)
    }));
    toast.success('Item removed');
  };

  const handleSaveBudget = async () => {
    try {
      await axios.post(`${API}/budget/save`, {
        month: selectedMonth,
        rule: budgetRule,
        buckets: budgetData?.buckets || {},
        custom_items: customItems,
        total_income: budgetData?.total_income || 0
      }, { withCredentials: true });
      
      toast.success('Budget saved successfully!');
    } catch (error) {
      console.error('Failed to save budget:', error);
      toast.error('Failed to save budget');
    }
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export
    toast.info('PDF export coming soon!');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'over': return '#ef4444';
      case 'under': return '#f59e0b';
      case 'good': return '#10b981';
      default: return theme.textSecondary;
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'over': return 'Overspending';
      case 'under': return 'Underspending';
      case 'good': return 'On Track';
      default: return 'Unknown';
    }
  };

  const getBucketIcon = (bucket) => {
    switch(bucket) {
      case 'needs': return <ShoppingBag className="w-6 h-6" />;
      case 'savings': return <PiggyBank className="w-6 h-6" />;
      case 'wants': return <Sparkles className="w-6 h-6" />;
      default: return <DollarSign className="w-6 h-6" />;
    }
  };

  const getBucketColor = (bucket) => {
    switch(bucket) {
      case 'needs': return '#3b82f6';
      case 'savings': return '#10b981';
      case 'wants': return '#a855f7';
      default: return theme.textSecondary;
    }
  };

  const getBucketLabel = (bucket) => {
    if (budgetRule === '65/25/10') {
      switch(bucket) {
        case 'needs': return 'Needs (65%)';
        case 'savings': return 'Savings & Investment (25%)';
        case 'wants': return 'Wants (10%)';
        default: return bucket;
      }
    } else {
      switch(bucket) {
        case 'needs': return 'Needs (50%)';
        case 'savings': return 'Savings & Investment (20%)';
        case 'wants': return 'Wants (30%)';
        default: return bucket;
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6" style={{padding: '1.5rem 0'}}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{color: theme.text, fontFamily: 'Space Grotesk, sans-serif'}}>
              Budget Planner
            </h1>
            <p className="text-base sm:text-lg" style={{color: theme.textSecondary}}>
              Track your spending using the {budgetRule} budgeting rule
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={fetchBudgetAnalysis}
              variant="outline"
              className="hover:scale-105 transition-all"
              style={{borderColor: theme.border, color: theme.text}}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {budgetData && (
              <>
                <Button
                  onClick={handleSaveBudget}
                  variant="outline"
                  className="hover:scale-105 transition-all"
                  style={{borderColor: '#10b981', color: '#10b981'}}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={handleExportPDF}
                  variant="outline"
                  className="hover:scale-105 transition-all"
                  style={{borderColor: '#3b82f6', color: '#3b82f6'}}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>

        {/* View Switcher */}
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList className="grid w-full grid-cols-2 max-w-md" style={{background: theme.cardBg, borderColor: theme.border}}>
            <TabsTrigger 
              value="current"
              className="transition-all hover:scale-[1.03]"
              style={{
                background: activeView === 'current' ? theme.primaryGradient : 'transparent',
                color: activeView === 'current' ? '#ffffff' : theme.textSecondary,
                fontWeight: activeView === 'current' ? '600' : '400'
              }}
            >
              <Target className="w-4 h-4 mr-2" />
              Current Month
            </TabsTrigger>
            <TabsTrigger 
              value="trends"
              className="transition-all hover:scale-[1.03]"
              style={{
                background: activeView === 'trends' ? theme.primaryGradient : 'transparent',
                color: activeView === 'trends' ? '#ffffff' : theme.textSecondary,
                fontWeight: activeView === 'trends' ? '600' : '400'
              }}
            >
              <BarChart className="w-4 h-4 mr-2" />
              6-Month Trends
            </TabsTrigger>
          </TabsList>

          {/* Current Month View */}
          <TabsContent value="current" className="space-y-6 mt-6">

        {/* Info Banner */}
        <Card style={{background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', borderWidth: '2px'}}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 mt-0.5" style={{color: '#3b82f6'}} />
              <div>
                <h3 className="font-semibold mb-2" style={{color: theme.text}}>
                  Why Budget Planning Protects Your Family
                </h3>
                <p className="text-sm" style={{color: theme.textSecondary}}>
                  A well-structured budget ensures your family knows your spending patterns and essential commitments. 
                  Document which expenses are critical (Needs), which are discretionary (Wants), and where you&apos;re building wealth (Savings). 
                  This becomes invaluable during uncertain times.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Month Selector */}
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardContent className="p-4">
              <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Select Month
              </Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
              />
            </CardContent>
          </Card>

          {/* Budget Rule Selector */}
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardContent className="p-4">
              <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Budget Rule
              </Label>
              <Select value={budgetRule} onValueChange={setBudgetRule}>
                <SelectTrigger style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                  <SelectItem value="50/30/20" style={{color: theme.text}}>
                    50/30/20 Rule (Balanced)
                  </SelectItem>
                  <SelectItem value="65/25/10" style={{color: theme.text}}>
                    65/25/10 Rule (Aggressive Saving)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs mt-2" style={{color: theme.textSecondary}}>
                {budgetRule === '65/25/10' 
                  ? 'Needs 65% | Savings 25% | Wants 10%'
                  : 'Needs 50% | Wants 30% | Savings 20%'
                }
              </p>
            </CardContent>
          </Card>

          {/* Data Source */}
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardContent className="p-4">
              <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Data Source
              </Label>
              <Select value={dataSource} onValueChange={setDataSource}>
                <SelectTrigger style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                  <SelectItem value="auto" style={{color: theme.text}}>
                    Auto (from Income & Expenses)
                  </SelectItem>
                  <SelectItem value="manual" style={{color: theme.text}}>
                    Manual Entry
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Budget Overview */}
        {budgetData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                <CardContent className="p-5">
                  <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Total Income</div>
                  <div className="text-2xl font-bold" style={{color: '#10b981'}}>
                    {formatCurrency(budgetData.total_income)}
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                <CardContent className="p-5">
                  <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Total Spent</div>
                  <div className="text-2xl font-bold" style={{color: '#ef4444'}}>
                    {formatCurrency(budgetData.total_spent)}
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                <CardContent className="p-5">
                  <div className="text-sm mb-1" style={{color: theme.textSecondary}}>
                    {budgetData.unallocated >= 0 ? 'Unallocated' : 'Overspent'}
                  </div>
                  <div className="text-2xl font-bold" style={{color: budgetData.unallocated >= 0 ? '#3b82f6' : '#ef4444'}}>
                    {formatCurrency(Math.abs(budgetData.unallocated))}
                  </div>
                </CardContent>
              </Card>

              <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                <CardContent className="p-5">
                  <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Budget Rule</div>
                  <div className="text-xl font-bold" style={{color: '#a855f7'}}>
                    {budgetRule}
                  </div>
                  <div className="text-xs mt-1" style={{color: theme.textSecondary}}>
                    {budgetRule === '65/25/10' ? 'Aggressive' : 'Balanced'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Budget Buckets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Object.entries(budgetData.buckets).map(([bucketKey, bucket]) => (
                <Card key={bucketKey} style={{background: theme.cardBg, borderColor: getBucketColor(bucketKey)}}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between" style={{color: theme.text}}>
                      <div className="flex items-center gap-3">
                        <div style={{color: getBucketColor(bucketKey)}}>
                          {getBucketIcon(bucketKey)}
                        </div>
                        <div>
                          <div className="text-base">{getBucketLabel(bucketKey)}</div>
                          <div className="text-xs font-normal mt-1" style={{color: theme.textSecondary}}>
                            Goal: {formatCurrency(bucket.ideal_amount)}
                          </div>
                        </div>
                      </div>
                      <span 
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{
                          background: bucket.status === 'over' 
                            ? 'rgba(239, 68, 68, 0.2)' 
                            : bucket.status === 'good' 
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(251, 191, 36, 0.2)',
                          color: getStatusColor(bucket.status)
                        }}
                      >
                        {getStatusLabel(bucket.status)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Actual Amount */}
                    <div className="p-4 rounded-lg" style={{background: theme.backgroundSecondary}}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm" style={{color: theme.textSecondary}}>Actual Spent</span>
                        <span className="text-xl font-bold" style={{color: getBucketColor(bucketKey)}}>
                          {formatCurrency(bucket.actual_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs" style={{color: theme.textSecondary}}>
                        <span>Target: {bucket.ideal_percentage}%</span>
                        <span className="font-semibold">Actual: {bucket.actual_percentage}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-2" style={{color: theme.textSecondary}}>
                        <span>Progress</span>
                        <span>{Math.round((bucket.actual_amount / bucket.ideal_amount) * 100)}%</span>
                      </div>
                      <div className="w-full h-3 rounded-full overflow-hidden" style={{background: theme.backgroundTertiary}}>
                        <div 
                          className="h-full transition-all rounded-full"
                          style={{
                            width: `${Math.min((bucket.actual_amount / bucket.ideal_amount) * 100, 100)}%`,
                            background: bucket.status === 'over'
                              ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                              : bucket.status === 'good'
                              ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                              : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Variance */}
                    {bucket.variance !== 0 && (
                      <div className="flex items-center gap-2 text-sm p-3 rounded-lg" style={{
                        background: bucket.variance > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: `1px solid ${bucket.variance > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                      }}>
                        {bucket.variance > 0 ? (
                          <TrendingUp className="w-4 h-4" style={{color: '#ef4444'}} />
                        ) : (
                          <TrendingDown className="w-4 h-4" style={{color: '#10b981'}} />
                        )}
                        <span style={{color: bucket.variance > 0 ? '#ef4444' : '#10b981'}}>
                          {bucket.variance > 0 ? '+' : ''}{formatCurrency(bucket.variance)} vs goal
                        </span>
                      </div>
                    )}

                    {/* Items List with Add Button */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold mb-2" style={{color: theme.textSecondary}}>
                        <span>Breakdown ({(bucket.items?.length || 0) + (customItems[bucketKey]?.length || 0)} items)</span>
                        {dataSource === 'manual' && (
                          <button
                            onClick={() => setShowAddItem({ bucket: bucketKey, open: true })}
                            className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:scale-105"
                            style={{background: getBucketColor(bucketKey), color: '#ffffff'}}
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {/* Auto items - Editable in manual mode */}
                        {bucket.items && bucket.items.map((item, idx) => (
                          <div 
                            key={`auto-${idx}`}
                            className="flex justify-between items-center text-sm p-2 rounded"
                            style={{background: theme.backgroundTertiary}}
                          >
                            <span style={{color: theme.text}} className="truncate flex-1">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold" style={{color: getBucketColor(bucketKey)}}>
                                {formatCurrency(item.amount)}
                              </span>
                              {dataSource === 'manual' && (
                                <button
                                  onClick={() => handleEditItem(bucketKey, idx, 'auto', item)}
                                  className="p-1 rounded transition-all hover:bg-opacity-80"
                                  style={{background: 'rgba(59, 130, 246, 0.2)'}}
                                  title="Edit item"
                                >
                                  <svg className="w-3 h-3" style={{color: '#3b82f6'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {/* Custom items - Always editable in manual mode */}
                        {customItems[bucketKey] && customItems[bucketKey].map((item, idx) => (
                          <div 
                            key={`custom-${idx}`}
                            className="flex justify-between items-center text-sm p-2 rounded"
                            style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px dashed rgba(168, 85, 247, 0.3)'}}
                          >
                            <span style={{color: theme.text}} className="truncate flex-1">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold" style={{color: '#a855f7'}}>
                                {formatCurrency(item.amount)}
                              </span>
                              {dataSource === 'manual' && (
                                <>
                                  <button
                                    onClick={() => handleEditItem(bucketKey, idx, 'custom', item)}
                                    className="p-1 rounded transition-all hover:bg-opacity-80"
                                    style={{background: 'rgba(59, 130, 246, 0.2)'}}
                                    title="Edit item"
                                  >
                                    <svg className="w-3 h-3" style={{color: '#3b82f6'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCustomItem(bucketKey, idx)}
                                    className="p-1 rounded transition-all hover:bg-red-500"
                                    title="Delete item"
                                  >
                                    <X className="w-3 h-3" style={{color: '#ef4444'}} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Income Sources */}
            {budgetData.income_sources && budgetData.income_sources.length > 0 && (
              <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                    <DollarSign className="w-5 h-5" style={{color: '#10b981'}} />
                    Income Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgetData.income_sources.map((source, idx) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-lg"
                        style={{background: theme.backgroundSecondary, border: `1px solid ${theme.border}`}}
                      >
                        <div className="text-sm mb-1" style={{color: theme.textSecondary}}>
                          {source.source}
                        </div>
                        <div className="text-xl font-bold" style={{color: '#10b981'}}>
                          {formatCurrency(source.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Allocation Status */}
            <Card style={{
              background: budgetData.unallocated === 0 
                ? 'rgba(16, 185, 129, 0.1)' 
                : budgetData.unallocated > 0
                ? 'rgba(251, 191, 36, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
              borderColor: budgetData.unallocated === 0 
                ? 'rgba(16, 185, 129, 0.3)' 
                : budgetData.unallocated > 0
                ? 'rgba(251, 191, 36, 0.3)'
                : 'rgba(239, 68, 68, 0.3)',
              borderWidth: '2px'
            }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  {budgetData.unallocated === 0 ? (
                    <>
                      <CheckCircle2 className="w-8 h-8" style={{color: '#10b981'}} />
                      <div>
                        <h3 className="font-bold text-lg" style={{color: '#10b981'}}>
                          Perfect! You&apos;ve allocated all your income
                        </h3>
                        <p className="text-sm mt-1" style={{color: theme.textSecondary}}>
                          Your budget is fully planned. Great job managing your finances!
                        </p>
                      </div>
                    </>
                  ) : budgetData.unallocated > 0 ? (
                    <>
                      <AlertTriangle className="w-8 h-8" style={{color: '#fbbf24'}} />
                      <div>
                        <h3 className="font-bold text-lg" style={{color: '#fbbf24'}}>
                          {formatCurrency(budgetData.unallocated)} left to allocate
                        </h3>
                        <p className="text-sm mt-1" style={{color: theme.textSecondary}}>
                          Consider adding this to your savings or paying down debt
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-8 h-8" style={{color: '#ef4444'}} />
                      <div>
                        <h3 className="font-bold text-lg" style={{color: '#ef4444'}}>
                          Overspent by {formatCurrency(Math.abs(budgetData.unallocated))}
                        </h3>
                        <p className="text-sm mt-1" style={{color: theme.textSecondary}}>
                          Review your expenses and reduce spending in Wants or Needs categories
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
          </TabsContent>

          {/* Trends View */}
          <TabsContent value="trends" className="space-y-6 mt-6">
            {comparisonData && comparisonData.months && comparisonData.months.length > 0 ? (
              <>
                {/* Trend Chart */}
                <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                  <CardHeader>
                    <CardTitle style={{color: theme.text}}>6-Month Budget Allocation Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={comparisonData.months}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="month" stroke={theme.textSecondary} />
                        <YAxis stroke={theme.textSecondary} />
                        <RechartsTooltip 
                          contentStyle={{background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px'}}
                          labelStyle={{color: theme.text}}
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="needs" stroke="#3b82f6" strokeWidth={2} name="Needs" />
                        <Line type="monotone" dataKey="wants" stroke="#a855f7" strokeWidth={2} name="Wants" />
                        <Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} name="Savings" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Percentage Trend */}
                <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                  <CardHeader>
                    <CardTitle style={{color: theme.text}}>Budget Allocation % Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsBar data={comparisonData.months}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="month" stroke={theme.textSecondary} />
                        <YAxis stroke={theme.textSecondary} />
                        <RechartsTooltip 
                          contentStyle={{background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px'}}
                          labelStyle={{color: theme.text}}
                          formatter={(value) => `${value}%`}
                        />
                        <Legend />
                        <Bar dataKey="needs_percentage" fill="#3b82f6" name="Needs %" />
                        <Bar dataKey="wants_percentage" fill="#a855f7" name="Wants %" />
                        <Bar dataKey="savings_percentage" fill="#10b981" name="Savings %" />
                      </RechartsBar>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Monthly Summary Table */}
                <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                  <CardHeader>
                    <CardTitle style={{color: theme.text}}>Month-by-Month Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead style={{background: theme.backgroundSecondary, borderBottom: `1px solid ${theme.border}`}}>
                          <tr>
                            <th className="text-left p-3 text-sm" style={{color: theme.textSecondary}}>Month</th>
                            <th className="text-right p-3 text-sm" style={{color: theme.textSecondary}}>Income</th>
                            <th className="text-right p-3 text-sm" style={{color: theme.textSecondary}}>Needs</th>
                            <th className="text-right p-3 text-sm" style={{color: theme.textSecondary}}>Wants</th>
                            <th className="text-right p-3 text-sm" style={{color: theme.textSecondary}}>Savings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.months.map((month, idx) => (
                            <tr key={idx} style={{borderBottom: `1px solid ${theme.border}`}}>
                              <td className="p-3" style={{color: theme.text}}>{month.month}</td>
                              <td className="text-right p-3" style={{color: '#10b981'}}>
                                {formatCurrency(month.total_income)}
                              </td>
                              <td className="text-right p-3" style={{color: '#3b82f6'}}>
                                {formatCurrency(month.needs)}
                                <span className="text-xs ml-2" style={{color: theme.textSecondary}}>
                                  ({month.needs_percentage}%)
                                </span>
                              </td>
                              <td className="text-right p-3" style={{color: '#a855f7'}}>
                                {formatCurrency(month.wants)}
                                <span className="text-xs ml-2" style={{color: theme.textSecondary}}>
                                  ({month.wants_percentage}%)
                                </span>
                              </td>
                              <td className="text-right p-3" style={{color: '#10b981'}}>
                                {formatCurrency(month.savings)}
                                <span className="text-xs ml-2" style={{color: theme.textSecondary}}>
                                  ({month.savings_percentage}%)
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                <CardContent className="py-12 text-center">
                  <BarChart className="w-16 h-16 mx-auto mb-4" style={{color: theme.textSecondary, opacity: 0.5}} />
                  <h3 className="text-xl font-semibold mb-2" style={{color: theme.text}}>
                    No Historical Data
                  </h3>
                  <p style={{color: theme.textSecondary}}>
                    Add income and expenses for multiple months to see trends
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Custom Item Dialog */}
        <Dialog open={showAddItem.open} onOpenChange={(open) => setShowAddItem({ ...showAddItem, open })}>
          <DialogContent style={{background: theme.cardBg, borderColor: theme.border}}>
            <DialogHeader>
              <DialogTitle style={{color: theme.text}}>
                Add Custom Item to {showAddItem.bucket && getBucketLabel(showAddItem.bucket)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label style={{color: theme.textSecondary}}>Item Label *</Label>
                <Input
                  value={newItem.label}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                  placeholder="e.g., Gym Membership"
                  style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                />
              </div>
              <div>
                <Label style={{color: theme.textSecondary}}>Amount *</Label>
                <Input
                  type="number"
                  value={newItem.amount}
                  onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                  placeholder="1500"
                  style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleAddCustomItem(showAddItem.bucket)}
                  className="flex-1 text-white font-medium"
                  style={{background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'}}
                >
                  Add Item
                </Button>
                <Button
                  onClick={() => {
                    setShowAddItem({ bucket: null, open: false });
                    setNewItem({ label: '', amount: '' });
                  }}
                  variant="outline"
                  style={{borderColor: theme.border, color: theme.textSecondary}}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Loading State */}
        {loading && activeView === 'current' && (
          <div className="text-center py-12" style={{color: theme.textSecondary}}>
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" style={{color: '#a855f7'}} />
            <p>Loading budget analysis...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !budgetData && activeView === 'current' && (
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardContent className="py-12 text-center">
              <PiggyBank className="w-16 h-16 mx-auto mb-4" style={{color: theme.textSecondary, opacity: 0.5}} />
              <h3 className="text-xl font-semibold mb-2" style={{color: theme.text}}>
                No Data for This Month
              </h3>
              <p className="mb-6" style={{color: theme.textSecondary}}>
                Add income and expenses for {selectedMonth} to see your budget analysis
              </p>
              <Button 
                onClick={() => window.location.href = '/income-expense'}
                className="text-white font-medium"
                style={{background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'}}
              >
                Go to Income & Expenses
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
