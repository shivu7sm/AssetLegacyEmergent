import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/context/ThemeContext';
import { TrendingDown, DollarSign, Calendar, Percent, Wallet, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SWPCalculator() {
  const { theme } = useTheme();
  const [initialInvestment, setInitialInvestment] = useState(1000000);
  const [withdrawalAmount, setWithdrawalAmount] = useState(10000);
  const [expectedReturn, setExpectedReturn] = useState(10);
  const [timePeriod, setTimePeriod] = useState(15);
  const [result, setResult] = useState(null);

  const calculateSWP = () => {
    const monthlyRate = expectedReturn / 12 / 100;
    const months = timePeriod * 12;
    
    let balance = initialInvestment;
    let totalWithdrawn = 0;
    const chartData = [];
    
    for (let year = 1; year <= timePeriod; year++) {
      for (let month = 1; month <= 12; month++) {
        if (balance <= 0) break;
        
        // Add returns
        balance = balance * (1 + monthlyRate);
        
        // Withdraw
        const withdrawal = Math.min(withdrawalAmount, balance);
        balance -= withdrawal;
        totalWithdrawn += withdrawal;
      }
      
      chartData.push({
        year: `Year ${year}`,
        balance: Math.round(Math.max(0, balance)),
        withdrawn: Math.round(year * 12 * withdrawalAmount)
      });
      
      if (balance <= 0) break;
    }
    
    const finalBalance = Math.max(0, balance);
    const totalMonths = balance > 0 ? months : chartData.length * 12;
    
    setResult({
      finalBalance: Math.round(finalBalance),
      totalWithdrawn: Math.round(Math.min(totalWithdrawn, withdrawalAmount * months)),
      duration: totalMonths,
      chartData
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Layout>
      <div className="space-y-6" style={{padding: '1.5rem 0'}}>
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{color: theme.text, fontFamily: 'Space Grotesk, sans-serif'}}>
            SWP Calculator
          </h1>
          <p className="text-base sm:text-lg" style={{color: theme.textSecondary}}>
            Plan your Systematic Withdrawal Plan for retirement income
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                <Wallet className="w-5 h-5" style={{color: '#ef4444'}} />
                Withdrawal Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Initial Investment */}
              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Initial Investment
                  </span>
                  <span className="font-bold" style={{color: theme.text}}>
                    {formatCurrency(initialInvestment)}
                  </span>
                </Label>
                <Input
                  type="range"
                  min="100000"
                  max="10000000"
                  step="50000"
                  value={initialInvestment}
                  onChange={(e) => setInitialInvestment(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{color: theme.textSecondary}}>
                  <span>₹1L</span>
                  <span>₹1Cr</span>
                </div>
              </div>

              {/* Monthly Withdrawal */}
              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Monthly Withdrawal
                  </span>
                  <span className="font-bold" style={{color: theme.text}}>
                    {formatCurrency(withdrawalAmount)}
                  </span>
                </Label>
                <Input
                  type="range"
                  min="5000"
                  max="100000"
                  step="1000"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{color: theme.textSecondary}}>
                  <span>₹5,000</span>
                  <span>₹1,00,000</span>
                </div>
              </div>

              {/* Expected Return */}
              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Expected Return (p.a.)
                  </span>
                  <span className="font-bold" style={{color: theme.text}}>
                    {expectedReturn}%
                  </span>
                </Label>
                <Input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{color: theme.textSecondary}}>
                  <span>1%</span>
                  <span>20%</span>
                </div>
              </div>

              {/* Time Period */}
              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Time Period (years)
                  </span>
                  <span className="font-bold" style={{color: theme.text}}>
                    {timePeriod} years
                  </span>
                </Label>
                <Input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{color: theme.textSecondary}}>
                  <span>5 years</span>
                  <span>40 years</span>
                </div>
              </div>

              <Button
                onClick={calculateSWP}
                className="w-full text-white font-medium"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}}
              >
                Calculate Withdrawals
              </Button>
            </CardContent>
          </Card>

          {/* Results Card */}
          {result && (
            <Card style={{background: theme.cardBg, borderColor: theme.border}}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                  <TrendingDown className="w-5 h-5" style={{color: '#a855f7'}} />
                  Withdrawal Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Total Withdrawn */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Total Withdrawn</div>
                    <div className="text-2xl font-bold" style={{color: '#ef4444'}}>
                      {formatCurrency(result.totalWithdrawn)}
                    </div>
                  </div>

                  {/* Final Balance */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Remaining Balance</div>
                    <div className="text-2xl font-bold" style={{color: '#10b981'}}>
                      {formatCurrency(result.finalBalance)}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Corpus Lasts For</div>
                    <div className="text-3xl font-bold" style={{color: '#a855f7'}}>
                      {Math.floor(result.duration / 12)} years {result.duration % 12} months
                    </div>
                  </div>
                </div>

                {result.finalBalance === 0 && (
                  <div className="p-3 rounded-lg" style={{background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)'}}>
                    <p className="text-sm" style={{color: '#fbbf24'}}>
                      ⚠️ Your corpus will be depleted after {Math.floor(result.duration / 12)} years. 
                      Consider reducing withdrawal amount or increasing expected returns.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chart */}
        {result && (
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardHeader>
              <CardTitle style={{color: theme.text}}>Corpus Depletion Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={result.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="year" stroke={theme.textSecondary} />
                  <YAxis stroke={theme.textSecondary} />
                  <RechartsTooltip 
                    contentStyle={{background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px'}}
                    labelStyle={{color: theme.text}}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} name="Remaining Balance" />
                  <Line type="monotone" dataKey="withdrawn" stroke="#ef4444" strokeWidth={2} name="Cumulative Withdrawal" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card style={{background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)'}}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 mt-0.5" style={{color: '#ef4444'}} />
              <div>
                <h3 className="font-semibold mb-2" style={{color: theme.text}}>About SWP Calculator</h3>
                <p className="text-sm" style={{color: theme.textSecondary}}>
                  Systematic Withdrawal Plans (SWP) help you receive regular income from your mutual fund investments. 
                  This calculator helps plan retirement income while your remaining corpus continues to grow. 
                  Actual withdrawals may vary based on market conditions and fund performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
