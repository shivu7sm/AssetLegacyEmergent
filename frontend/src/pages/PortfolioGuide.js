import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, RefreshCw, TrendingUp } from 'lucide-react';

export default function PortfolioGuide() {
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
        <h2 className="text-3xl font-bold mb-3" style={{color: '#f8fafc'}}>How to Create Portfolio Assets</h2>
        <p style={{color: '#94a3b8'}}>Track all your exchange accounts and brokerages in one place</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card 
              key={step.number}
              style={{
                background: 'linear-gradient(135deg, theme.cardBg 0%, #2d1f3d 100%)',
                borderColor: '#a855f7'
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: '#fff'}}
                  >
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5" style={{color: '#a855f7'}} />
                      <h3 className="text-xl font-bold" style={{color: '#f8fafc'}}>{step.title}</h3>
                    </div>
                    <p className="text-sm mb-3" style={{color: '#94a3b8'}}>{step.description}</p>
                    <div 
                      className="p-3 rounded-lg text-sm font-mono whitespace-pre-line"
                      style={{background: 'theme.backgroundTertiary', color: '#cbd5e1'}}
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

      <Card style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', borderColor: '#a855f7'}}>
        <CardContent className="p-6 text-center">
          <h3 className="text-2xl font-bold mb-3 text-white">Ready to Create Your First Portfolio?</h3>
          <p className="mb-6 text-white/80">Start tracking your exchange accounts and see your complete net worth</p>
          <Button
            onClick={() => navigate('/assets')}
            size="lg"
            className="rounded-full text-lg px-8 py-6"
            style={{background: '#fff', color: '#a855f7'}}
          >
            <Plus className="w-5 h-5 mr-2" />
            Go to Assets Page
          </Button>
        </CardContent>
      </Card>

      <Card style={{background: 'theme.cardBg', borderColor: '#2d1f3d'}}>
        <CardHeader>
          <CardTitle style={{color: '#f8fafc'}}>Example Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{borderBottom: '2px solid #2d1f3d'}}>
                <tr>
                  <th className="text-left p-3" style={{color: '#94a3b8'}}>Symbol</th>
                  <th className="text-left p-3" style={{color: '#94a3b8'}}>Name</th>
                  <th className="text-right p-3" style={{color: '#94a3b8'}}>Quantity</th>
                  <th className="text-right p-3" style={{color: '#94a3b8'}}>Purchase Price</th>
                  <th className="text-right p-3" style={{color: '#94a3b8'}}>Current Value</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{borderBottom: '1px solid #2d1f3d'}}>
                  <td className="p-3" style={{color: '#f8fafc'}}>BTC</td>
                  <td className="p-3" style={{color: '#cbd5e1'}}>Bitcoin</td>
                  <td className="text-right p-3" style={{color: '#f8fafc'}}>0.5</td>
                  <td className="text-right p-3" style={{color: '#cbd5e1'}}>$40,000</td>
                  <td className="text-right p-3 font-bold" style={{color: '#10b981'}}>$22,500</td>
                </tr>
                <tr style={{borderBottom: '1px solid #2d1f3d'}}>
                  <td className="p-3" style={{color: '#f8fafc'}}>ETH</td>
                  <td className="p-3" style={{color: '#cbd5e1'}}>Ethereum</td>
                  <td className="text-right p-3" style={{color: '#f8fafc'}}>5</td>
                  <td className="text-right p-3" style={{color: '#cbd5e1'}}>$2,000</td>
                  <td className="text-right p-3 font-bold" style={{color: '#10b981'}}>$12,500</td>
                </tr>
                <tr>
                  <td colSpan="4" className="p-3 text-right font-bold" style={{color: '#f8fafc'}}>Total Portfolio Value</td>
                  <td className="text-right p-3 text-xl font-bold" style={{color: '#ec4899'}}>$35,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
