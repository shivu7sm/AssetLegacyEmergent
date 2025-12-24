import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { 
  Calculator, TrendingDown, Sparkles, DollarSign, Calendar, Percent, 
  TrendingUp, PiggyBank, RefreshCw, Target, BarChart3, Info, Zap,
  ChevronRight, Check, AlertCircle, ShieldCheck, Wallet
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LOAN_TYPES = [
  { value: 'personal', label: 'Personal Loan', icon: '👤' },
  { value: 'home', label: 'Home/Mortgage', icon: '🏠' },
  { value: 'auto', label: 'Auto Loan', icon: '🚗' },
  { value: 'credit_card', label: 'Credit Card Debt', icon: '💳' },
  { value: 'education', label: 'Education Loan', icon: '🎓' },
  { value: 'business', label: 'Business Loan', icon: '💼' }
];

export default function LoanCalculatorEnhanced() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingTips, setLoadingTips] = useState(false);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [existingLoans, setExistingLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [formData, setFormData] = useState({
    principal: '',
    annual_interest_rate: '',
    tenure_months: '',
    loan_type: 'personal'
  });
  const [result, setResult] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('base');
  const [activeTab, setActiveTab] = useState('calculator');

  // Fetch user's existing loans on mount
  useEffect(() => {
    fetchExistingLoans();
  }, []);

  const fetchExistingLoans = async () => {
    try {
      const response = await axios.get(`${API}/assets`, { withCredentials: true });
      const loans = response.data.filter(asset => 
        asset.type === 'loan' || asset.type === 'credit_card'
      );
      setExistingLoans(loans);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setLoadingLoans(false);
    }
  };

  const loadLoanData = (loan) => {
    setSelectedLoanId(loan.id);
    const loanType = loan.type === 'credit_card' ? 'credit_card' : 
                     loan.metadata?.loan_type || 'personal';
    
    setFormData({
      principal: loan.principal_amount || loan.total_value || '',
      annual_interest_rate: loan.interest_rate || '',
      tenure_months: loan.tenure_months || '',
      loan_type: loanType
    });
    
    toast.success(`Loaded: ${loan.name}`);
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    
    if (!formData.principal || !formData.annual_interest_rate || !formData.tenure_months) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Get immediate calculation results
      const response = await axios.post(`${API}/loan-calculator`, {
        principal: parseFloat(formData.principal),
        annual_interest_rate: parseFloat(formData.annual_interest_rate),
        tenure_months: parseInt(formData.tenure_months),
        loan_type: formData.loan_type
      }, { withCredentials: true });

      setResult(response.data);
      toast.success('Calculation complete!');
      
      // Load AI tips in background
      loadAITips();
    } catch (error) {
      console.error('Calculation failed:', error);
      toast.error('Failed to calculate loan details');
    } finally {
      setLoading(false);
    }
  };

  const loadAITips = async () => {
    setLoadingTips(true);
    try {
      const response = await axios.post(`${API}/loan-calculator/ai-tips`, {
        principal: parseFloat(formData.principal),
        annual_interest_rate: parseFloat(formData.annual_interest_rate),
        tenure_months: parseInt(formData.tenure_months),
        loan_type: formData.loan_type
      }, { withCredentials: true });
      
      setResult(prev => ({ ...prev, ai_tips: response.data.ai_tips }));
    } catch (error) {
      console.error('AI tips failed:', error);
    } finally {
      setLoadingTips(false);
    }
  };

  const handleReset = () => {
    setFormData({
      principal: '',
      annual_interest_rate: '',
      tenure_months: '',
      loan_type: 'personal'
    });
    setResult(null);
    setSelectedScenario('base');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const selectedLoanType = LOAN_TYPES.find(t => t.value === formData.loan_type);

  // Prepare chart data for amortization
  const prepareAmortizationChartData = () => {
    if (!result) return [];
    
    const schedule = result.amortization_schedule || [];
    const yearlyData = [];
    
    for (let year = 1; year <= Math.ceil(schedule.length / 12); year++) {
      const yearEntries = schedule.filter(e => 
        e.month > (year - 1) * 12 && e.month <= year * 12
      );
      
      const principal = yearEntries.reduce((sum, e) => sum + e.principal_payment, 0);
      const interest = yearEntries.reduce((sum, e) => sum + e.interest_payment, 0);
      
      yearlyData.push({
        year: `Year ${year}`,
        Principal: Math.round(principal),
        Interest: Math.round(interest)
      });
    }
    
    return yearlyData.slice(0, 10); // First 10 years
  };

  // Prepare comparison chart data
  const prepareScenarioComparison = () => {
    if (!result || !result.prepayment_scenarios) return [];
    
    const scenarios = result.prepayment_scenarios;
    return [
      {
        name: 'Current Plan',
        interest: result.total_interest,
        tenure: Math.round(result.amortization_schedule.length / 12)
      },
      {
        name: '₹5K Extra/mo',
        interest: scenarios.extra_5k_monthly?.total_interest || 0,
        tenure: Math.round((scenarios.extra_5k_monthly?.tenure_months || 0) / 12)
      },
      {
        name: '₹10K Extra/mo',
        interest: scenarios.extra_10k_monthly?.total_interest || 0,
        tenure: Math.round((scenarios.extra_10k_monthly?.tenure_months || 0) / 12)
      },
      {
        name: '₹50K Annual',
        interest: scenarios.annual_50k?.total_interest || 0,
        tenure: Math.round((scenarios.annual_50k?.tenure_months || 0) / 12)
      },
      {
        name: '₹1L One-time',
        interest: scenarios.onetime_100k?.total_interest || 0,
        tenure: Math.round((scenarios.onetime_100k?.tenure_months || 0) / 12)
      }
    ];
  };

  return (
    <Layout>
      <div className="space-y-6" style={{padding: '1.5rem 0'}}>
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{color: theme.text, fontFamily: 'Space Grotesk, sans-serif'}}>
            Loan Calculator & Payoff Planner
          </h1>
          <p className="text-base sm:text-lg mb-4" style={{color: theme.textSecondary}}>
            Optimize your loan repayment strategy and document details for your family
          </p>
          
          {/* Family Legacy Message */}
          <div className="mb-6 p-4 rounded-lg" style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)'}}>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 mt-0.5" style={{color: '#3b82f6'}} />
              <div>
                <h3 className="font-semibold mb-1" style={{color: theme.text}}>
                  Protect Your Family's Financial Future
                </h3>
                <p className="text-sm" style={{color: theme.textSecondary}}>
                  Calculate optimal repayment strategies and ensure your family knows the loan details - 
                  EMI amounts, bank contacts, outstanding balance, and tax benefits. 
                  This information becomes critical during uncertain times.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList style={{background: theme.cardBg, borderColor: theme.border}}>
            <TabsTrigger value="calculator" style={{color: theme.text}}>
              <Calculator className="w-4 h-4 mr-2" />
              Calculator
            </TabsTrigger>
            {result && (
              <>
                <TabsTrigger value="prepayment" style={{color: theme.text}}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Prepayment
                </TabsTrigger>
                <TabsTrigger value="analysis" style={{color: theme.text}}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analysis
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            {/* Existing Loans Section */}
            {existingLoans.length > 0 && (
              <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                    <Wallet className="w-5 h-5" style={{color: '#10b981'}} />
                    Your Existing Loans
                  </CardTitle>
                  <p className="text-sm mt-2" style={{color: theme.textSecondary}}>
                    Click on any loan to calculate repayment strategies and document for your family
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {existingLoans.map((loan) => {
                      const isSelected = selectedLoanId === loan.id;
                      const loanIcon = LOAN_TYPES.find(t => 
                        t.value === (loan.type === 'credit_card' ? 'credit_card' : loan.metadata?.loan_type || 'personal')
                      )?.icon || '💰';
                      
                      return (
                        <button
                          key={loan.id}
                          onClick={() => loadLoanData(loan)}
                          className="p-4 rounded-lg text-left transition-all"
                          style={{
                            background: isSelected ? 'rgba(168, 85, 247, 0.15)' : theme.backgroundSecondary,
                            border: `2px solid ${isSelected ? '#a855f7' : theme.border}`
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-2xl">{loanIcon}</span>
                            {isSelected && <Check className="w-5 h-5" style={{color: '#a855f7'}} />}
                          </div>
                          <h4 className="font-semibold mb-1" style={{color: theme.text}}>
                            {loan.name}
                          </h4>
                          <div className="space-y-1 text-sm" style={{color: theme.textSecondary}}>
                            <div>Amount: {formatCurrency(loan.principal_amount || loan.total_value || 0)}</div>
                            {loan.interest_rate && (
                              <div>Rate: {loan.interest_rate}% p.a.</div>
                            )}
                            {loan.metadata?.bank_name && (
                              <div>Bank: {loan.metadata.bank_name}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Form */}
              <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                    <Calculator className="w-5 h-5" style={{color: '#a855f7'}} />
                    Loan Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCalculate} className="space-y-5">
                    {/* Loan Type */}
                    <div>
                      <Label style={{color: theme.textSecondary}} className="mb-2 block">Loan Type</Label>
                      <Select 
                        value={formData.loan_type} 
                        onValueChange={(value) => setFormData({ ...formData, loan_type: value })}
                      >
                        <SelectTrigger style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                          {LOAN_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} style={{color: theme.text}}>
                              <span className="flex items-center gap-2">
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Principal */}
                    <div>
                      <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Principal Amount (₹) *
                      </Label>
                      <Input
                        type="number"
                        step="1000"
                        value={formData.principal}
                        onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                        placeholder="2500000"
                        required
                        style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                      />
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Annual Interest Rate (%) *
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.annual_interest_rate}
                        onChange={(e) => setFormData({ ...formData, annual_interest_rate: e.target.value })}
                        placeholder="8.5"
                        required
                        style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                      />
                    </div>

                    {/* Tenure */}
                    <div>
                      <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Loan Tenure (months) *
                      </Label>
                      <Input
                        type="number"
                        value={formData.tenure_months}
                        onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })}
                        placeholder="240"
                        required
                        style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}
                      />
                      {formData.tenure_months && (
                        <p className="text-xs mt-1" style={{color: theme.textSecondary}}>
                          {Math.floor(formData.tenure_months / 12)} years {formData.tenure_months % 12} months
                        </p>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 text-white font-medium"
                        style={{background: 'linear-gradient(135deg, #a855f7 0%, #ef4444 100%)'}}
                      >
                        {loading ? 'Calculating...' : 'Calculate'}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleReset}
                        variant="outline"
                        style={{borderColor: theme.border, color: theme.textSecondary}}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Basic Results */}
              {result && (
                <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                      <TrendingDown className="w-5 h-5" style={{color: '#10b981'}} />
                      Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Monthly EMI */}
                    <div className="p-5 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                      <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Monthly EMI</div>
                      <div className="text-3xl font-bold" style={{color: '#a855f7'}}>
                        {formatCurrency(result.monthly_payment)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Total Interest */}
                      <div className="p-4 rounded-lg" style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)'}}>
                        <div className="text-xs mb-1" style={{color: theme.textSecondary}}>Total Interest</div>
                        <div className="text-lg font-bold" style={{color: '#ef4444'}}>
                          {formatCurrency(result.total_interest)}
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div className="p-4 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)'}}>
                        <div className="text-xs mb-1" style={{color: theme.textSecondary}}>Total Repayment</div>
                        <div className="text-lg font-bold" style={{color: '#10b981'}}>
                          {formatCurrency(result.total_amount)}
                        </div>
                      </div>
                    </div>

                    {/* Tax Benefits */}
                    {result.tax_benefits && result.tax_benefits.eligible && (
                      <div className="p-4 rounded-lg" style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)'}}>
                        <div className="flex items-center gap-2 mb-2">
                          <PiggyBank className="w-4 h-4" style={{color: '#3b82f6'}} />
                          <span className="text-sm font-semibold" style={{color: theme.text}}>Tax Benefits</span>
                        </div>
                        <div className="space-y-1 text-xs" style={{color: theme.textSecondary}}>
                          <div className="flex justify-between">
                            <span>Annual Tax Savings:</span>
                            <span className="font-semibold" style={{color: '#3b82f6'}}>
                              {formatCurrency(result.tax_benefits.total_tax_saved)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Effective Rate:</span>
                            <span className="font-semibold" style={{color: '#10b981'}}>
                              {result.tax_benefits.effective_interest_rate}%
                            </span>
                          </div>
                          <div className="text-xs mt-1 opacity-75">
                            {result.tax_benefits.sections_applicable.join(', ')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="pt-3 border-t" style={{borderColor: theme.border}}>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div style={{color: theme.textSecondary}}>Principal:</div>
                        <div style={{color: theme.text, fontWeight: 600}}>{formatCurrency(parseFloat(formData.principal))}</div>
                        <div style={{color: theme.textSecondary}}>Interest Rate:</div>
                        <div style={{color: theme.text, fontWeight: 600}}>{formData.annual_interest_rate}% p.a.</div>
                        <div style={{color: theme.textSecondary}}>Tenure:</div>
                        <div style={{color: theme.text, fontWeight: 600}}>
                          {Math.floor(formData.tenure_months / 12)} years {formData.tenure_months % 12} months
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* AI Tips */}
            {result && (
              <Card style={{background: `linear-gradient(135deg, ${theme.cardBg} 0%, ${theme.backgroundSecondary} 100%)`, borderColor: '#a855f7', borderWidth: '2px'}}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                    <Sparkles className="w-5 h-5" style={{color: '#fbbf24'}} />
                    AI-Powered Debt Reduction Tips
                    {loadingTips && <span className="text-sm font-normal" style={{color: theme.textSecondary}}>(Loading...)</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.ai_tips ? (
                    <div className="prose prose-invert max-w-none" style={{color: theme.textSecondary, lineHeight: '1.7'}}>
                      <div className="whitespace-pre-wrap">{result.ai_tips}</div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm" style={{color: theme.textSecondary}}>
                      <div className="animate-pulse">Generating personalized tips...</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Prepayment Analysis Tab */}
          <TabsContent value="prepayment" className="space-y-6">
            {result && result.prepayment_scenarios && (
              <>
                <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                      <Target className="w-5 h-5" style={{color: '#10b981'}} />
                      Smart Prepayment Strategies
                    </CardTitle>
                    <p className="text-sm mt-2" style={{color: theme.textSecondary}}>
                      Compare different prepayment approaches to find the best strategy for your situation
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(result.prepayment_scenarios).map(([key, scenario]) => (
                        <div
                          key={key}
                          className="p-4 rounded-lg cursor-pointer transition-all"
                          style={{
                            background: theme.backgroundSecondary,
                            border: `2px solid ${selectedScenario === key ? '#a855f7' : theme.border}`
                          }}
                          onClick={() => setSelectedScenario(key)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold" style={{color: theme.text}}>{scenario.name}</h4>
                            {selectedScenario === key && <Check className="w-5 h-5" style={{color: '#a855f7'}} />}
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span style={{color: theme.textSecondary}}>Interest Saved:</span>
                              <span className="font-bold" style={{color: '#10b981'}}>
                                {formatCurrency(scenario.interest_saved)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{color: theme.textSecondary}}>Time Saved:</span>
                              <span className="font-semibold" style={{color: '#3b82f6'}}>
                                {Math.floor(scenario.time_saved_months / 12)}y {scenario.time_saved_months % 12}m
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{color: theme.textSecondary}}>New Tenure:</span>
                              <span style={{color: theme.text}}>
                                {Math.floor(scenario.tenure_months / 12)} years
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Comparison Chart */}
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold mb-4" style={{color: theme.text}}>
                        Strategy Comparison
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={prepareScenarioComparison()}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                          <XAxis dataKey="name" stroke={theme.textSecondary} />
                          <YAxis stroke={theme.textSecondary} />
                          <RechartsTooltip 
                            contentStyle={{background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px'}}
                            labelStyle={{color: theme.text}}
                          />
                          <Legend />
                          <Bar dataKey="interest" fill="#ef4444" name="Total Interest (₹)" />
                          <Bar dataKey="tenure" fill="#a855f7" name="Tenure (years)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {result && (
              <>
                {/* Principal vs Interest Split */}
                {result.principal_vs_interest_split && (
                  <Card style={{background: theme.cardBg, borderColor: theme.border}}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                        <BarChart3 className="w-5 h-5" style={{color: '#06b6d4'}} />
                        Payment Breakdown Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {Object.entries(result.principal_vs_interest_split).map(([period, data]) => {
                          if (!data.principal && !data.interest) return null;
                          
                          return (
                            <div key={period} className="p-4 rounded-lg" style={{background: theme.backgroundSecondary, border: `1px solid ${theme.border}`}}>
                              <h4 className="font-semibold mb-3 capitalize" style={{color: theme.text}}>
                                {period.replace(/_/g, ' ')}
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span style={{color: theme.textSecondary}}>Principal:</span>
                                  <span className="font-semibold" style={{color: '#10b981'}}>
                                    {formatCurrency(data.principal)} ({data.principal_percentage}%)
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span style={{color: theme.textSecondary}}>Interest:</span>
                                  <span className="font-semibold" style={{color: '#ef4444'}}>
                                    {formatCurrency(data.interest)} ({data.interest_percentage}%)
                                  </span>
                                </div>
                                
                                {/* Progress bar */}
                                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{background: theme.backgroundTertiary}}>
                                  <div 
                                    className="h-full" 
                                    style={{
                                      width: `${data.principal_percentage}%`,
                                      background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Yearly Amortization Chart */}
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-4" style={{color: theme.text}}>
                          Yearly Payment Distribution
                        </h4>
                        <ResponsiveContainer width="100%" height={350}>
                          <AreaChart data={prepareAmortizationChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                            <XAxis dataKey="year" stroke={theme.textSecondary} />
                            <YAxis stroke={theme.textSecondary} />
                            <RechartsTooltip 
                              contentStyle={{background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px'}}
                              labelStyle={{color: theme.text}}
                              formatter={(value) => formatCurrency(value)}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="Principal" stackId="1" stroke="#10b981" fill="#10b981" />
                            <Area type="monotone" dataKey="Interest" stackId="1" stroke="#ef4444" fill="#ef4444" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Key Insight */}
                      <div className="mt-6 p-4 rounded-lg" style={{background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)'}}>
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 mt-0.5" style={{color: '#fbbf24'}} />
                          <div>
                            <h4 className="font-semibold mb-1" style={{color: '#fbbf24'}}>Key Insight</h4>
                            <p className="text-sm" style={{color: theme.textSecondary}}>
                              In the first year, {result.principal_vs_interest_split?.first_year?.interest_percentage || 0}% of your payments go towards interest. 
                              Early prepayments have the maximum impact on reducing total interest paid.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
