"""API routes: portfolio."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from core.auth import require_auth
from core.config import db
from core.models import PortfolioAsset, PortfolioAssetCreate, PortfolioHolding, User
from services.portfolio import recalculate_portfolio_value

router = APIRouter()

# Portfolio Asset Routes
@router.get("/portfolio-assets")
async def get_portfolio_assets(user: User = Depends(require_auth)):
    """Get all portfolio assets for the user"""
    demo_prefix = f"demo_{user.id}_"
    if user.demo_mode:
        portfolios = await db.portfolio_assets.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }, {"_id": 0}).to_list(1000)
    else:
        portfolios = await db.portfolio_assets.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }, {"_id": 0}).to_list(1000)
    return portfolios

@router.post("/portfolio-assets")
async def create_portfolio_asset(portfolio_data: PortfolioAssetCreate, user: User = Depends(require_auth)):
    """Create a new portfolio asset"""
    portfolio = PortfolioAsset(user_id=user.id, **portfolio_data.model_dump())
    portfolio_dict = portfolio.model_dump()
    portfolio_dict['created_at'] = portfolio_dict['created_at'].isoformat()
    portfolio_dict['updated_at'] = portfolio_dict['updated_at'].isoformat()
    if portfolio_dict.get('last_synced'):
        portfolio_dict['last_synced'] = portfolio_dict['last_synced'].isoformat()
    
    await db.portfolio_assets.insert_one(portfolio_dict)
    return {"success": True, "id": portfolio.id}

@router.get("/portfolio-assets/{portfolio_id}")
async def get_portfolio_asset(portfolio_id: str, user: User = Depends(require_auth)):
    """Get a specific portfolio with all holdings"""
    portfolio = await db.portfolio_assets.find_one({"id": portfolio_id, "user_id": user.id}, {"_id": 0})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio

@router.post("/portfolio-assets/{portfolio_id}/holdings")
async def add_holding_to_portfolio(portfolio_id: str, holding: PortfolioHolding, user: User = Depends(require_auth)):
    """Add a holding to a portfolio"""
    portfolio = await db.portfolio_assets.find_one({"id": portfolio_id, "user_id": user.id})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    holding_dict = holding.model_dump()
    
    # Calculate current value if current_price is provided
    if holding.current_price:
        holding_dict['current_value'] = holding.quantity * holding.current_price
    
    await db.portfolio_assets.update_one(
        {"id": portfolio_id, "user_id": user.id},
        {
            "$push": {"holdings": holding_dict},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    # Recalculate total portfolio value
    await recalculate_portfolio_value(portfolio_id, user.id)
    
    return {"success": True}

@router.put("/portfolio-assets/{portfolio_id}/holdings/{symbol}")
async def update_holding(portfolio_id: str, symbol: str, holding: PortfolioHolding, user: User = Depends(require_auth)):
    """Update a specific holding in a portfolio"""
    holding_dict = holding.model_dump()
    
    if holding.current_price:
        holding_dict['current_value'] = holding.quantity * holding.current_price
    
    await db.portfolio_assets.update_one(
        {"id": portfolio_id, "user_id": user.id, "holdings.symbol": symbol},
        {
            "$set": {
                "holdings.$": holding_dict,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    await recalculate_portfolio_value(portfolio_id, user.id)
    
    return {"success": True}

@router.delete("/portfolio-assets/{portfolio_id}/holdings/{symbol}")
async def delete_holding(portfolio_id: str, symbol: str, user: User = Depends(require_auth)):
    """Delete a holding from a portfolio"""
    await db.portfolio_assets.update_one(
        {"id": portfolio_id, "user_id": user.id},
        {
            "$pull": {"holdings": {"symbol": symbol}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    await recalculate_portfolio_value(portfolio_id, user.id)
    
    return {"success": True}

@router.delete("/portfolio-assets/{portfolio_id}")
async def delete_portfolio_asset(portfolio_id: str, user: User = Depends(require_auth)):
    """Delete an entire portfolio"""
    result = await db.portfolio_assets.delete_one({"id": portfolio_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return {"success": True}
