import { useState } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { Calculator, TrendingDown, Sparkles, DollarSign, Calendar, Percent } from 'lucide-react';

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

export default function LoanCalculator() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    principal: '',
    annual_interest_rate: '',
    tenure_months: '',
    loan_type: 'personal'
  });
  const [result, setResult] = useState(null);

  const handleCalculate = async (e) => {
    e.preventDefault();
    
    if (!formData.principal || !formData.annual_interest_rate || !formData.tenure_months) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/loan-calculator`, {
        principal: parseFloat(formData.principal),
        annual_interest_rate: parseFloat(formData.annual_interest_rate),
        tenure_months: parseInt(formData.tenure_months),
        loan_type: formData.loan_type
      }, { withCredentials: true });

      setResult(response.data);
      toast.success('Calculation complete!');
    } catch (error) {
      console.error('Calculation failed:', error);
      toast.error('Failed to calculate loan details');
    } finally {
      setLoading(false);
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
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const selectedLoanType = LOAN_TYPES.find(t => t.value === formData.loan_type);

  return (
    <Layout>
      <div className="space-y-8" style={{padding: '2rem 0'}}>
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{color: '#f8fafc', fontFamily: 'Space Grotesk, sans-serif'}}>
            Loan Repayment Calculator
          </h1>
          <p className="text-lg" style={{color: '#94a3b8'}}>
            Calculate your loan payments and get AI-powered debt reduction tips
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <Card style={{background: 'theme.cardBg', borderColor: '#2d1f3d'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3" style={{color: '#f8fafc'}}>
                <Calculator className="w-6 h-6" style={{color: '#a855f7'}} />
                Loan Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCalculate} className="space-y-6">
                {/* Loan Type */}
                <div>
                  <Label className="text-slate-300 mb-2 block">Loan Type</Label>
                  <Select 
                    value={formData.loan_type} 
                    onValueChange={(value) => setFormData({ ...formData, loan_type: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {LOAN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white">
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Principal Amount */}
                <div>
                  <Label className="text-slate-300 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Principal Amount *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.principal}
                    onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                    placeholder="50000"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                {/* Interest Rate */}
                <div>
                  <Label className="text-slate-300 mb-2 flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Annual Interest Rate (%) *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.annual_interest_rate}
                    onChange={(e) => setFormData({ ...formData, annual_interest_rate: e.target.value })}
                    placeholder="8.5"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                {/* Tenure */}
                <div>
                  <Label className="text-slate-300 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Loan Tenure (months) *
                  </Label>
                  <Input
                    type="number"
                    value={formData.tenure_months}
                    onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })}
                    placeholder="60"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs mt-1" style={{color: '#94a3b8'}}>
                    {formData.tenure_months && `${Math.floor(formData.tenure_months / 12)} years and ${formData.tenure_months % 12} months`}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 text-white"
                    style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                  >
                    {loading ? 'Calculating...' : 'Calculate'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleReset}
                    variant="outline"
                    style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results Summary */}
          {result && (
            <Card style={{background: 'theme.cardBg', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3" style={{color: '#f8fafc'}}>
                  <TrendingDown className="w-6 h-6" style={{color: '#10b981'}} />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Monthly Payment */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: '#94a3b8'}}>Monthly Payment</div>
                    <div className="text-3xl font-bold" style={{color: '#a855f7'}}>
                      {formatCurrency(result.monthly_payment)}
                    </div>
                  </div>

                  {/* Total Interest */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: '#94a3b8'}}>Total Interest</div>
                    <div className="text-2xl font-bold" style={{color: '#ef4444'}}>
                      {formatCurrency(result.total_interest)}
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: '#94a3b8'}}>Total Repayment</div>
                    <div className="text-2xl font-bold" style={{color: '#10b981'}}>
                      {formatCurrency(result.total_amount)}
                    </div>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="pt-4 border-t" style={{borderColor: '#2d1f3d'}}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{selectedLoanType?.icon}</span>
                    <span className="font-semibold" style={{color: '#f8fafc'}}>{selectedLoanType?.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div style={{color: '#94a3b8'}}>Principal:</div>
                    <div style={{color: '#f8fafc', fontWeight: 600}}>{formatCurrency(parseFloat(formData.principal))}</div>
                    <div style={{color: '#94a3b8'}}>Interest Rate:</div>
                    <div style={{color: '#f8fafc', fontWeight: 600}}>{formData.annual_interest_rate}% p.a.</div>
                    <div style={{color: '#94a3b8'}}>Tenure:</div>
                    <div style={{color: '#f8fafc', fontWeight: 600}}>
                      {Math.floor(formData.tenure_months / 12)} years {formData.tenure_months % 12} months
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Tips */}
        {result?.ai_tips && (
          <Card style={{background: 'linear-gradient(135deg, #2d1f3d 0%, theme.cardBg 100%)', borderColor: '#a855f7', borderWidth: '2px'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3" style={{color: '#f8fafc'}}>
                <Sparkles className="w-6 h-6" style={{color: '#fbbf24'}} />
                AI-Powered Debt Reduction Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none" style={{color: '#cbd5e1', lineHeight: '1.7'}}>
                <div className="whitespace-pre-wrap">{result.ai_tips}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Amortization Schedule */}
        {result?.amortization_schedule && (
          <Card style={{background: 'theme.cardBg', borderColor: '#2d1f3d'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3" style={{color: '#f8fafc'}}>
                <Calendar className="w-6 h-6" style={{color: '#06b6d4'}} />
                Amortization Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{background: 'theme.backgroundTertiary', borderBottom: '1px solid #2d1f3d'}}>
                    <tr>
                      <th className="text-left p-3" style={{color: '#94a3b8', fontWeight: 600}}>Month</th>
                      <th className="text-right p-3" style={{color: '#94a3b8', fontWeight: 600}}>Payment</th>
                      <th className="text-right p-3" style={{color: '#94a3b8', fontWeight: 600}}>Principal</th>
                      <th className="text-right p-3" style={{color: '#94a3b8', fontWeight: 600}}>Interest</th>
                      <th className="text-right p-3" style={{color: '#94a3b8', fontWeight: 600}}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.amortization_schedule.map((entry, index) => (
                      <tr
                        key={entry.month}
                        style={{
                          borderBottom: '1px solid #2d1f3d',
                          background: index % 2 === 0 ? 'transparent' : 'rgba(45, 31, 61, 0.3)'
                        }}
                      >
                        <td className="p-3" style={{color: '#f8fafc', fontWeight: 500}}>
                          {entry.month}
                        </td>
                        <td className="text-right p-3" style={{color: '#cbd5e1'}}>
                          {formatCurrency(entry.payment)}
                        </td>
                        <td className="text-right p-3" style={{color: '#10b981'}}>
                          {formatCurrency(entry.principal_payment)}
                        </td>
                        <td className="text-right p-3" style={{color: '#ef4444'}}>
                          {formatCurrency(entry.interest_payment)}
                        </td>
                        <td className="text-right p-3" style={{color: '#a855f7', fontWeight: 600}}>
                          {formatCurrency(entry.remaining_balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
