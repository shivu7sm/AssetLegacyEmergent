"""API routes: admin."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta

from core.auth import require_admin
from core.config import db, logger
from core.models import User

router = APIRouter()

# Admin Routes
@router.get("/admin/stats")
async def get_admin_stats(user: User = Depends(require_admin)):
    """Get overall platform statistics for admin dashboard."""
    try:
        # Get all users count
        total_users = await db.users.count_documents({})
        
        # Count users by subscription plan
        subscription_stats = {}
        async for user_doc in db.users.find({}, {"subscription_plan": 1}):
            plan = user_doc.get("subscription_plan", "Free")
            subscription_stats[plan] = subscription_stats.get(plan, 0) + 1
        
        # Get total assets count across all users
        total_assets = await db.assets.count_documents({})
        
        # Count assets by type
        asset_type_stats = {}
        async for asset in db.assets.find({}, {"type": 1}):
            asset_type = asset.get("type", "unknown")
            asset_type_stats[asset_type] = asset_type_stats.get(asset_type, 0) + 1
        
        # Get scheduled messages stats
        scheduled_messages_total = await db.scheduled_messages.count_documents({})
        scheduled_messages_sent = await db.scheduled_messages.count_documents({"status": "sent"})
        scheduled_messages_pending = await db.scheduled_messages.count_documents({"status": "scheduled"})
        scheduled_messages_failed = await db.scheduled_messages.count_documents({"status": "failed"})
        
        # Get DMS stats
        total_dms = await db.dead_man_switches.count_documents({})
        active_dms = await db.dead_man_switches.count_documents({"is_active": True})
        
        # Get recent registrations (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_registrations = await db.users.count_documents({
            "created_at": {"$gte": thirty_days_ago.isoformat()}
        })
        
        # Get AI insights generated count
        total_insights = await db.ai_insights.count_documents({})
        
        return {
            "users": {
                "total": total_users,
                "recent_30_days": recent_registrations,
                "by_subscription": subscription_stats
            },
            "assets": {
                "total": total_assets,
                "by_type": asset_type_stats
            },
            "scheduled_messages": {
                "total": scheduled_messages_total,
                "sent": scheduled_messages_sent,
                "pending": scheduled_messages_pending,
                "failed": scheduled_messages_failed
            },
            "dead_man_switches": {
                "total": total_dms,
                "active": active_dms
            },
            "ai_insights": {
                "total_generated": total_insights
            }
        }
    except Exception as e:
        logger.error(f"Failed to get admin stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")

@router.get("/admin/users")
async def get_all_users(admin: User = Depends(require_admin), skip: int = 0, limit: int = 50):
    """Get paginated list of all users with their details."""
    try:
        users = await db.users.find(
            {},
            {"_id": 0}
        ).skip(skip).limit(limit).to_list(limit)
        
        # Convert datetime fields
        for user_doc in users:
            if isinstance(user_doc.get('last_activity'), str):
                user_doc['last_activity'] = datetime.fromisoformat(user_doc['last_activity'])
            if isinstance(user_doc.get('created_at'), str):
                user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        
        # Get asset counts for each user
        user_data = []
        for user_doc in users:
            asset_count = await db.assets.count_documents({"user_id": user_doc["id"]})
            user_data.append({
                **user_doc,
                "asset_count": asset_count
            })
        
        total_users = await db.users.count_documents({})
        
        return {
            "users": user_data,
            "total": total_users,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Failed to get users: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

@router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role_data: dict, admin: User = Depends(require_admin)):
    """Update a user's role."""
    new_role = role_data.get("role")
    
    if new_role not in ["admin", "customer", "readonly"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin', 'customer', or 'readonly'")
    
    # Prevent changing own role
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": new_role}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": f"User role updated to {new_role}"}

@router.get("/admin/jobs/scheduled-messages")
async def get_scheduled_messages_status(admin: User = Depends(require_admin)):
    """Get all scheduled messages with their status."""
    try:
        messages = await db.scheduled_messages.find({}, {"_id": 0}).sort("send_date", -1).to_list(100)
        
        for msg in messages:
            if isinstance(msg.get('created_at'), str):
                msg['created_at'] = datetime.fromisoformat(msg['created_at'])
        
        return {
            "messages": messages,
            "total": len(messages)
        }
    except Exception as e:
        logger.error(f"Failed to get scheduled messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch scheduled messages")

@router.get("/admin/jobs/dms-reminders")
async def get_dms_reminders_status(admin: User = Depends(require_admin)):
    """Get Dead Man Switch reminders status."""
    try:
        dms_list = await db.dead_man_switches.find({}, {"_id": 0}).to_list(100)
        
        # Get user info for each DMS
        dms_with_users = []
        for dms in dms_list:
            if isinstance(dms.get('last_reset'), str):
                dms['last_reset'] = datetime.fromisoformat(dms['last_reset'])
            if isinstance(dms.get('created_at'), str):
                dms['created_at'] = datetime.fromisoformat(dms['created_at'])
            
            user_doc = await db.users.find_one({"id": dms["user_id"]}, {"email": 1, "name": 1})
            
            # Calculate days since last activity
            if user_doc:
                user_activity = await db.users.find_one({"id": dms["user_id"]}, {"last_activity": 1})
                last_activity = user_activity.get("last_activity")
                if isinstance(last_activity, str):
                    last_activity = datetime.fromisoformat(last_activity)
                
                days_inactive = (datetime.now(timezone.utc) - last_activity).days if last_activity else 0
                
                dms_with_users.append({
                    **dms,
                    "user_email": user_doc.get("email"),
                    "user_name": user_doc.get("name"),
                    "days_inactive": days_inactive,
                    "days_until_trigger": max(0, dms["inactivity_days"] - days_inactive)
                })
        
        return {
            "dms_reminders": dms_with_users,
            "total": len(dms_with_users)
        }
    except Exception as e:
        logger.error(f"Failed to get DMS reminders: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch DMS reminders")

