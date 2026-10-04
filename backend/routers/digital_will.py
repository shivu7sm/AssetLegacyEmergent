"""API routes: digital will."""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone

from core.auth import require_auth
from core.config import db
from core.models import DigitalWill, DigitalWillCreate, User

router = APIRouter()

# Digital Will Routes
@router.get("/will")
async def get_will(user: User = Depends(require_auth)):
    # Filter based on demo mode
    query = {"user_id": user.id}
    if user.demo_mode:
        query["demo_mode"] = True
    else:
        query["demo_mode"] = {"$ne": True}  # Show live will (demo_mode not true or not present)
    
    will = await db.digital_wills.find_one(query, {"_id": 0})
    if will:
        if isinstance(will.get('created_at'), str):
            will['created_at'] = datetime.fromisoformat(will['created_at'])
        if isinstance(will.get('updated_at'), str):
            will['updated_at'] = datetime.fromisoformat(will['updated_at'])
        return DigitalWill(**will)
    return None

@router.post("/will")
async def create_or_update_will(will_data: DigitalWillCreate, user: User = Depends(require_auth)):
    existing = await db.digital_wills.find_one({"user_id": user.id})
    
    if existing:
        update_dict = will_data.model_dump()
        update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.digital_wills.update_one(
            {"user_id": user.id},
            {"$set": update_dict}
        )
        will_id = existing["id"]
    else:
        will = DigitalWill(user_id=user.id, **will_data.model_dump())
        will_dict = will.model_dump()
        will_dict['created_at'] = will_dict['created_at'].isoformat()
        will_dict['updated_at'] = will_dict['updated_at'].isoformat()
        await db.digital_wills.insert_one(will_dict)
        will_id = will.id
    
    result = await db.digital_wills.find_one({"id": will_id}, {"_id": 0})
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    if isinstance(result.get('updated_at'), str):
        result['updated_at'] = datetime.fromisoformat(result['updated_at'])
    return DigitalWill(**result)
