"""Subscription plans, limits and Stripe price lookup."""
from fastapi import HTTPException
import os
import stripe

from core.config import db, logger
from core.models import User

async def get_stripe_price_for_plan(plan: str):
    """Fetch the price ID for a given plan from Stripe product."""
    try:
        product_id = os.environ.get('STRIPE_PRODUCT_ID')
        if not product_id:
            # Fallback to old method with direct price IDs
            if plan == 'Pro':
                return os.environ.get('STRIPE_PRICE_PRO')
            elif plan == 'Family':
                return os.environ.get('STRIPE_PRICE_FAMILY')
            else:
                raise HTTPException(status_code=400, detail="Invalid plan")
        
        # Fetch all prices for the product
        prices = stripe.Price.list(product=product_id, active=True, limit=10)
        
        # Map plan names to price amounts (in cents)
        plan_amounts = {
            'Pro': 999,      # $9.99
            'Family': 2499   # $24.99
        }
        
        target_amount = plan_amounts.get(plan)
        if not target_amount:
            raise HTTPException(status_code=400, detail="Invalid plan")
        
        # Find matching price
        for price in prices.data:
            if price.unit_amount == target_amount and price.currency == 'usd':
                return price.id
        
        # If no match found, provide detailed error
        available_prices = [f"${p.unit_amount/100:.2f}" for p in prices.data]
        raise HTTPException(
            status_code=400, 
            detail=f"No price found for {plan} plan (${target_amount/100:.2f}). Available prices in Stripe product {product_id}: {', '.join(available_prices)}. Please add the {plan} plan price in Stripe Dashboard."
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error fetching prices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscription prices")

# Subscription Plan Features
SUBSCRIPTION_FEATURES = {
    "Free": {
        "max_assets": 10,
        "max_documents": 5,
        "storage_mb": 50,  # 50 MB
        "ai_insights": False,
        "scheduled_messages": False,
        "dms": False,
        "portfolio_tracking": False
    },
    "Pro": {
        "max_assets": 100,
        "max_documents": 50,
        "storage_mb": 5120,  # 5 GB
        "ai_insights": True,
        "scheduled_messages": True,
        "dms": True,
        "portfolio_tracking": True
    },
    "Family": {
        "max_assets": -1,  # Unlimited
        "max_documents": -1,  # Unlimited
        "storage_mb": 51200,  # 50 GB
        "ai_insights": True,
        "scheduled_messages": True,
        "dms": True,
        "portfolio_tracking": True
    }
}

def check_subscription_limit(user: User, feature: str) -> bool:
    """Check if user's subscription allows a feature."""
    plan = getattr(user, 'subscription_plan', 'Free')
    features = SUBSCRIPTION_FEATURES.get(plan, SUBSCRIPTION_FEATURES["Free"])
    return features.get(feature, False)

async def get_user_storage_usage(user_id: str) -> int:
    """Calculate total storage used by user in bytes."""
    documents = await db.documents.find({"user_id": user_id}).to_list(1000)
    total_bytes = sum(doc.get("file_size", 0) for doc in documents)
    return total_bytes
