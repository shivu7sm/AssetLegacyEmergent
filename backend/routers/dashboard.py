"""API routes: dashboard."""
from fastapi import APIRouter, Depends

from core.auth import require_auth
from core.config import db, logger
from core.models import User
from services.valuation import calculate_asset_current_value, convert_currency

router = APIRouter()

@router.get("/dashboard/summary")
async def get_dashboard_summary(user: User = Depends(require_auth), target_currency: str = "USD"):
    """
    Get dashboard summary with all values converted to target currency.
    This ensures consistent calculation across the app.
    Includes both individual assets and portfolio holdings.
    FILTERS BY DEMO MODE.
    """
    # Filter based on demo mode
    demo_prefix = f"demo_{user.id}_"
    if user.demo_mode:
        # Show only demo data
        assets = await db.assets.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }).to_list(1000)
        portfolios = await db.portfolio_assets.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }).to_list(1000)
    else:
        # Show only live data (exclude demo data)
        assets = await db.assets.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }).to_list(1000)
        portfolios = await db.portfolio_assets.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }).to_list(1000)
    
    # Define liability types
    liability_types = {'loan', 'credit_card'}
    
    # Define liquid asset types (portfolios are also liquid since they contain stocks/crypto)
    liquid_asset_types = {'bank', 'crypto', 'stock', 'portfolio'}
    
    total_assets_count = len(assets)
    total_portfolios_count = len(portfolios)
    asset_types = {}
    asset_values = {}
    total_assets_value = 0.0
    total_liabilities_value = 0.0
    asset_values_separate = {}
    liability_values_separate = {}
    liquid_assets_value = 0.0
    diversification_count = 0
    
    # Validation tracking
    individual_values = []
    
    # Process individual assets
    for asset in assets:
        asset_type = asset["type"]
        asset_types[asset_type] = asset_types.get(asset_type, 0) + 1
        is_liability = asset_type in liability_types
        
        # Calculate current value in original currency
        value_in_original_currency = calculate_asset_current_value(asset)
        original_currency = asset.get("purchase_currency", "USD")
        
        # Convert to target currency
        value_in_target_currency = convert_currency(
            value_in_original_currency, 
            original_currency, 
            target_currency
        )
        
        # Track for validation
        individual_values.append({
            "name": asset.get("name", "Unknown"),
            "type": asset_type,
            "original_value": value_in_original_currency,
            "original_currency": original_currency,
            "converted_value": value_in_target_currency,
            "target_currency": target_currency,
            "is_liability": is_liability
        })
        
        # Separate assets and liabilities
        if is_liability:
            total_liabilities_value += value_in_target_currency
            liability_values_separate[asset_type] = liability_values_separate.get(asset_type, 0) + value_in_target_currency
            asset_values[asset_type] = asset_values.get(asset_type, 0) - value_in_target_currency
        else:
            total_assets_value += value_in_target_currency
            asset_values_separate[asset_type] = asset_values_separate.get(asset_type, 0) + value_in_target_currency
            asset_values[asset_type] = asset_values.get(asset_type, 0) + value_in_target_currency
            
            # Track liquid assets
            if asset_type in liquid_asset_types:
                liquid_assets_value += value_in_target_currency
    
    # Process portfolio assets
    for portfolio in portfolios:
        portfolio_type = "portfolio"
        portfolio_currency = portfolio.get("purchase_currency", "USD")
        portfolio_value_original = portfolio.get("total_value", 0.0)
        
        # Convert portfolio value to target currency
        portfolio_value_converted = convert_currency(
            portfolio_value_original,
            portfolio_currency,
            target_currency
        )
        
        # Track portfolio in asset types and values
        asset_types[portfolio_type] = asset_types.get(portfolio_type, 0) + 1
        total_assets_value += portfolio_value_converted
        asset_values_separate[portfolio_type] = asset_values_separate.get(portfolio_type, 0) + portfolio_value_converted
        asset_values[portfolio_type] = asset_values.get(portfolio_type, 0) + portfolio_value_converted
        
        # Portfolios are liquid assets
        liquid_assets_value += portfolio_value_converted
        
        # Track for validation
        individual_values.append({
            "name": portfolio.get("name", "Unknown Portfolio"),
            "type": portfolio_type,
            "original_value": portfolio_value_original,
            "original_currency": portfolio_currency,
            "converted_value": portfolio_value_converted,
            "target_currency": target_currency,
            "is_liability": False
        })
    
    net_worth = total_assets_value - total_liabilities_value
    
    # Count unique asset types for diversification
    diversification_count = len([at for at in asset_types.keys() if at not in liability_types])
    
    # Calculate Financial Ratios
    financial_ratios = {}
    
    # 1. Debt-to-Asset Ratio (lower is better, <0.3 is good)
    if total_assets_value > 0:
        debt_to_asset = total_liabilities_value / total_assets_value
        financial_ratios["debt_to_asset_ratio"] = {
            "value": round(debt_to_asset * 100, 1),
            "display": f"{round(debt_to_asset * 100, 1)}%",
            "status": "good" if debt_to_asset < 0.3 else ("warning" if debt_to_asset < 0.5 else "bad"),
            "description": "Debt as % of total assets"
        }
    else:
        financial_ratios["debt_to_asset_ratio"] = {
            "value": 0,
            "display": "0%",
            "status": "good",
            "description": "Debt as % of total assets"
        }
    
    # 2. Liquidity Ratio (higher is better, >1.5 is good)
    if total_liabilities_value > 0:
        liquidity_ratio = liquid_assets_value / total_liabilities_value
        financial_ratios["liquidity_ratio"] = {
            "value": round(liquidity_ratio, 2),
            "display": f"{round(liquidity_ratio, 2)}x",
            "status": "good" if liquidity_ratio >= 1.5 else ("warning" if liquidity_ratio >= 1.0 else "bad"),
            "description": "Liquid assets to cover debts"
        }
    else:
        financial_ratios["liquidity_ratio"] = {
            "value": 999,
            "display": "∞",
            "status": "good",
            "description": "Liquid assets to cover debts"
        }
    
    # 3. Net Worth Growth Rate (compare current net worth with last snapshot)
    snapshots = await db.networth_snapshots.find(
        {"user_id": user.id}
    ).sort("snapshot_date", -1).limit(1).to_list(1)
    
    if len(snapshots) >= 1:
        previous_snapshot_nw = snapshots[0]["net_worth"]
        current_nw = net_worth
        
        if abs(previous_snapshot_nw) > 0:
            growth_rate = ((current_nw - previous_snapshot_nw) / abs(previous_snapshot_nw)) * 100
            financial_ratios["net_worth_growth"] = {
                "value": round(growth_rate, 1),
                "display": f"{'+' if growth_rate >= 0 else ''}{round(growth_rate, 1)}%",
                "status": "good" if growth_rate > 0 else ("warning" if growth_rate >= -5 else "bad"),
                "description": "Net worth change since last snapshot"
            }
        else:
            financial_ratios["net_worth_growth"] = {
                "value": 0,
                "display": "N/A",
                "status": "neutral",
                "description": "Net worth change since last snapshot"
            }
    else:
        financial_ratios["net_worth_growth"] = {
            "value": 0,
            "display": "N/A",
            "status": "neutral",
            "description": "Net worth change since last snapshot"
        }
    
    # 4. Diversification Score (0-100, higher is better)
    max_diversification = 8  # Ideal number of asset types
    diversification_score = min(100, (diversification_count / max_diversification) * 100)
    financial_ratios["diversification_score"] = {
        "value": round(diversification_score, 0),
        "display": f"{round(diversification_score, 0)}/100",
        "status": "good" if diversification_score >= 60 else ("warning" if diversification_score >= 30 else "bad"),
        "description": f"Portfolio spread across {diversification_count} asset types"
    }
    
    # 5. Emergency Fund Ratio (3-6 months expenses is ideal)
    # Assume monthly expenses = 30% of net worth or 10% of liquid assets as proxy
    estimated_monthly_expenses = liquid_assets_value * 0.1 if liquid_assets_value > 0 else 1000
    emergency_fund_months = liquid_assets_value / estimated_monthly_expenses if estimated_monthly_expenses > 0 else 0
    financial_ratios["emergency_fund_ratio"] = {
        "value": round(emergency_fund_months, 1),
        "display": f"{round(emergency_fund_months, 1)} months",
        "status": "good" if emergency_fund_months >= 3 else ("warning" if emergency_fund_months >= 1 else "bad"),
        "description": "Liquid assets coverage"
    }
    
    # 6. Debt Service Coverage (higher is better, >1.5 is good)
    # Calculate based on liquid assets vs total liabilities
    if total_liabilities_value > 0:
        dscr = (liquid_assets_value * 0.15) / (total_liabilities_value * 0.05)  # Assume 15% liquid income, 5% debt payment
        financial_ratios["debt_service_coverage"] = {
            "value": round(dscr, 2),
            "display": f"{round(dscr, 2)}x",
            "status": "good" if dscr >= 1.5 else ("warning" if dscr >= 1.0 else "bad"),
            "description": "Ability to service debt obligations"
        }
    else:
        financial_ratios["debt_service_coverage"] = {
            "value": 999,
            "display": "N/A",
            "status": "good",
            "description": "Ability to service debt obligations"
        }
    
    # Validation checks
    calculated_sum = sum([v["converted_value"] * (1 if not v["is_liability"] else -1) for v in individual_values])
    if abs(calculated_sum - net_worth) > 0.01:
        logger.error(f"Net worth calculation mismatch! Calculated: {calculated_sum}, Reported: {net_worth}")
    
    # Check for unrealistic values
    if net_worth > 100000000:  # $100M threshold
        logger.warning(f"Unusually high net worth detected: {net_worth} {target_currency} for user {user.id}")
    
    return {
        "total_assets": total_assets_count,
        "total_portfolios": total_portfolios_count,
        "asset_types": asset_types,
        "asset_values": asset_values,
        "asset_values_separate": asset_values_separate,
        "liability_values_separate": liability_values_separate,
        "total_assets_value": round(total_assets_value, 2),
        "total_liabilities_value": round(total_liabilities_value, 2),
        "net_worth": round(net_worth, 2),
        "currency": target_currency,
        "total_value_usd": round(net_worth, 2) if target_currency == "USD" else round(convert_currency(net_worth, target_currency, "USD"), 2),
        "has_nominee": await db.nominees.count_documents({"user_id": user.id}) > 0,
        "has_dms": await db.dead_man_switches.count_documents({"user_id": user.id}) > 0,
        "has_will": await db.digital_wills.count_documents({"user_id": user.id}) > 0,
        "financial_ratios": financial_ratios,
        # Debug info (remove in production)
        "validation": {
            "individual_count": len(individual_values),
            "calculated_sum": round(calculated_sum, 2),
            "includes_portfolios": total_portfolios_count > 0
        }
    }
