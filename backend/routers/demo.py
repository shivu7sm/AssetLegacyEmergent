"""API routes: demo."""
from fastapi import APIRouter, HTTPException, Depends

from core.auth import require_auth
from core.config import db
from core.models import User
from services.demo_seed import seed_demo_data

router = APIRouter()

# Demo Mode Routes
@router.get("/demo/status")
async def get_demo_status(user: User = Depends(require_auth)):
    """Get current demo mode status and test account access"""
    # Check if user has access to universal test account
    test_account_access = None
    if user.demo_mode:
        # In demo mode, users get automatic access to test account
        test_account_access = {
            "account_id": "test_account_universal",
            "account_name": "AssetVault Demo Portfolio",
            "access_type": "demo_preview"
        }
    
    return {
        "demo_mode": user.demo_mode,
        "test_account_access": test_account_access
    }

@router.post("/demo/toggle")
async def toggle_demo_mode(user: User = Depends(require_auth)):
    """Toggle between live and demo mode"""
    new_mode = not user.demo_mode
    
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"demo_mode": new_mode}}
    )
    
    # If switching to demo mode, ensure demo data exists
    if new_mode:
        await seed_demo_data(user.id)
    
    return {
        "demo_mode": new_mode,
        "message": f"Switched to {'Demo' if new_mode else 'Live'} mode"
    }

@router.post("/demo/reseed")
async def reseed_demo_data(user: User = Depends(require_auth)):
    """Force reseed demo data - useful after updates"""
    demo_prefix = f"demo_{user.id}_"
    
    # Delete all existing demo data
    await db.assets.delete_many({"user_id": user.id, "id": {"$regex": f"^{demo_prefix}"}})
    await db.portfolio_assets.delete_many({"user_id": user.id, "id": {"$regex": f"^{demo_prefix}"}})
    await db.documents.delete_many({"user_id": user.id, "id": {"$regex": f"^{demo_prefix}"}})
    await db.scheduled_messages.delete_many({"user_id": user.id, "id": {"$regex": f"^{demo_prefix}"}})
    await db.digital_wills.delete_many({"user_id": user.id, "demo_mode": True})
    await db.nominees.delete_many({"user_id": user.id, "id": {"$regex": f"^{demo_prefix}"}})
    
    # Reseed
    await seed_demo_data(user.id, force=True)
    
    return {"success": True, "message": "Demo data reseeded successfully"}

@router.get("/demo/test-account-assets")
async def get_test_account_assets(user: User = Depends(require_auth)):
    """Get assets from universal test account - only accessible in demo mode"""
    if not user.demo_mode:
        raise HTTPException(status_code=403, detail="Test account only accessible in demo mode")
    
    # Fetch test account assets
    test_account_id = "test_account_universal"
    
    # Get test account assets - exclude _id
    assets = await db.assets.find({
        "user_id": test_account_id
    }, {"_id": 0}).to_list(1000)
    
    portfolios = await db.portfolio_assets.find({
        "user_id": test_account_id
    }, {"_id": 0}).to_list(1000)
    
    return {
        "account_id": test_account_id,
        "account_name": "AssetVault Demo Portfolio",
        "account_owner": "Demo Account Holder",
        "assets": assets,
        "portfolios": portfolios,
        "access_type": "readonly_demo"
    }
