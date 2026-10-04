import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { ArrowRight, Plus, RefreshCw, TrendingUp } from 'lucide-react';

export default function PortfolioGuide() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: 'Create Portfolio Asset',
      description: 'Go to Assets page and click "Add Asset"',
      action: 'Select "Portfolio Account" from the asset type dropdown',
      icon: Plus
    },
    {
      number: 2,
      title: 'Configure Provider',
      description: 'Enter portfolio details',
      action: 'Name: "My Binance Portfolio"\nProvider: Binance, Zerodha, Robinhood, etc.\nType: Crypto Exchange or Stock Broker',
      icon: ArrowRight
    },
    {
      number: 3,
      title: 'Add Holdings',
      description: 'Add individual stocks or crypto holdings',
      action: 'Symbol: BTC, AAPL, ETH\nQuantity: 0.5, 10, 5\nPurchase Price: $40,000, $150, $2,000\nPurchase Date & Currency',
      icon: Plus
    },
    {
      number: 4,
      title: 'Auto-Calculate Total',
      description: 'Portfolio value updates automatically',
      action: 'Total = Sum of all holdings\nIncludes in Net Worth\nShows in Dashboard charts',
      icon: TrendingUp
    },
    {
      number: 5,
      title: 'Manual Sync (Optional)',
      description: 'Update current prices manually',
      action: 'Click sync button\nUpdate current prices\nSee real-time gains/losses',
      icon: RefreshCw
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3" style={{color: '#fafafa'}}>How to Create Portfolio Assets</h2>
        <p style={{color: '#a1a1aa'}}>Track all your exchange accounts and brokerages in one place</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card 
              key={step.number}
              style={{
                background: 'var(--fuse-surface)',
                borderColor: 'var(--fuse-primary)'
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{background: 'var(--fuse-primary)', color: '#fff'}}
                  >
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5" style={{color: 'var(--fuse-primary-text)'}} />
                      <h3 className="text-xl font-bold" style={{color: '#fafafa'}}>{step.title}</h3>
                    </div>
                    <p className="text-sm mb-3" style={{color: '#a1a1aa'}}>{step.description}</p>
                    <div 
                      className="p-3 rounded-lg text-sm font-mono whitespace-pre-line"
                      style={{background: 'theme.backgroundTertiary', color: '#d4d4d8'}}
                    >
                      {step.action}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card style={{background: 'var(--fuse-primary)', borderColor: 'var(--fuse-primary)'}}>
        <CardContent className="p-6 text-center">
          <h3 className="text-2xl font-bold mb-3 text-white">Ready to Create Your First Portfolio?</h3>
          <p className="mb-6 text-white/80">Start tracking your exchange accounts and see your complete net worth</p>
          <Button
            onClick={() => navigate('/assets')}
            size="lg"
            className="rounded-full text-lg px-8 py-6"
            style={{background: '#fff', color: 'var(--fuse-primary-text)'}}
          >
            <Plus className="w-5 h-5 mr-2" />
            Go to Assets Page
          </Button>
        </CardContent>
      </Card>

      <Card style={{background: 'theme.cardBg', borderColor: 'var(--fuse-border)'}}>
        <CardHeader>
          <CardTitle style={{color: '#fafafa'}}>Example Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{borderBottom: '2px solid var(--fuse-border)'}}>
                <tr>
                  <th className="text-left p-3" style={{color: '#a1a1aa'}}>Symbol</th>
                  <th className="text-left p-3" style={{color: '#a1a1aa'}}>Name</th>
                  <th className="text-right p-3" style={{color: '#a1a1aa'}}>Quantity</th>
                  <th className="text-right p-3" style={{color: '#a1a1aa'}}>Purchase Price</th>
                  <th className="text-right p-3" style={{color: '#a1a1aa'}}>Current Value</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{borderBottom: '1px solid var(--fuse-border)'}}>
                  <td className="p-3" style={{color: '#fafafa'}}>BTC</td>
                  <td className="p-3" style={{color: '#d4d4d8'}}>Bitcoin</td>
                  <td className="text-right p-3" style={{color: '#fafafa'}}>0.5</td>
                  <td className="text-right p-3" style={{color: '#d4d4d8'}}>$40,000</td>
                  <td className="text-right p-3 font-bold" style={{color: '#10b981'}}>$22,500</td>
                </tr>
                <tr style={{borderBottom: '1px solid var(--fuse-border)'}}>
                  <td className="p-3" style={{color: '#fafafa'}}>ETH</td>
                  <td className="p-3" style={{color: '#d4d4d8'}}>Ethereum</td>
                  <td className="text-right p-3" style={{color: '#fafafa'}}>5</td>
                  <td className="text-right p-3" style={{color: '#d4d4d8'}}>$2,000</td>
                  <td className="text-right p-3 font-bold" style={{color: '#10b981'}}>$12,500</td>
                </tr>
                <tr>
                  <td colSpan="4" className="p-3 text-right font-bold" style={{color: '#fafafa'}}>Total Portfolio Value</td>
                  <td className="text-right p-3 text-xl font-bold" style={{color: 'var(--fuse-primary-text)'}}>$35,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
