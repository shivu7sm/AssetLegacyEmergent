import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/context/ThemeContext';
import { TrendingUp, DollarSign, Calendar, Percent, Target, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function SIPCalculator() {
  const { theme } = useTheme();
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [timePeriod, setTimePeriod] = useState(10);
  const [result, setResult] = useState(null);

  const calculateSIP = () => {
    const monthlyRate = expectedReturn / 12 / 100;
    const months = timePeriod * 12;
    
    // SIP Future Value Formula: FV = P × ((1 + r)^n - 1) / r) × (1 + r)
    const futureValue = monthlyInvestment * 
      (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    
    const totalInvested = monthlyInvestment * months;
    const totalReturns = futureValue - totalInvested;
    
    // Generate year-wise data
    const chartData = [];
    for (let year = 1; year <= timePeriod; year++) {
      const m = year * 12;
      const fv = monthlyInvestment * 
        (((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate));
      const invested = monthlyInvestment * m;
      
      chartData.push({
        year: `Year ${year}`,
        invested: Math.round(invested),
        returns: Math.round(fv - invested),
        total: Math.round(fv)
      });
    }
    
    setResult({
      futureValue: Math.round(futureValue),
      totalInvested: Math.round(totalInvested),
      totalReturns: Math.round(totalReturns),
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
            SIP Calculator
          </h1>
          <p className="text-base sm:text-lg" style={{color: theme.textSecondary}}>
            Calculate returns on your Systematic Investment Plan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                <TrendingUp className="w-5 h-5" style={{color: '#10b981'}} />
                Investment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Monthly Investment */}
              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Monthly Investment
                  </span>
                  <span className="font-bold" style={{color: theme.text}}>
                    {formatCurrency(monthlyInvestment)}
                  </span>
                </Label>
                <Input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{color: theme.textSecondary}}>
                  <span>₹500</span>
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
                  max="30"
                  step="0.5"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{color: theme.textSecondary}}>
                  <span>1%</span>
                  <span>30%</span>
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
                  min="1"
                  max="40"
                  step="1"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{color: theme.textSecondary}}>
                  <span>1 year</span>
                  <span>40 years</span>
                </div>
              </div>

              <Button
                onClick={calculateSIP}
                className="w-full text-white font-medium"
                style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}
              >
                Calculate Returns
              </Button>
            </CardContent>
          </Card>

          {/* Results Card */}
          {result && (
            <Card style={{background: theme.cardBg, borderColor: theme.border}}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                  <Target className="w-5 h-5" style={{color: '#a855f7'}} />
                  Investment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Total Invested */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Total Invested</div>
                    <div className="text-2xl font-bold" style={{color: '#3b82f6'}}>
                      {formatCurrency(result.totalInvested)}
                    </div>
                  </div>

                  {/* Total Returns */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Estimated Returns</div>
                    <div className="text-2xl font-bold" style={{color: '#10b981'}}>
                      {formatCurrency(result.totalReturns)}
                    </div>
                  </div>

                  {/* Future Value */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Maturity Value</div>
                    <div className="text-3xl font-bold" style={{color: '#a855f7'}}>
                      {formatCurrency(result.futureValue)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chart */}
        {result && (
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardHeader>
              <CardTitle style={{color: theme.text}}>Wealth Growth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={result.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="year" stroke={theme.textSecondary} />
                  <YAxis stroke={theme.textSecondary} />
                  <RechartsTooltip 
                    contentStyle={{background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px'}}
                    labelStyle={{color: theme.text}}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="invested" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Invested Amount" />
                  <Area type="monotone" dataKey="returns" stackId="1" stroke="#10b981" fill="#10b981" name="Returns" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card style={{background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)'}}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 mt-0.5" style={{color: '#3b82f6'}} />
              <div>
                <h3 className="font-semibold mb-2" style={{color: theme.text}}>About SIP Calculators</h3>
                <p className="text-sm" style={{color: theme.textSecondary}}>
                  Systematic Investment Plans (SIP) allow you to invest a fixed amount regularly in mutual funds. 
                  This calculator shows the power of compounding and rupee cost averaging. 
                  Actual returns may vary based on market conditions and fund performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
