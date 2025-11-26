import { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calculator, Sparkles, TrendingDown, DollarSign, Calendar, Percent } from 'lucide-react';

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

export default function LoanCalculatorModal({ asset, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    principal: '',
    annual_interest_rate: '',
    tenure_months: '',
    loan_type: 'personal'
  });
  const [result, setResult] = useState(null);

  // Initialize form data when asset changes or modal opens
  useEffect(() => {
    if (open && asset) {
      const loanType = asset.type === 'credit_card' ? 'credit_card' : 'personal';
      setFormData({
        principal: asset.principal_amount || asset.total_value || '',
        annual_interest_rate: asset.interest_rate || '',
        tenure_months: asset.tenure_months || '',
        loan_type: loanType
      });
      setResult(null);
    }
  }, [open, asset]);

  const handleCalculate = async (e) => {
    if (e) e.preventDefault();
    
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
      toast.error('Failed to calculate loan details. Try adjusting parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (asset) {
      const loanType = asset.type === 'credit_card' ? 'credit_card' : 'personal';
      setFormData({
        principal: asset.principal_amount || asset.total_value || '',
        annual_interest_rate: asset.interest_rate || '',
        tenure_months: asset.tenure_months || '',
        loan_type: loanType
      });
    }
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-y-auto"
        style={{background: '#1a1229', borderColor: '#2d1f3d'}}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl" style={{color: '#f8fafc'}}>
            <Calculator className="w-7 h-7" style={{color: '#a855f7'}} />
            Loan Repayment Calculator
          </DialogTitle>
          {asset && (
            <p className="text-sm" style={{color: '#94a3b8'}}>
              {asset.name} - Adjust parameters to see payment impact
            </p>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Calculator Form */}
          <div className="p-6 rounded-lg" style={{background: '#0f0a1a', border: '1px solid #2d1f3d'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg" style={{background: '#a855f7'}}>
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold" style={{color: '#f8fafc'}}>Loan Details</h3>
            </div>

            <form onSubmit={handleCalculate} className="space-y-5">
              {/* Loan Type */}
              <div>
                <Label className="text-sm font-medium mb-2" style={{color: '#94a3b8'}}>
                  Loan Type
                </Label>
                <Select 
                  value={formData.loan_type}
                  onValueChange={(value) => setFormData({...formData, loan_type: value})}
                >
                  <SelectTrigger style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <span>{selectedLoanType?.icon}</span>
                        <span>{selectedLoanType?.label}</span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    {LOAN_TYPES.map(type => (
                      <SelectItem 
                        key={type.value} 
                        value={type.value}
                        style={{color: '#f8fafc'}}
                      >
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
                <Label className="text-sm font-medium mb-2 flex items-center gap-2" style={{color: '#94a3b8'}}>
                  <DollarSign className="w-4 h-4" />
                  Principal Amount
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter loan amount"
                  value={formData.principal}
                  onChange={(e) => setFormData({...formData, principal: e.target.value})}
                  style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}
                  required
                />
              </div>

              {/* Interest Rate */}
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2" style={{color: '#94a3b8'}}>
                  <Percent className="w-4 h-4" />
                  Annual Interest Rate (%)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter interest rate"
                  value={formData.annual_interest_rate}
                  onChange={(e) => setFormData({...formData, annual_interest_rate: e.target.value})}
                  style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}
                  required
                />
              </div>

              {/* Tenure */}
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2" style={{color: '#94a3b8'}}>
                  <Calendar className="w-4 h-4" />
                  Loan Tenure (Months)
                </Label>
                <Input
                  type="number"
                  placeholder="Enter tenure in months"
                  value={formData.tenure_months}
                  onChange={(e) => setFormData({...formData, tenure_months: e.target.value})}
                  style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1"
                  style={{background: '#a855f7', color: 'white'}}
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
          </div>

          {/* Results */}
          <div className="p-6 rounded-lg" style={{background: '#0f0a1a', border: '1px solid #2d1f3d'}}>
            {result ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg" style={{background: '#10b981'}}>
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold" style={{color: '#f8fafc'}}>Payment Summary</h3>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 rounded-lg" style={{background: '#1a1229', border: '1px solid #2d1f3d'}}>
                    <div className="text-sm mb-1" style={{color: '#94a3b8'}}>Monthly Payment (EMI)</div>
                    <div className="text-3xl font-bold" style={{color: '#10b981'}}>
                      {formatCurrency(result.monthly_payment)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg" style={{background: '#1a1229', border: '1px solid #2d1f3d'}}>
                      <div className="text-xs mb-1" style={{color: '#94a3b8'}}>Total Interest</div>
                      <div className="text-xl font-bold" style={{color: '#f59e0b'}}>
                        {formatCurrency(result.total_interest)}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{background: '#1a1229', border: '1px solid #2d1f3d'}}>
                      <div className="text-xs mb-1" style={{color: '#94a3b8'}}>Total Repayment</div>
                      <div className="text-xl font-bold" style={{color: '#a855f7'}}>
                        {formatCurrency(result.total_amount)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Tips */}
                {result.ai_tips && (
                  <div className="p-4 rounded-lg" style={{background: '#1a1229', border: '1px solid #2d1f3d'}}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5" style={{color: '#a855f7'}} />
                      <h4 className="font-semibold" style={{color: '#f8fafc'}}>AI Debt Reduction Tips</h4>
                    </div>
                    <p className="text-sm leading-relaxed" style={{color: '#94a3b8'}}>
                      {result.ai_tips}
                    </p>
                  </div>
                )}

                {/* Amortization Schedule Preview */}
                {result.amortization_schedule && result.amortization_schedule.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3" style={{color: '#f8fafc'}}>
                      Payment Schedule (First 5 Months)
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {result.amortization_schedule.slice(0, 5).map((payment, idx) => (
                        <div 
                          key={idx}
                          className="p-3 rounded text-xs"
                          style={{background: '#1a1229', border: '1px solid #2d1f3d'}}
                        >
                          <div className="flex justify-between items-center">
                            <span style={{color: '#94a3b8'}}>Month {payment.month}</span>
                            <span className="font-semibold" style={{color: '#f8fafc'}}>
                              {formatCurrency(payment.payment)}
                            </span>
                          </div>
                          <div className="flex justify-between mt-1" style={{color: '#64748b'}}>
                            <span>Principal: {formatCurrency(payment.principal)}</span>
                            <span>Interest: {formatCurrency(payment.interest)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {result.amortization_schedule.length > 5 && (
                      <p className="text-xs text-center mt-2" style={{color: '#64748b'}}>
                        Showing 5 of {result.amortization_schedule.length} payments
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Calculator className="w-16 h-16 mx-auto mb-4" style={{color: '#2d1f3d'}} />
                  <p className="text-lg" style={{color: '#64748b'}}>
                    Enter loan details and click Calculate
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