@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(require_admin)):
    """Delete a user and all their data."""
    # Prevent deleting own account
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    try:
        # Delete user's assets
        await db.assets.delete_many({"user_id": user_id})
        
        # Delete user's documents
        await db.documents.delete_many({"user_id": user_id})
        
        # Delete user's DMS
        await db.dead_man_switches.delete_many({"user_id": user_id})
        
        # Delete user's nominees
        await db.nominees.delete_many({"user_id": user_id})
        
        # Delete user's scheduled messages
        await db.scheduled_messages.delete_many({"user_id": user_id})
        
        # Delete user's AI insights
        await db.ai_insights.delete_many({"user_id": user_id})
        
        # Delete user's net worth snapshots
        await db.networth_snapshots.delete_many({"user_id": user_id})
        
        # Delete user's sessions
        await db.user_sessions.delete_many({"user_id": user_id})
        
        # Finally delete the user
        result = await db.users.delete_one({"id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"success": True, "message": "User and all associated data deleted"}
    except Exception as e:
        logger.error(f"Failed to delete user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete user")

@router.get("/admin/audit-logs")
async def get_admin_audit_logs(
    admin: User = Depends(require_admin),
    skip: int = 0,
    limit: int = 100,
    action: str = None,
    resource_type: str = None,
    user_email: str = None,
    admin_only: bool = False
):
    """Get audit logs with filtering."""
    try:
        # Build query
        query = {}
        if action:
            query["action"] = action
        if resource_type:
            query["resource_type"] = resource_type
        if user_email:
            query["user_email"] = user_email
        if admin_only:
            query["is_admin_action"] = True
        
        # Get logs
        logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
        
        # Convert timestamp
        for log in logs:
            if isinstance(log.get('timestamp'), str):
                log['timestamp'] = datetime.fromisoformat(log['timestamp'])
        
        total = await db.audit_logs.count_documents(query)
        
        return {
            "logs": logs,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Failed to get audit logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch audit logs")

@router.get("/admin/subscription-analytics")
async def get_subscription_analytics(admin: User = Depends(require_admin)):
    """Get subscription and revenue analytics."""
    try:
        # Subscription plan pricing
        PLAN_PRICING = {
            "Free": 0,
            "Pro": 9.99,
            "Family": 19.99
        }
        
        # Get all users with subscription info
        users = await db.users.find({}, {"subscription_plan": 1, "created_at": 1, "stripe_subscription_id": 1}).to_list(10000)
        
        # Current subscription breakdown
        current_subscriptions = {}
        monthly_revenue = 0
        
        for user in users:
            plan = user.get("subscription_plan", "Free")
            current_subscriptions[plan] = current_subscriptions.get(plan, 0) + 1
            monthly_revenue += PLAN_PRICING.get(plan, 0)
        
        # Calculate last 12 months revenue trend (simulated based on user growth)
        twelve_months_ago = datetime.now(timezone.utc) - timedelta(days=365)
        monthly_revenue_trend = []
        
        for i in range(12):
            month_start = twelve_months_ago + timedelta(days=30 * i)
            month_end = month_start + timedelta(days=30)
            
            # Count users who joined before or during this month
            users_by_month = [u for u in users if isinstance(u.get('created_at'), str) and 
                            datetime.fromisoformat(u['created_at']) <= month_end]
            
            month_revenue = sum([PLAN_PRICING.get(u.get("subscription_plan", "Free"), 0) for u in users_by_month])
            
            monthly_revenue_trend.append({
                "month": month_start.strftime("%b %Y"),
                "revenue": round(month_revenue, 2),
                "subscribers": len([u for u in users_by_month if u.get("subscription_plan") != "Free"])
            })
        
        # Recent subscriptions (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_paid_subscriptions = len([
            u for u in users 
            if u.get("subscription_plan") not in ["Free", None] and
            isinstance(u.get('created_at'), str) and
            datetime.fromisoformat(u['created_at']) >= thirty_days_ago
        ])
        
        # Calculate churn (users who downgraded/cancelled) - simplified version
        # In production, this would track actual subscription changes
        total_paid = sum([count for plan, count in current_subscriptions.items() if plan != "Free"])
        estimated_churn = 0  # Would need subscription change tracking
        
        return {
            "current_subscriptions": current_subscriptions,
            "monthly_recurring_revenue": round(monthly_revenue, 2),
            "annual_recurring_revenue": round(monthly_revenue * 12, 2),
            "recent_subscriptions_30d": recent_paid_subscriptions,
            "estimated_churn_rate": estimated_churn,
            "total_paid_subscribers": total_paid,
            "revenue_trend_12_months": monthly_revenue_trend,
            "average_revenue_per_user": round(monthly_revenue / len(users) if users else 0, 2)
        }
    except Exception as e:
        logger.error(f"Failed to get subscription analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscription analytics")
