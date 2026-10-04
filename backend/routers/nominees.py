"""API routes: nominees."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import os
from datetime import datetime, timezone, timedelta

from core.auth import require_auth
from core.config import db
from core.models import Nominee, NomineeCreate, User

router = APIRouter()

# Nominee Routes  
@router.get("/nominees", response_model=List[Nominee])
async def get_nominees(user: User = Depends(require_auth)):
    """Get all nominees for the user, sorted by priority"""
    demo_prefix = f"demo_{user.id}_"
    if user.demo_mode:
        nominees = await db.nominees.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }, {"_id": 0}).to_list(100)
    else:
        nominees = await db.nominees.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }, {"_id": 0}).to_list(100)
    
    for nominee in nominees:
        if isinstance(nominee.get('created_at'), str):
            nominee['created_at'] = datetime.fromisoformat(nominee['created_at'])
    # Sort by priority (lower number = higher priority)
    nominees.sort(key=lambda x: x.get('priority', 999))
    return [Nominee(**n) for n in nominees]

@router.get("/nominee", response_model=Optional[Nominee])
async def get_nominee(user: User = Depends(require_auth)):
    """Legacy endpoint - returns first nominee for backward compatibility"""
    nominee = await db.nominees.find_one({"user_id": user.id}, {"_id": 0}, sort=[("priority", 1)])
    if nominee:
        if isinstance(nominee.get('created_at'), str):
            nominee['created_at'] = datetime.fromisoformat(nominee['created_at'])
        return Nominee(**nominee)
    return None

@router.post("/nominees", response_model=Nominee)
async def create_nominee(nominee_data: NomineeCreate, user: User = Depends(require_auth)):
    """Create a new nominee"""
    nominee = Nominee(user_id=user.id, **nominee_data.model_dump())
    nominee_dict = nominee.model_dump()
    nominee_dict['created_at'] = nominee_dict['created_at'].isoformat()
    await db.nominees.insert_one(nominee_dict)
    return nominee

@router.put("/nominees/{nominee_id}", response_model=Nominee)
async def update_nominee(nominee_id: str, nominee_data: NomineeCreate, user: User = Depends(require_auth)):
    """Update an existing nominee"""
    existing = await db.nominees.find_one({"id": nominee_id, "user_id": user.id})
    if not existing:
        raise HTTPException(status_code=404, detail="Nominee not found")
    
    await db.nominees.update_one(
            {"id": nominee_id, "user_id": user.id},
            {"$set": nominee_data.model_dump()}
        )
    
    result = await db.nominees.find_one({"id": nominee_id}, {"_id": 0})
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    return Nominee(**result)

@router.delete("/nominees/{nominee_id}")
async def delete_nominee(nominee_id: str, user: User = Depends(require_auth)):
    """Delete a nominee"""
    result = await db.nominees.delete_one({"id": nominee_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nominee not found")
    return {"success": True}

@router.post("/nominee", response_model=Nominee)
async def create_or_update_nominee_legacy(nominee_data: NomineeCreate, user: User = Depends(require_auth)):
    """Legacy endpoint for backward compatibility - creates/updates first nominee"""
    existing = await db.nominees.find_one({"user_id": user.id}, sort=[("priority", 1)])
    
    if existing:
        await db.nominees.update_one(
            {"id": existing["id"], "user_id": user.id},
            {"$set": nominee_data.model_dump()}
        )
        nominee_id = existing["id"]
    else:
        nominee = Nominee(user_id=user.id, **nominee_data.model_dump())
        nominee_dict = nominee.model_dump()
        nominee_dict['created_at'] = nominee_dict['created_at'].isoformat()
        await db.nominees.insert_one(nominee_dict)
        nominee_id = nominee.id
    
    result = await db.nominees.find_one({"id": nominee_id}, {"_id": 0})
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    return Nominee(**result)

# Nominee Access Management
@router.post("/nominees/{nominee_id}/generate-access")
async def generate_nominee_access(nominee_id: str, user: User = Depends(require_auth)):
    """Generate secure access token for a nominee"""
    import secrets
    
    nominee = await db.nominees.find_one({"id": nominee_id, "user_id": user.id})
    if not nominee:
        raise HTTPException(status_code=404, detail="Nominee not found")
    
    # Generate a secure 32-character token
    access_token = f"nom_{secrets.token_urlsafe(32)}"
    
    await db.nominees.update_one(
        {"id": nominee_id},
        {"$set": {
            "access_token": access_token,
            "access_token_created_at": datetime.now(timezone.utc).isoformat(),
            "access_granted": True
        }}
    )
    
    # Create access link
    frontend_url = os.getenv("FRONTEND_URL", "https://yourdomain.com")
    access_link = f"{frontend_url}/nominee-access?token={access_token}"
    
    return {
        "success": True,
        "access_token": access_token,
        "access_link": access_link,
        "nominee_email": nominee["email"]
    }

@router.post("/nominees/{nominee_id}/revoke-access")
async def revoke_nominee_access(nominee_id: str, user: User = Depends(require_auth)):
    """Revoke access for a nominee"""
    result = await db.nominees.update_one(
        {"id": nominee_id, "user_id": user.id},
        {"$set": {
            "access_granted": False,
            "access_token": None
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Nominee not found")
    
    return {"success": True, "message": "Access revoked successfully"}

@router.put("/nominees/{nominee_id}/access-type")
async def update_access_type(nominee_id: str, access_type: str, user: User = Depends(require_auth)):
    """Update when nominee can access: 'immediate', 'temporary', or 'after_dms'"""
    if access_type not in ['immediate', 'temporary', 'after_dms']:
        raise HTTPException(status_code=400, detail="Invalid access type. Must be 'immediate', 'temporary', or 'after_dms'")
    
    update_data = {"access_type": access_type}
    
    # For temporary access, set expiration date
    if access_type == 'temporary':
        update_data["access_expires_at"] = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    else:
        update_data["access_expires_at"] = None
    
    result = await db.nominees.update_one(
        {"id": nominee_id, "user_id": user.id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Nominee not found")
    
    return {"success": True, "access_type": access_type}

# Nominee Authentication & Dashboard
@router.post("/nominee/auth")
async def nominee_login(access_token: str):
    """Authenticate nominee using their access token"""
    nominee = await db.nominees.find_one({"access_token": access_token})
    
    if not nominee:
        raise HTTPException(status_code=401, detail="Invalid access token")
    
    if not nominee.get("access_granted"):
        raise HTTPException(status_code=403, detail="Access has been revoked")
    
    # Check if temporary access has expired
    if nominee.get("access_type") == "temporary" and nominee.get("access_expires_at"):
        expires_at = nominee.get("access_expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        
        if datetime.now(timezone.utc) > expires_at:
            # Auto-revoke expired access
            await db.nominees.update_one(
                {"access_token": access_token},
                {"$set": {"access_granted": False, "access_token": None}}
            )
            raise HTTPException(status_code=403, detail="Temporary access has expired")
    
    # Check if access is immediate or requires DMS trigger
    if nominee.get("access_type") == "after_dms":
        # Check if DMS has been triggered
        user = await db.users.find_one({"id": nominee["user_id"]})
        if user:
            last_activity = user.get("last_activity")
            if isinstance(last_activity, str):
                last_activity = datetime.fromisoformat(last_activity)
            
            dms = await db.dead_man_switches.find_one({"user_id": user["id"]})
            if dms and dms.get("is_active"):
                days_inactive = (datetime.now(timezone.utc) - last_activity).days
                if days_inactive < dms.get("inactivity_days", 90):
                    raise HTTPException(status_code=403, detail="Access is only available after Dead Man's Switch triggers")
    
    # Update last accessed time
    await db.nominees.update_one(
        {"access_token": access_token},
        {"$set": {"last_accessed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Log nominee access in audit trail
    audit_log = {
        "user_id": nominee["user_id"],
        "action": "nominee_access_login",
        "details": {
            "nominee_name": nominee.get("name"),
            "nominee_email": nominee.get("email"),
            "access_type": nominee.get("access_type", "after_dms")
        },
        "ip_address": "unknown",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(audit_log)
    
    # Return nominee info and owner info
    owner = await db.users.find_one({"id": nominee["user_id"]})
    
    return {
        "nominee": {
            "id": nominee["id"],
            "name": nominee["name"],
            "relationship": nominee.get("relationship"),
            "access_type": nominee.get("access_type", "after_dms")
        },
        "owner": {
            "name": owner.get("name") if owner else "Unknown",
            "email": owner.get("email") if owner else "Unknown"
        },
        "access_token": access_token
    }

@router.get("/nominee/dashboard")
async def get_nominee_dashboard(access_token: str):
    """Get read-only dashboard for nominee"""
    nominee = await db.nominees.find_one({"access_token": access_token})
    
    if not nominee or not nominee.get("access_granted"):
        raise HTTPException(status_code=401, detail="Invalid or revoked access")
    
    user_id = nominee["user_id"]
    
    # Log dashboard access
    audit_log = {
        "user_id": user_id,
        "action": "nominee_viewed_dashboard",
        "details": {
            "nominee_name": nominee.get("name"),
            "nominee_email": nominee.get("email")
        },
        "ip_address": "unknown",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(audit_log)
    
    # Get all assets (excluding demo data) - EXCLUDE _id
    demo_prefix = f"demo_{user_id}_"
    assets = await db.assets.find({
        "user_id": user_id,
        "id": {"$not": {"$regex": f"^{demo_prefix}"}}
    }, {"_id": 0}).to_list(1000)
    
    # Get portfolios - EXCLUDE _id
    portfolios = await db.portfolio_assets.find({
        "user_id": user_id,
        "id": {"$not": {"$regex": f"^{demo_prefix}"}}
    }, {"_id": 0}).to_list(1000)
    
    # Get documents
    documents = await db.documents.find({
        "user_id": user_id,
        "id": {"$not": {"$regex": f"^{demo_prefix}"}}
    }, {"_id": 0, "file_data": 0}).to_list(1000)
    
    # Get will
    will = await db.digital_wills.find_one({
        "user_id": user_id,
        "demo_mode": {"$ne": True}
    }, {"_id": 0})
    
    # Get nominees (they should see who else is a nominee)
    all_nominees = await db.nominees.find({"user_id": user_id}, {"_id": 0, "access_token": 0}).to_list(100)
    
    # Calculate summary - handle None values
    total_assets = len(assets) + len(portfolios)
    total_value = sum([(a.get("current_value") or a.get("total_value") or 0) for a in assets])
    total_value += sum([(p.get("total_value") or 0) for p in portfolios])
    
    # Convert datetime fields to ISO strings for JSON serialization
    for asset in assets:
        if isinstance(asset.get('created_at'), datetime):
            asset['created_at'] = asset['created_at'].isoformat()
        if isinstance(asset.get('updated_at'), datetime):
            asset['updated_at'] = asset['updated_at'].isoformat()
    
    for portfolio in portfolios:
        if isinstance(portfolio.get('created_at'), datetime):
            portfolio['created_at'] = portfolio['created_at'].isoformat()
    
    for doc in documents:
        if isinstance(doc.get('created_at'), datetime):
            doc['created_at'] = doc['created_at'].isoformat()
        if isinstance(doc.get('uploaded_at'), datetime):
            doc['uploaded_at'] = doc['uploaded_at'].isoformat()
    
    if will:
        if isinstance(will.get('created_at'), datetime):
            will['created_at'] = will['created_at'].isoformat()
        if isinstance(will.get('updated_at'), datetime):
            will['updated_at'] = will['updated_at'].isoformat()
    
    for nom in all_nominees:
        if isinstance(nom.get('created_at'), datetime):
            nom['created_at'] = nom['created_at'].isoformat()
        if isinstance(nom.get('last_accessed_at'), datetime):
            nom['last_accessed_at'] = nom['last_accessed_at'].isoformat()
    
    return {
        "summary": {
            "total_assets": total_assets,
            "total_value": total_value,
            "asset_count": len(assets),
            "portfolio_count": len(portfolios),
            "document_count": len(documents)
        },
        "assets": assets,
        "portfolios": portfolios,
        "documents": documents,
        "will": will,
        "nominees": all_nominees,
        "nominee_info": {
            "name": nominee.get("name"),
            "relationship": nominee.get("relationship"),
            "priority": nominee.get("priority")
        }
    }

@router.get("/nominees/my-accesses")
async def get_my_nominee_accesses(user: User = Depends(require_auth)):
    """Get all accounts where current user is listed as a nominee"""
    # Find all nominee records where current user's email matches
    nominee_records = await db.nominees.find({
        "email": user.email,
        "access_granted": True
    }).to_list(100)
    
    accessible_accounts = []
    
    for nominee_record in nominee_records:
        # Get the owner's info
        owner = await db.users.find_one({"id": nominee_record["user_id"]})
        
        if owner:
            # Check access expiration for temporary access
            is_expired = False
            if nominee_record.get("access_type") == "temporary" and nominee_record.get("access_expires_at"):
                expires_at = nominee_record.get("access_expires_at")
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                is_expired = datetime.now(timezone.utc) > expires_at
            
            if not is_expired:
                accessible_accounts.append({
                    "account_id": owner["id"],
                    "account_name": owner.get("name", "Unknown"),
                    "account_email": owner.get("email"),
                    "access_type": nominee_record.get("access_type", "after_dms"),
                    "access_token": nominee_record.get("access_token"),
                    "relationship": nominee_record.get("relationship"),
                    "granted_at": nominee_record.get("access_token_created_at"),
                    "expires_at": nominee_record.get("access_expires_at")
                })
    
    return {"accessible_accounts": accessible_accounts}
