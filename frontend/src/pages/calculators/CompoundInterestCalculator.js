import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/context/ThemeContext';
import { Zap, DollarSign, Calendar, Percent, Target, Info, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CompoundInterestCalculator() {
  const { theme } = useTheme();
  const [principal, setPrincipal] = useState(100000);
  const [interestRate, setInterestRate] = useState(8);
  const [timePeriod, setTimePeriod] = useState(10);
  const [compoundFrequency, setCompoundFrequency] = useState('monthly');
  const [result, setResult] = useState(null);

  const compoundingFrequencies = {
    'daily': 365,
    'monthly': 12,
    'quarterly': 4,
    'half-yearly': 2,
    'yearly': 1
  };

  const calculateCompoundInterest = () => {
    const rate = interestRate / 100;
    const n = compoundingFrequencies[compoundFrequency];
    const t = timePeriod;
    
    // Compound Interest Formula: A = P(1 + r/n)^(nt)
    const amount = principal * Math.pow((1 + rate / n), n * t);
    const interest = amount - principal;
    
    // Simple Interest for comparison
    const simpleInterest = principal * rate * t;
    const simpleAmount = principal + simpleInterest;
    
    // Generate year-wise data
    const chartData = [];
    for (let year = 1; year <= timePeriod; year++) {
      const compoundAmount = principal * Math.pow((1 + rate / n), n * year);
      const simpleAmt = principal + (principal * rate * year);
      
      chartData.push({
        year: `Year ${year}`,
        compound: Math.round(compoundAmount),
        simple: Math.round(simpleAmt),
        principal: principal
      });
    }
    
    setResult({
      futureValue: Math.round(amount),
      totalInterest: Math.round(interest),
      simpleInterest: Math.round(simpleInterest),
      compoundBenefit: Math.round(interest - simpleInterest),
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
            Compound Interest Calculator
          </h1>
          <p className="text-base sm:text-lg" style={{color: theme.textSecondary}}>
            See the power of compounding with different frequencies
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card style={{background: theme.cardBg, borderColor: theme.border}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                <Zap className="w-5 h-5" style={{color: '#fbbf24'}} />
                Investment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Principal Amount */}
              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Principal Amount
                  </span>
                  <span className="font-bold" style={{color: theme.text}}>
                    {formatCurrency(principal)}
                  </span>
                </Label>
                <Input
                  type="range"
                  min="10000"
                  max="10000000"
                  step="10000"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{color: theme.textSecondary}}>
                  <span>₹10K</span>
                  <span>₹1Cr</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Annual Interest Rate
                  </span>
                  <span className="font-bold" style={{color: theme.text}}>
                    {interestRate}%
                  </span>
                </Label>
                <Input
                  type="range"
                  min="1"
                  max="30"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
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

              {/* Compounding Frequency */}
              <div>
                <Label style={{color: theme.textSecondary}} className="mb-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Compounding Frequency
                </Label>
                <Select value={compoundFrequency} onValueChange={setCompoundFrequency}>
                  <SelectTrigger style={{background: theme.backgroundSecondary, borderColor: theme.border, color: theme.text}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{background: theme.cardBg, borderColor: theme.border}}>
                    <SelectItem value="daily" style={{color: theme.text}}>Daily (365 times)</SelectItem>
                    <SelectItem value="monthly" style={{color: theme.text}}>Monthly (12 times)</SelectItem>
                    <SelectItem value="quarterly" style={{color: theme.text}}>Quarterly (4 times)</SelectItem>
                    <SelectItem value="half-yearly" style={{color: theme.text}}>Half-Yearly (2 times)</SelectItem>
                    <SelectItem value="yearly" style={{color: theme.text}}>Yearly (1 time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={calculateCompoundInterest}
                className="w-full text-white font-medium"
                style={{background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'}}
              >
                Calculate Interest
              </Button>
            </CardContent>
          </Card>

          {/* Results Card */}
          {result && (
            <Card style={{background: theme.cardBg, borderColor: theme.border}}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3" style={{color: theme.text}}>
                  <Target className="w-5 h-5" style={{color: '#a855f7'}} />
                  Compound Interest Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Principal */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Principal Amount</div>
                    <div className="text-2xl font-bold" style={{color: '#3b82f6'}}>
                      {formatCurrency(principal)}
                    </div>
                  </div>

                  {/* Compound Interest */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Compound Interest Earned</div>
                    <div className="text-2xl font-bold" style={{color: '#10b981'}}>
                      {formatCurrency(result.totalInterest)}
                    </div>
                  </div>

                  {/* Maturity Value */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: theme.textSecondary}}>Maturity Value</div>
                    <div className="text-3xl font-bold" style={{color: '#a855f7'}}>
                      {formatCurrency(result.futureValue)}
                    </div>
                  </div>

                  {/* Compound Benefit */}
                  <div className="p-4 rounded-lg" style={{background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)'}}>
                    <div className="text-sm mb-1" style={{color: theme.textSecondary}}>
                      Compound Benefit (vs Simple Interest)
                    </div>
                    <div className="text-xl font-bold" style={{color: '#fbbf24'}}>
                      {formatCurrency(result.compoundBenefit)}
                    </div>
                    <div className="text-xs mt-1" style={{color: theme.textSecondary}}>
                      Extra earnings from compounding
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
              <CardTitle style={{color: theme.text}}>Compound vs Simple Interest Growth</CardTitle>
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
                  <Area type="monotone" dataKey="compound" stroke="#10b981" fill="#10b98180" name="Compound Interest" />
                  <Area type="monotone" dataKey="simple" stroke="#ef4444" fill="#ef444480" name="Simple Interest" />
                  <Area type="monotone" dataKey="principal" stroke="#3b82f6" fill="#3b82f680" name="Principal" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card style={{background: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)'}}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 mt-0.5" style={{color: '#fbbf24'}} />
                <div>
                  <h3 className="font-semibold mb-2" style={{color: theme.text}}>About Compound Interest</h3>
                  <p className="text-sm" style={{color: theme.textSecondary}}>
                    Compound interest is "interest on interest" - your earnings generate their own earnings. 
                    The more frequently interest is compounded, the higher your returns will be. 
                    This is why Einstein called compound interest the "eighth wonder of the world."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)'}}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 mt-0.5" style={{color: '#10b981'}} />
                <div>
                  <h3 className="font-semibold mb-2" style={{color: theme.text}}>Compounding Frequencies</h3>
                  <ul className="text-sm space-y-1" style={{color: theme.textSecondary}}>
                    <li>• <strong>Daily:</strong> Best for savings accounts (highest returns)</li>
                    <li>• <strong>Monthly:</strong> Common for mutual funds & SIPs</li>
                    <li>• <strong>Quarterly:</strong> Fixed deposits & bonds</li>
                    <li>• <strong>Yearly:</strong> Basic investments</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
