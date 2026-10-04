"""API routes: assets."""
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List
from datetime import datetime, timezone

from core.auth import require_auth
from core.config import db, logger
from core.models import Asset, AssetCreate, User
from services.audit import log_audit
from services.networth import create_snapshot_for_date
from services.subscriptions import SUBSCRIPTION_FEATURES

router = APIRouter()

# Asset Routes
@router.get("/assets", response_model=List[Asset])
async def get_assets(user: User = Depends(require_auth)):
    # Filter based on demo mode
    demo_prefix = f"demo_{user.id}_"
    if user.demo_mode:
        # Show only demo data
        assets = await db.assets.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }, {"_id": 0}).to_list(1000)
    else:
        # Show only live data (exclude demo data)
        assets = await db.assets.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }, {"_id": 0}).to_list(1000)
    
    for asset in assets:
        if isinstance(asset.get('created_at'), str):
            asset['created_at'] = datetime.fromisoformat(asset['created_at'])
        if isinstance(asset.get('updated_at'), str):
            asset['updated_at'] = datetime.fromisoformat(asset['updated_at'])
    return assets

@router.post("/assets", response_model=Asset)
async def create_asset(asset_data: AssetCreate, user: User = Depends(require_auth), request: Request = None):
    # Check subscription limits - exclude demo assets from count
    plan = getattr(user, 'subscription_plan', 'Free')
    features = SUBSCRIPTION_FEATURES.get(plan, SUBSCRIPTION_FEATURES["Free"])
    
    if features["max_assets"] > 0:
        # Only count LIVE assets (non-demo) for limit
        demo_prefix = f"demo_{user.id}_"
        current_count = await db.assets.count_documents({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        })
        if current_count >= features["max_assets"]:
            raise HTTPException(
                status_code=403,
                detail=f"Asset limit reached. Your {plan} plan allows {features['max_assets']} live assets. Upgrade to add more or delete some assets."
            )
    
    asset = Asset(user_id=user.id, **asset_data.model_dump())
    asset_dict = asset.model_dump()
    asset_dict['created_at'] = asset_dict['created_at'].isoformat()
    asset_dict['updated_at'] = asset_dict['updated_at'].isoformat()
    await db.assets.insert_one(asset_dict)
    
    # Log audit event
    await log_audit(user, "CREATE", "asset", asset.id, {"name": asset.name, "type": asset.type}, request)
    
    # Auto-create snapshot for purchase date if provided
    if asset.purchase_date:
        try:
            await create_snapshot_for_date(user.id, asset.purchase_date, asset.purchase_currency)
        except Exception as e:
            logger.warning(f"Failed to auto-create snapshot for asset purchase: {str(e)}")
    
    return asset

@router.put("/assets/{asset_id}", response_model=Asset)
async def update_asset(asset_id: str, asset_data: AssetCreate, user: User = Depends(require_auth)):
    existing = await db.assets.find_one({"id": asset_id, "user_id": user.id})
    if not existing:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_data = asset_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.assets.update_one(
        {"id": asset_id},
        {"$set": update_data}
    )
    
    # Auto-create snapshot for purchase date if it changed
    old_purchase_date = existing.get('purchase_date')
    new_purchase_date = asset_data.purchase_date
    if new_purchase_date and new_purchase_date != old_purchase_date:
        try:
            await create_snapshot_for_date(user.id, new_purchase_date, asset_data.purchase_currency)
        except Exception as e:
            logger.warning(f"Failed to auto-create snapshot for asset update: {str(e)}")
    
    updated = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Asset(**updated)

@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, user: User = Depends(require_auth), request: Request = None):
    # Get asset name before deletion for logging
    asset = await db.assets.find_one({"id": asset_id, "user_id": user.id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    result = await db.assets.delete_one({"id": asset_id, "user_id": user.id})
    
    # Log audit event
    await log_audit(user, "DELETE", "asset", asset_id, {"name": asset.get("name"), "type": asset.get("type")}, request)
    
    return {"success": True}

@router.get("/assets/{asset_id}/loan-schedule")
async def get_loan_schedule(asset_id: str, user: User = Depends(require_auth)):
    asset = await db.assets.find_one({"id": asset_id, "user_id": user.id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset['type'] not in ['loan', 'credit_card']:
        raise HTTPException(status_code=400, detail="Not a loan/credit card asset")
    
    principal = asset.get('principal_amount', 0)
    rate = asset.get('interest_rate', 0) / 100 / 12  # Monthly rate
    tenure = asset.get('tenure_months', 0)
    
    if not all([principal, rate, tenure]):
        return {"schedule": [], "total_interest": 0, "total_amount": principal}
    
    # Calculate EMI
    emi = principal * rate * ((1 + rate) ** tenure) / (((1 + rate) ** tenure) - 1)
    
    schedule = []
    balance = principal
    total_interest = 0
    
    for month in range(1, tenure + 1):
        interest = balance * rate
        principal_paid = emi - interest
        balance -= principal_paid
        total_interest += interest
        
        schedule.append({
            "month": month,
            "emi": round(emi, 2),
            "principal": round(principal_paid, 2),
            "interest": round(interest, 2),
            "balance": round(max(balance, 0), 2)
        })
    
    return {
        "schedule": schedule,
        "emi": round(emi, 2),
        "total_interest": round(total_interest, 2),
        "total_amount": round(principal + total_interest, 2)
    }

@router.get("/assets/{asset_id}/documents")
async def get_asset_documents(asset_id: str, user: User = Depends(require_auth)):
    """Get all documents linked to a specific asset"""
    # Verify asset belongs to user
    asset = await db.assets.find_one({"id": asset_id, "user_id": user.id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    documents = await db.documents.find(
        {"user_id": user.id, "linked_asset_id": asset_id},
        {"_id": 0}
    ).to_list(100)
    
    # Convert datetime fields
    for doc in documents:
        if isinstance(doc.get('created_at'), str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
        if isinstance(doc.get('updated_at'), str):
            doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    
    return documents
