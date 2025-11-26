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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" style={{background: '#1a1229', borderColor: '#E8C27C', borderWidth: '2px', maxHeight: '90vh', overflowY: 'auto'}}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{color: '#f8fafc', fontSize: '1.5rem'}}>
            <Calculator className="w-6 h-6" style={{color: '#E8C27C'}} />
            Loan Repayment Calculator
          </DialogTitle>
          <p className="text-sm" style={{color: '#94a3b8'}}>
            {asset?.name} - Adjust parameters to see impact on your payments
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Initial State - Calculate Button */}
          {!loanData ? (
            <div className="text-center py-8">
              <Calculator className="w-16 h-16 mx-auto mb-4" style={{color: '#E8C27C'}} />
              <p className="text-lg font-semibold mb-2" style={{color: '#f8fafc'}}>Ready to Calculate</p>
              <p className="text-sm mb-6" style={{color: '#94a3b8'}}>
                Click below to see your monthly payment, total interest, and full amortization schedule
              </p>
              <Button 
                onClick={handleCalculate}
                style={{background: 'linear-gradient(135deg, #E8C27C 0%, #F5D49F 100%)', color: '#0B0B11', fontSize: '1rem', padding: '0.75rem 2rem'}}
              >
                Calculate Payment Schedule
              </Button>
            </div>
          ) : (
            <>
              {/* Interactive Sliders */}
              <div className="grid grid-cols-2 gap-6 p-4 rounded-lg" style={{background: 'rgba(232, 194, 124, 0.08)', border: '1px solid rgba(232, 194, 124, 0.3)'}}>
                <div>
                  <Label className="text-slate-300 text-sm mb-2 flex justify-between">
                    <span>Interest Rate (%)</span>
                    <span className="font-bold text-lg" style={{color: '#E8C27C'}}>{loanParams.interestRate}%</span>
                  </Label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="0.5"
                    value={loanParams.interestRate}
                    onChange={(e) => recalculate({...loanParams, interestRate: parseFloat(e.target.value)})}
                    className="w-full h-2 rounded-lg"
                    style={{accentColor: '#E8C27C'}}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{color: '#64748b'}}>
                    <span>0%</span>
                    <span>30%</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-slate-300 text-sm mb-2 flex justify-between">
                    <span>Tenure (months)</span>
                    <span className="font-bold text-lg" style={{color: '#E8C27C'}}>{loanParams.tenure} mo</span>
                  </Label>
                  <input
                    type="range"
                    min="6"
                    max="360"
                    step="6"
                    value={loanParams.tenure}
                    onChange={(e) => recalculate({...loanParams, tenure: parseInt(e.target.value)})}
                    className="w-full h-2 rounded-lg"
                    style={{accentColor: '#E8C27C'}}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{color: '#64748b'}}>
                    <span>6 mo</span>
                    <span>{Math.floor(loanParams.tenure / 12)}y {loanParams.tenure % 12}m</span>
                    <span>30y</span>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg text-center" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                  <div className="text-xs mb-1" style={{color: '#94a3b8'}}>Monthly Payment</div>
                  <div className="text-2xl font-bold" style={{color: '#a855f7'}}>
                    ${loanData.monthly_payment.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-lg text-center" style={{background: 'rgba(255, 92, 115, 0.1)', border: '1px solid rgba(255, 92, 115, 0.3)'}}>
                  <div className="text-xs mb-1" style={{color: '#94a3b8'}}>Total Interest</div>
                  <div className="text-2xl font-bold" style={{color: '#FF5C73'}}>
                    ${loanData.total_interest.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-lg text-center" style={{background: 'rgba(75, 224, 161, 0.1)', border: '1px solid rgba(75, 224, 161, 0.3)'}}>
                  <div className="text-xs mb-1" style={{color: '#94a3b8'}}>Total Amount</div>
                  <div className="text-2xl font-bold" style={{color: '#4BE0A1'}}>
                    ${loanData.total_amount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Savings Indicator */}
              {hasSavings && (
                <div className="p-4 rounded-lg" style={{background: 'rgba(75, 224, 161, 0.15)', border: '2px solid rgba(75, 224, 161, 0.4)'}}>
                  <p className="text-base font-bold mb-1" style={{color: '#4BE0A1'}}>
                    💰 Potential Savings Detected!
                  </p>
                  <p className="text-sm" style={{color: '#cbd5e1'}}>
                    With the adjusted terms, you could save significantly on interest. Consider refinancing options.
                  </p>
                </div>
              )}

              {/* Amortization Schedule */}
              <div>
                <div className="text-sm font-semibold mb-3" style={{color: '#f8fafc'}}>
                  PAYMENT SCHEDULE (First 12 months)
                </div>
                <div style={{maxHeight: '300px', overflowY: 'auto', border: '1px solid #2d1f3d', borderRadius: '8px'}}>
                  <table className="w-full" style={{fontSize: '0.875rem'}}>
                    <thead style={{background: '#16001e', position: 'sticky', top: 0}}>
                      <tr>
                        <th className="p-2 text-left" style={{color: '#94a3b8'}}>Month</th>
                        <th className="p-2 text-right" style={{color: '#94a3b8'}}>Payment</th>
                        <th className="p-2 text-right" style={{color: '#94a3b8'}}>Principal</th>
                        <th className="p-2 text-right" style={{color: '#94a3b8'}}>Interest</th>
                        <th className="p-2 text-right" style={{color: '#94a3b8'}}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanData.amortization_schedule.slice(0, 12).map((entry) => (
                        <tr key={entry.month} style={{borderBottom: '1px solid rgba(255,255,255,0.03)'}}>
                          <td className="p-2" style={{color: '#cbd5e1'}}>{entry.month}</td>
                          <td className="p-2 text-right" style={{color: '#f8fafc', fontWeight: 600}}>${entry.payment.toLocaleString()}</td>
                          <td className="p-2 text-right" style={{color: '#4BE0A1'}}>${entry.principal_payment.toLocaleString()}</td>
                          <td className="p-2 text-right" style={{color: '#FF5C73'}}>${entry.interest_payment.toLocaleString()}</td>
                          <td className="p-2 text-right" style={{color: '#94a3b8'}}>${entry.remaining_balance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setLoanData(null)}
                  variant="outline"
                  style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                >
                  Reset Calculator
                </Button>
                <Button 
                  onClick={onClose}
                  className="flex-1"
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: '#fff'}}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
