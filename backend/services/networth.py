"""Net-worth snapshot generation."""

from core.config import db
from core.models import NetWorthSnapshot
from services.valuation import calculate_asset_current_value, convert_currency

# Helper function to create snapshot for a specific date
async def create_snapshot_for_date(user_id: str, snapshot_date: str, currency: str = "USD"):
    """
    Helper function to create a net worth snapshot for a specific date.
    IMPORTANT: Only includes assets AND portfolios created ON or BEFORE the snapshot date for accurate historical tracking.
    """
    # Get all assets for this user
    all_assets = await db.assets.find({"user_id": user_id}).to_list(1000)
    
    # Filter assets: only include those purchased on or before the snapshot date
    assets = []
    for asset in all_assets:
        purchase_date = asset.get("purchase_date")
        if purchase_date:
            # Only include if purchase_date <= snapshot_date
            if purchase_date <= snapshot_date:
                assets.append(asset)
        else:
            # Include assets without purchase date (assume they existed)
            assets.append(asset)
    
    # Get all portfolios for this user
    all_portfolios = await db.portfolio_assets.find({"user_id": user_id}).to_list(1000)
    
    # Filter portfolios: only include those created on or before snapshot date
    portfolios = []
    for portfolio in all_portfolios:
        created_at = portfolio.get("created_at")
        if created_at:
            # Parse created_at and compare
            if isinstance(created_at, str):
                created_date = created_at.split('T')[0]  # Get date part
            else:
                created_date = created_at.date().isoformat()
            
            if created_date <= snapshot_date:
                portfolios.append(portfolio)
        else:
            # Include portfolios without created_at (assume they existed)
            portfolios.append(portfolio)
    
    # Define liability types
    liability_types = {'loan', 'credit_card'}
    
    total_assets_value = 0.0
    total_liabilities_value = 0.0
    asset_breakdown = {}
    liability_breakdown = {}
    
    # Process individual assets
    for asset in assets:
        asset_type = asset["type"]
        is_liability = asset_type in liability_types
        
        # Calculate value in original currency
        value_in_original_currency = calculate_asset_current_value(asset)
        original_currency = asset.get("purchase_currency", "USD")
        
        # Convert to target currency
        value_in_target_currency = convert_currency(
            value_in_original_currency, 
            original_currency, 
            currency
        )
        
        # Separate assets and liabilities
        if is_liability:
            total_liabilities_value += value_in_target_currency
            liability_breakdown[asset_type] = liability_breakdown.get(asset_type, 0) + value_in_target_currency
        else:
            total_assets_value += value_in_target_currency
            asset_breakdown[asset_type] = asset_breakdown.get(asset_type, 0) + value_in_target_currency
    
    # Process portfolios
    for portfolio in portfolios:
        portfolio_type = "portfolio"
        portfolio_currency = portfolio.get("purchase_currency", "USD")
        portfolio_value_original = portfolio.get("total_value", 0.0)
        
        # Convert portfolio value to target currency
        portfolio_value_converted = convert_currency(
            portfolio_value_original,
            portfolio_currency,
            currency
        )
        
        total_assets_value += portfolio_value_converted
        asset_breakdown[portfolio_type] = asset_breakdown.get(portfolio_type, 0) + portfolio_value_converted
    
    net_worth = total_assets_value - total_liabilities_value
    
    snapshot = NetWorthSnapshot(
        user_id=user_id,
        snapshot_date=snapshot_date,
        total_assets=total_assets_value,
        total_liabilities=total_liabilities_value,
        net_worth=net_worth,
        currency=currency,
        asset_breakdown=asset_breakdown,
        liability_breakdown=liability_breakdown
    )
    
    snap_dict = snapshot.model_dump()
    snap_dict['created_at'] = snap_dict['created_at'].isoformat()
    
    # Upsert - update if snapshot for this date exists, create if not
    await db.networth_snapshots.update_one(
        {"user_id": user_id, "snapshot_date": snapshot_date},
        {"$set": snap_dict},
        upsert=True
    )
    
    return snapshot
