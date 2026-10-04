"""API routes: audit."""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta

from core.auth import require_auth
from core.config import db
from core.models import User

router = APIRouter()

# Audit Log Routes
@router.get("/audit/logs")
async def get_audit_logs(user: User = Depends(require_auth), days: int = 30):
    """Get audit logs for the last N days (default 30)"""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    logs = await db.audit_logs.find(
        {
            "user_id": user.id,
            "timestamp": {"$gte": cutoff_date}
        },
        {"_id": 0}
    ).sort("timestamp", -1).to_list(1000)
    
    return logs

@router.delete("/audit/logs/cleanup")
async def cleanup_old_audit_logs(user: User = Depends(require_auth)):
    """Delete audit logs older than 30 days"""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
    
    result = await db.audit_logs.delete_many({
        "user_id": user.id,
        "timestamp": {"$lt": cutoff_date}
    })
    
    return {
        "success": True,
        "deleted_count": result.deleted_count
    }
