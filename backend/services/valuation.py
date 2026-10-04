"""Asset valuation and currency conversion helpers."""
from typing import Dict, Any
import requests

from core.config import logger

# Dashboard Routes
# Helper function to calculate current asset value in its original currency
def calculate_asset_current_value(asset: Dict[str, Any]) -> float:
    """
    Calculate the CURRENT value of an asset in its original currency.
    Prioritizes current values over purchase values.
    """
    value = 0.0
    
    # Priority 1: Explicit current values
    if asset.get('current_total_value'):
        value = float(asset['current_total_value'])
    elif asset.get('current_price'):
        value = float(asset['current_price'])
    # Priority 2: Calculated current values (quantity/weight/area * current_unit_price)
    elif asset.get('quantity') and asset.get('current_unit_price'):
        value = float(asset['quantity']) * float(asset['current_unit_price'])
    elif asset.get('area') and asset.get('current_price_per_area'):
        value = float(asset['area']) * float(asset['current_price_per_area'])
    elif asset.get('weight') and asset.get('current_unit_price'):
        value = float(asset['weight']) * float(asset['current_unit_price'])
    # Priority 3: Fall back to purchase values if no current value
    elif asset.get('total_value'):
        value = float(asset['total_value'])
    elif asset.get('quantity') and asset.get('unit_price'):
        value = float(asset['quantity']) * float(asset['unit_price'])
    elif asset.get('area') and asset.get('price_per_area'):
        value = float(asset['area']) * float(asset['price_per_area'])
    elif asset.get('weight') and asset.get('unit_price'):
        value = float(asset['weight']) * float(asset['unit_price'])
    # Priority 4: Loans/debts
    elif asset.get('outstanding_balance'):
        value = float(asset['outstanding_balance'])
    elif asset.get('principal_amount'):
        value = float(asset['principal_amount'])
    
    return value

# Helper function to convert currency
def convert_currency(amount: float, from_currency: str, to_currency: str) -> float:
    """Convert amount from one currency to another using live exchange rates."""
    if from_currency.upper() == to_currency.upper():
        return amount
    
    if amount == 0:
        return 0.0
    
    try:
        response = requests.get(
            f"https://api.exchangerate-api.com/v4/latest/{from_currency.upper()}",
            timeout=5
        )
        if response.status_code == 200:
            rate = response.json()["rates"].get(to_currency.upper(), 1.0)
            return amount * rate
    except:
        logger.warning(f"Currency conversion failed: {from_currency} to {to_currency}")
    
    return amount  # Return original if conversion fails
