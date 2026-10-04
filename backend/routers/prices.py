"""API routes: prices."""
from fastapi import APIRouter, HTTPException
import requests

from core.config import cg

router = APIRouter()

# Price API Routes
@router.get("/prices/crypto/{symbol}")
async def get_crypto_price(symbol: str, currency: str = "usd"):
    try:
        price_data = cg.get_price(ids=symbol.lower(), vs_currencies=currency)
        return {"symbol": symbol, "price": price_data[symbol.lower()][currency], "currency": currency}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch price: {str(e)}")

@router.get("/prices/gold")
async def get_gold_price(currency: str = "USD", unit: str = "gram"):
    try:
        base_prices = {
            "USD": {"gram": 65.0, "ounce": 2020.0},
            "INR": {"gram": 5400.0, "ounce": 167600.0},
            "EUR": {"gram": 60.0, "ounce": 1864.0},
            "GBP": {"gram": 52.0, "ounce": 1616.0}
        }
        price = base_prices.get(currency.upper(), base_prices["USD"])[unit]
        return {"metal": "gold", "price": price, "currency": currency, "unit": unit}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch gold price: {str(e)}")

@router.get("/prices/currency/{from_currency}/{to_currency}")
async def get_currency_conversion(from_currency: str, to_currency: str):
    try:
        response = requests.get(
            f"https://api.exchangerate-api.com/v4/latest/{from_currency.upper()}",
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        rate = data["rates"].get(to_currency.upper())
        if not rate:
            raise HTTPException(status_code=400, detail="Currency not found")
        return {"from": from_currency.upper(), "to": to_currency.upper(), "rate": rate}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch conversion rate: {str(e)}")
