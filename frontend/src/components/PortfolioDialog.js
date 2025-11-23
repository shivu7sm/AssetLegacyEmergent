import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

const PORTFOLIO_PROVIDERS = [
  { value: 'binance', label: 'Binance', type: 'crypto_exchange' },
  { value: 'coinbase', label: 'Coinbase', type: 'crypto_exchange' },
  { value: 'kraken', label: 'Kraken', type: 'crypto_exchange' },
  { value: 'gemini', label: 'Gemini', type: 'crypto_exchange' },
  { value: 'zerodha', label: 'Zerodha', type: 'stock_broker' },
  { value: 'robinhood', label: 'Robinhood', type: 'stock_broker' },
  { value: 'etrade', label: 'E*TRADE', type: 'stock_broker' },
  { value: 'fidelity', label: 'Fidelity', type: 'stock_broker' },
  { value: 'other', label: 'Other', type: 'other' }
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD'];

export default function PortfolioDialog({ open, onOpenChange, onSave }) {
  const [portfolioData, setPortfolioData] = useState({
    name: '',
    provider_name: 'binance',
    provider_type: 'crypto_exchange',
    purchase_currency: 'USD'
  });

  const [holdings, setHoldings] = useState([]);
  const [holdingForm, setHoldingForm] = useState({
    symbol: '',
    name: '',
    quantity: '',
    purchase_price: '',
    purchase_date: '',
    purchase_currency: 'USD',
    current_price: '',
    asset_type: 'crypto'
  });

  const handleProviderChange = (value) => {
    const provider = PORTFOLIO_PROVIDERS.find(p => p.value === value);
    setPortfolioData({
      ...portfolioData,
      provider_name: value,
      provider_type: provider?.type || 'other'
    });
  };

  const addHolding = () => {
    if (!holdingForm.symbol || !holdingForm.quantity || !holdingForm.purchase_price) {
      toast.error('Please fill symbol, quantity, and purchase price');
      return;
    }

    const newHolding = {
      ...holdingForm,
      quantity: parseFloat(holdingForm.quantity),
      purchase_price: parseFloat(holdingForm.purchase_price),
      current_price: holdingForm.current_price ? parseFloat(holdingForm.current_price) : null,
      current_value: holdingForm.current_price ? 
        parseFloat(holdingForm.quantity) * parseFloat(holdingForm.current_price) :
        parseFloat(holdingForm.quantity) * parseFloat(holdingForm.purchase_price)
    };

    setHoldings([...holdings, newHolding]);
    
    // Reset form
    setHoldingForm({
      symbol: '',
      name: '',
      quantity: '',
      purchase_price: '',
      purchase_date: '',
      purchase_currency: portfolioData.purchase_currency,
      current_price: '',
      asset_type: portfolioData.provider_type === 'crypto_exchange' ? 'crypto' : 'stock'
    });

    toast.success('Holding added');
  };

  const removeHolding = (index) => {
    setHoldings(holdings.filter((_, i) => i !== index));
    toast.success('Holding removed');
  };

  const handleSave = () => {
    if (!portfolioData.name) {
      toast.error('Please enter portfolio name');
      return;
    }

    if (holdings.length === 0) {
      toast.error('Please add at least one holding');
      return;
    }

    const totalValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);

    onSave({
      ...portfolioData,
      type: 'portfolio',
      holdings: holdings,
      total_value: totalValue
    });

    // Reset
    setPortfolioData({
      name: '',
      provider_name: 'binance',
      provider_type: 'crypto_exchange',
      purchase_currency: 'USD'
    });
    setHoldings([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
        <DialogHeader>
          <DialogTitle style={{color: '#f8fafc'}}>Create Portfolio Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Portfolio Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{color: '#f8fafc'}}>Portfolio Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Portfolio Name *</Label>
                <Input
                  value={portfolioData.name}
                  onChange={(e) => setPortfolioData({...portfolioData, name: e.target.value})}
                  placeholder="My Binance Account"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Provider *</Label>
                <Select value={portfolioData.provider_name} onValueChange={handleProviderChange}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {PORTFOLIO_PROVIDERS.map(provider => (
                      <SelectItem key={provider.value} value={provider.value} className="text-white">
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Currency</Label>
                <Select 
                  value={portfolioData.purchase_currency} 
                  onValueChange={(value) => setPortfolioData({...portfolioData, purchase_currency: value})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CURRENCIES.map(curr => (
                      <SelectItem key={curr} value={curr} className="text-white">{curr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Add Holding Form */}
          <div className="p-4 rounded-lg" style={{background: '#16001e', borderColor: '#2d1f3d', border: '1px solid'}}>
            <h3 className="text-lg font-semibold mb-4" style={{color: '#f8fafc'}}>Add Holding</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div>
                <Label className="text-slate-300 text-xs">Symbol *</Label>
                <Input
                  value={holdingForm.symbol}
                  onChange={(e) => setHoldingForm({...holdingForm, symbol: e.target.value.toUpperCase()})}
                  placeholder="BTC, AAPL"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300 text-xs">Name</Label>
                <Input
                  value={holdingForm.name}
                  onChange={(e) => setHoldingForm({...holdingForm, name: e.target.value})}
                  placeholder="Bitcoin, Apple"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300 text-xs">Quantity *</Label>
                <Input
                  type="number"
                  step="any"
                  value={holdingForm.quantity}
                  onChange={(e) => setHoldingForm({...holdingForm, quantity: e.target.value})}
                  placeholder="0.5"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300 text-xs">Purchase Price *</Label>
                <Input
                  type="number"
                  step="any"
                  value={holdingForm.purchase_price}
                  onChange={(e) => setHoldingForm({...holdingForm, purchase_price: e.target.value})}
                  placeholder="40000"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <Label className="text-slate-300 text-xs">Purchase Date</Label>
                <Input
                  type="date"
                  value={holdingForm.purchase_date}
                  onChange={(e) => setHoldingForm({...holdingForm, purchase_date: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300 text-xs">Current Price</Label>
                <Input
                  type="number"
                  step="any"
                  value={holdingForm.current_price}
                  onChange={(e) => setHoldingForm({...holdingForm, current_price: e.target.value})}
                  placeholder="45000"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300 text-xs">Type</Label>
                <Select 
                  value={holdingForm.asset_type} 
                  onValueChange={(value) => setHoldingForm({...holdingForm, asset_type: value})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="crypto" className="text-white">Crypto</SelectItem>
                    <SelectItem value="stock" className="text-white">Stock</SelectItem>
                    <SelectItem value="bond" className="text-white">Bond</SelectItem>
                    <SelectItem value="etf" className="text-white">ETF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={addHolding}
              size="sm"
              className="text-white rounded-full"
              style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Holding
            </Button>
          </div>

          {/* Holdings List */}
          {holdings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{color: '#f8fafc'}}>
                Holdings ({holdings.length})
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{borderBottom: '2px solid #2d1f3d'}}>
                    <tr>
                      <th className="text-left p-2 text-sm" style={{color: '#94a3b8'}}>Symbol</th>
                      <th className="text-left p-2 text-sm" style={{color: '#94a3b8'}}>Name</th>
                      <th className="text-right p-2 text-sm" style={{color: '#94a3b8'}}>Qty</th>
                      <th className="text-right p-2 text-sm" style={{color: '#94a3b8'}}>Purchase</th>
                      <th className="text-right p-2 text-sm" style={{color: '#94a3b8'}}>Current</th>
                      <th className="text-right p-2 text-sm" style={{color: '#94a3b8'}}>Value</th>
                      <th className="text-center p-2 text-sm" style={{color: '#94a3b8'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding, index) => (
                      <tr key={index} style={{borderBottom: '1px solid #2d1f3d'}}>
                        <td className="p-2 font-semibold" style={{color: '#f8fafc'}}>{holding.symbol}</td>
                        <td className="p-2" style={{color: '#cbd5e1'}}>{holding.name || '-'}</td>
                        <td className="text-right p-2" style={{color: '#f8fafc'}}>{holding.quantity}</td>
                        <td className="text-right p-2" style={{color: '#cbd5e1'}}>
                          {holding.purchase_currency} {holding.purchase_price.toLocaleString()}
                        </td>
                        <td className="text-right p-2" style={{color: '#cbd5e1'}}>
                          {holding.current_price ? `${holding.purchase_currency} ${holding.current_price.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-right p-2 font-bold" style={{color: '#10b981'}}>
                          {holding.purchase_currency} {holding.current_value?.toLocaleString()}
                        </td>
                        <td className="text-center p-2">
                          <Button
                            onClick={() => removeHolding(index)}
                            size="sm"
                            variant="outline"
                            style={{borderColor: '#ef4444', color: '#ef4444'}}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{borderTop: '2px solid #2d1f3d'}}>
                      <td colSpan="5" className="p-2 text-right font-bold" style={{color: '#f8fafc'}}>
                        Total Portfolio Value
                      </td>
                      <td className="text-right p-2 text-lg font-bold" style={{color: '#ec4899'}}>
                        {portfolioData.purchase_currency} {holdings.reduce((sum, h) => sum + (h.current_value || 0), 0).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4" style={{borderTop: '1px solid #2d1f3d'}}>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="text-white rounded-full"
              style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Portfolio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
