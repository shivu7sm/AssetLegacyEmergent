import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];
const AREA_UNITS = ['sqft', 'sqmt', 'yard', 'acre'];
const WEIGHT_UNITS = ['gram', 'kilogram', 'ounce', 'pound'];

export default function AddAssetForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'bank',
    name: '',
    quantity: '',
    unit_price: '',
    total_value: '',
    current_unit_price: '',
    weight: '',
    weight_unit: 'gram',
    area: '',
    area_unit: 'sqft',
    price_per_area: '',
    current_price_per_area: '',
    principal_amount: '',
    interest_rate: '',
    tenure_months: '',
    purchase_currency: 'USD',
    purchase_date: '',
    symbol: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        type: formData.type,
        name: formData.name,
        purchase_currency: formData.purchase_currency,
        purchase_date: formData.purchase_date || null
      };

      // Add type-specific fields
      if (formData.type === 'crypto' || formData.type === 'stock') {
        payload.quantity = parseFloat(formData.quantity);
        payload.unit_price = parseFloat(formData.unit_price);
        payload.total_value = payload.quantity * payload.unit_price;
        if (formData.current_unit_price) payload.current_unit_price = parseFloat(formData.current_unit_price);
        if (formData.symbol) payload.symbol = formData.symbol;
      } else if (formData.type === 'precious_metals') {
        payload.weight = parseFloat(formData.weight);
        payload.weight_unit = formData.weight_unit;
        payload.unit_price = parseFloat(formData.unit_price);
        payload.total_value = payload.weight * payload.unit_price;
      } else if (formData.type === 'property') {
        payload.area = parseFloat(formData.area);
        payload.area_unit = formData.area_unit;
        payload.price_per_area = parseFloat(formData.price_per_area);
        payload.total_value = payload.area * payload.price_per_area;
        if (formData.current_price_per_area) {
          payload.current_price_per_area = parseFloat(formData.current_price_per_area);
        }
      } else if (formData.type === 'loan' || formData.type === 'credit_card') {
        payload.principal_amount = parseFloat(formData.principal_amount);
        payload.total_value = payload.principal_amount;
        payload.current_value = payload.principal_amount;
        if (formData.interest_rate) payload.interest_rate = parseFloat(formData.interest_rate);
        if (formData.tenure_months) payload.tenure_months = parseInt(formData.tenure_months);
      } else {
        payload.total_value = parseFloat(formData.total_value);
      }

      await axios.post(`${API}/assets`, payload, { withCredentials: true });
      toast.success('Asset added successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to add asset:', error);
      toast.error('Failed to add asset');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4 p-4 rounded-lg" style={{background: 'rgba(232, 194, 124, 0.05)', border: '1px solid rgba(232, 194, 124, 0.2)'}}>
        <h3 className="text-sm font-bold" style={{color: '#E8C27C'}}>BASIC INFORMATION</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Asset Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="bank" className="text-white">🏦 Bank Account</SelectItem>
                <SelectItem value="crypto" className="text-white">₿ Cryptocurrency</SelectItem>
                <SelectItem value="stock" className="text-white">📈 Stocks</SelectItem>
                <SelectItem value="mutual_fund" className="text-white">📊 Mutual Fund</SelectItem>
                <SelectItem value="property" className="text-white">🏠 Real Estate</SelectItem>
                <SelectItem value="precious_metals" className="text-white">🥇 Precious Metals</SelectItem>
                <SelectItem value="investment" className="text-white">💰 Investment/FD</SelectItem>
                <SelectItem value="insurance" className="text-white">🛡️ Insurance</SelectItem>
                <SelectItem value="vehicle" className="text-white">🚗 Vehicle</SelectItem>
                <SelectItem value="art" className="text-white">🎨 Art/Collectibles</SelectItem>
                <SelectItem value="nft" className="text-white">🖼️ NFT</SelectItem>
                <SelectItem value="diamond" className="text-white">💎 Diamond/Jewelry</SelectItem>
                <SelectItem value="locker" className="text-white">🔐 Safe/Locker</SelectItem>
                <SelectItem value="loan" className="text-white">💸 Loan</SelectItem>
                <SelectItem value="credit_card" className="text-white">💳 Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-slate-300">Asset Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Chase Savings, Bitcoin"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Currency</Label>
            <Select value={formData.purchase_currency} onValueChange={(value) => setFormData({ ...formData, purchase_currency: value })}>
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
          <div>
            <Label className="text-slate-300">Purchase Date</Label>
            <Input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* Asset-Specific Fields */}
      <div className="space-y-4 p-4 rounded-lg" style={{background: 'rgba(92, 227, 215, 0.05)', border: '1px solid rgba(92, 227, 215, 0.2)'}}>
        <h3 className="text-sm font-bold" style={{color: '#5CE3D7'}}>ASSET DETAILS</h3>
        
        {/* Crypto/Stock */}
        {(formData.type === 'crypto' || formData.type === 'stock') && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300">Quantity *</Label>
              <Input
                type="number"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="10"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Unit Price *</Label>
              <Input
                type="number"
                step="any"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="50000"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Symbol</Label>
              <Input
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                placeholder="BTC, AAPL"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        )}

        {/* Precious Metals */}
        {formData.type === 'precious_metals' && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300">Weight *</Label>
              <Input
                type="number"
                step="any"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="100"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Unit</Label>
              <Select value={formData.weight_unit} onValueChange={(value) => setFormData({ ...formData, weight_unit: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {WEIGHT_UNITS.map(unit => (
                    <SelectItem key={unit} value={unit} className="text-white">{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Price Per Unit *</Label>
              <Input
                type="number"
                step="any"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="60"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        )}

        {/* Real Estate */}
        {formData.type === 'property' && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300">Area *</Label>
              <Input
                type="number"
                step="any"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="2500"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Unit</Label>
              <Select value={formData.area_unit} onValueChange={(value) => setFormData({ ...formData, area_unit: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {AREA_UNITS.map(unit => (
                    <SelectItem key={unit} value={unit} className="text-white">{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Price Per {formData.area_unit} *</Label>
              <Input
                type="number"
                step="any"
                value={formData.price_per_area}
                onChange={(e) => setFormData({ ...formData, price_per_area: e.target.value })}
                placeholder="250"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        )}

        {/* Loan/Credit Card */}
        {(formData.type === 'loan' || formData.type === 'credit_card') && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300">Principal Amount *</Label>
              <Input
                type="number"
                step="any"
                value={formData.principal_amount}
                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                placeholder="50000"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Interest Rate (%)</Label>
              <Input
                type="number"
                step="any"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                placeholder="8.5"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Tenure (months)</Label>
              <Input
                type="number"
                value={formData.tenure_months}
                onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })}
                placeholder="60"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        )}

        {/* Vehicle */}
        {formData.type === 'vehicle' && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300">Make</Label>
                <Input
                  value={formData.make || ''}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="Tesla"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Model</Label>
                <Input
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Model Y"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Year</Label>
                <Input
                  type="number"
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2023"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Purchase Value *</Label>
              <Input
                type="number"
                step="any"
                value={formData.total_value}
                onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                placeholder="65000"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </>
        )}

        {/* NFT */}
        {formData.type === 'nft' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Collection Name</Label>
                <Input
                  value={formData.collection || ''}
                  onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                  placeholder="Bored Ape Yacht Club"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Token ID</Label>
                <Input
                  value={formData.token_id || ''}
                  onChange={(e) => setFormData({ ...formData, token_id: e.target.value })}
                  placeholder="4521"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Purchase Price (ETH) *</Label>
              <Input
                type="number"
                step="any"
                value={formData.total_value}
                onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                placeholder="45"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </>
        )}

        {/* Mutual Fund */}
        {formData.type === 'mutual_fund' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Fund Name</Label>
              <Input
                value={formData.fund_name || ''}
                onChange={(e) => setFormData({ ...formData, fund_name: e.target.value })}
                placeholder="Vanguard S&P 500"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Total Investment *</Label>
              <Input
                type="number"
                step="any"
                value={formData.total_value}
                onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                placeholder="25000"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        )}

        {/* Other assets - simple total value */}
        {!['crypto', 'stock', 'precious_metals', 'property', 'loan', 'credit_card'].includes(formData.type) && (
          <div>
            <Label className="text-slate-300">Total Value *</Label>
            <Input
              type="number"
              step="any"
              value={formData.total_value}
              onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
              placeholder="10000"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        )}
      </div>

      {/* Manual Current Value Override - For ALL Asset Types */}
      <div className="space-y-4 p-4 rounded-lg" style={{background: 'rgba(207, 143, 134, 0.05)', border: '1px solid rgba(207, 143, 134, 0.2)'}}>
        <h3 className="text-sm font-bold" style={{color: '#CF8F86'}}>CURRENT VALUE (OPTIONAL)</h3>
        <p className="text-xs" style={{color: '#94a3b8'}}>
          Leave blank to use calculated value. For crypto/stocks, we'll fetch real-time prices automatically.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {(formData.type === 'crypto' || formData.type === 'stock' || formData.type === 'precious_metals') && (
            <div>
              <Label className="text-slate-300">Current Price Per Unit</Label>
              <Input
                type="number"
                step="any"
                value={formData.current_unit_price}
                onChange={(e) => setFormData({ ...formData, current_unit_price: e.target.value })}
                placeholder="Auto-fetched if available"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          )}
          
          {formData.type === 'property' && (
            <div>
              <Label className="text-slate-300">Current Price Per {formData.area_unit}</Label>
              <Input
                type="number"
                step="any"
                value={formData.current_price_per_area}
                onChange={(e) => setFormData({ ...formData, current_price_per_area: e.target.value })}
                placeholder="Current market rate"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          )}
          
          <div>
            <Label className="text-slate-300">Manual Current Total Value</Label>
            <Input
              type="number"
              step="any"
              value={formData.current_total_value || ''}
              onChange={(e) => setFormData({ ...formData, current_total_value: e.target.value })}
              placeholder="Override calculated value"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          type="submit"
          className="flex-1"
          style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: '#fff'}}
        >
          Add Asset
        </Button>
        <Button 
          type="button"
          onClick={onCancel}
          variant="outline"
          style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
