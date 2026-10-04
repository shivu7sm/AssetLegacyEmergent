"""Portfolio asset aggregation."""

from core.config import db

async def recalculate_portfolio_value(portfolio_id: str, user_id: str):
    """Recalculate the total value of a portfolio based on holdings"""
    portfolio = await db.portfolio_assets.find_one({"id": portfolio_id, "user_id": user_id})
    if not portfolio:
        return
    
    total_value = 0.0
    for holding in portfolio.get("holdings", []):
        if holding.get("current_value"):
            total_value += holding["current_value"]
        elif holding.get("current_price"):
            total_value += holding["quantity"] * holding["current_price"]
        else:
            total_value += holding["quantity"] * holding["purchase_price"]
    
    await db.portfolio_assets.update_one(
        {"id": portfolio_id, "user_id": user_id},
        {"$set": {"total_value": total_value}}
    )
