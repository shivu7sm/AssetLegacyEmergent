"""API routes: networth."""
from fastapi import APIRouter, HTTPException, Depends

from core.auth import require_auth
from core.config import db, logger
from core.models import NetWorthSnapshot, NetWorthSnapshotCreate, User
from routers.dashboard import get_dashboard_summary
from services.networth import create_snapshot_for_date
from services.valuation import convert_currency

router = APIRouter()

# Net Worth Snapshot Routes
@router.post("/networth/snapshot")
async def create_networth_snapshot(snapshot_data: NetWorthSnapshotCreate, user: User = Depends(require_auth)):
    """Create a net worth snapshot for historical tracking."""
    try:
        # Get current summary in specified currency
        summary_response = await get_dashboard_summary(user, snapshot_data.currency or "USD")
        
        snapshot = NetWorthSnapshot(
            user_id=user.id,
            snapshot_date=snapshot_data.snapshot_date,
            total_assets=summary_response["total_assets_value"],
            total_liabilities=summary_response["total_liabilities_value"],
            net_worth=summary_response["net_worth"],
            currency=snapshot_data.currency or "USD",
            asset_breakdown=summary_response["asset_values_separate"],
            liability_breakdown=summary_response["liability_values_separate"]
        )
        
        snap_dict = snapshot.model_dump()
        snap_dict['created_at'] = snap_dict['created_at'].isoformat()
        
        # Upsert - update if snapshot for this date exists, create if not
        await db.networth_snapshots.update_one(
            {"user_id": user.id, "snapshot_date": snapshot_data.snapshot_date},
            {"$set": snap_dict},
            upsert=True
        )
        
        return {"success": True, "snapshot": snapshot}
    except Exception as e:
        logger.error(f"Failed to create snapshot: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create snapshot")

@router.get("/networth/history")
async def get_networth_history(user: User = Depends(require_auth), target_currency: str = "USD"):
    """Get historical net worth snapshots, optionally converted to target currency."""
    snapshots = await db.networth_snapshots.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("snapshot_date", 1).to_list(1000)
    
    # Convert to target currency if needed
    for snapshot in snapshots:
        if snapshot.get("currency") != target_currency:
            snapshot["net_worth"] = convert_currency(
                snapshot["net_worth"],
                snapshot["currency"],
                target_currency
            )
            snapshot["total_assets"] = convert_currency(
                snapshot["total_assets"],
                snapshot["currency"],
                target_currency
            )
            snapshot["total_liabilities"] = convert_currency(
                snapshot["total_liabilities"],
                snapshot["currency"],
                target_currency
            )
            snapshot["display_currency"] = target_currency
    
    return snapshots

@router.get("/networth/trends")
async def get_networth_trends(user: User = Depends(require_auth), target_currency: str = "USD"):
    """Get YoY trends and analytics."""
    snapshots = await db.networth_snapshots.find(
        {"user_id": user.id}
    ).sort("snapshot_date", 1).to_list(1000)
    
    if len(snapshots) < 2:
        return {
            "yoy_change": 0,
            "yoy_percent": 0,
            "trend": "insufficient_data",
            "message": "Need at least 2 snapshots for trend analysis"
        }
    
    # Calculate year-over-year change
    latest = snapshots[-1]
    earliest = snapshots[0]
    
    latest_nw = convert_currency(latest["net_worth"], latest["currency"], target_currency)
    earliest_nw = convert_currency(earliest["net_worth"], earliest["currency"], target_currency)
    
    yoy_change = latest_nw - earliest_nw
    yoy_percent = ((yoy_change / earliest_nw) * 100) if earliest_nw != 0 else 0
    
    return {
        "yoy_change": round(yoy_change, 2),
        "yoy_percent": round(yoy_percent, 2),
        "trend": "positive" if yoy_change > 0 else "negative",
        "currency": target_currency,
        "period_days": len(snapshots),
        "latest_net_worth": round(latest_nw, 2),
        "earliest_net_worth": round(earliest_nw, 2)
    }

@router.post("/networth/backfill")
async def backfill_snapshots_from_assets(user: User = Depends(require_auth), currency: str = "USD"):
    """Backfill net worth snapshots from all assets with purchase dates."""
    try:
        assets = await db.assets.find({"user_id": user.id}).to_list(1000)
        
        # Get unique purchase dates
        purchase_dates = set()
        for asset in assets:
            if asset.get('purchase_date'):
                purchase_dates.add(asset['purchase_date'])
        
        if not purchase_dates:
            return {
                "success": True,
                "message": "No assets with purchase dates found",
                "snapshots_created": 0
            }
        
        # Create snapshots for each unique purchase date
        snapshots_created = 0
        for date in sorted(purchase_dates):
            try:
                await create_snapshot_for_date(user.id, date, currency)
                snapshots_created += 1
            except Exception as e:
                logger.error(f"Failed to create snapshot for date {date}: {str(e)}")
        
        return {
            "success": True,
            "message": f"Backfilled {snapshots_created} snapshots from asset purchase dates",
            "snapshots_created": snapshots_created,
            "dates_processed": list(sorted(purchase_dates))
        }
    except Exception as e:
        logger.error(f"Backfill failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to backfill snapshots")
