"""API routes: users."""
from fastapi import APIRouter, HTTPException, Depends

from core.auth import require_auth
from core.config import db
from core.models import User, UserPreferences

router = APIRouter()

# User Preferences
@router.put("/user/preferences")
async def update_preferences(prefs: UserPreferences, user: User = Depends(require_auth)):
    # Only save the fields the client sent; partial updates (e.g. just the
    # currency) must not reset the other preferences to their defaults.
    update_data = prefs.model_dump(exclude_unset=True)
    if update_data:
        await db.users.update_one({"id": user.id}, {"$set": update_data})
    return {"success": True}

# User Preferences Routes
@router.get("/user/preferences")
async def get_preferences(user: User = Depends(require_auth)):
    return {
        "measurement_unit": user.measurement_unit,
        "weight_unit": user.weight_unit,
        "currency_format": getattr(user, 'currency_format', 'standard'),
        "selected_currency": getattr(user, 'selected_currency', 'USD'),
        "default_currency": getattr(user, 'default_currency', 'USD'),
        "default_asset_view": getattr(user, 'default_asset_view', 'grid'),
        "marketing_consent": getattr(user, 'marketing_consent', False),
        "communication_consent": getattr(user, 'communication_consent', True)
    }

@router.post("/user/complete-onboarding")
async def complete_onboarding(user: User = Depends(require_auth)):
    """Mark onboarding as completed for user"""
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"onboarding_completed": True}}
    )
    
    return {
        "success": True,
        "message": "Onboarding completed"
    }

@router.post("/user/theme")
async def update_theme(theme: str, user: User = Depends(require_auth)):
    """Update user's color theme preference"""
    if theme not in ["dark", "light"]:
        raise HTTPException(status_code=400, detail="Invalid theme. Must be 'dark' or 'light'")
    
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"color_theme": theme}}
    )
    
    return {
        "success": True,
        "theme": theme
    }
