"""API routes: exchange connections."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from core.auth import require_auth
from core.config import db
from core.models import ExchangeConnection, ExchangeConnectionCreate, User

router = APIRouter()

# Exchange Connection Routes
@router.get("/exchange-connections")
async def get_exchange_connections(user: User = Depends(require_auth)):
    connections = await db.exchange_connections.find({"user_id": user.id}, {"_id": 0, "api_key": 0, "api_secret": 0}).to_list(100)
    return connections

@router.post("/exchange-connections")
async def create_exchange_connection(conn_data: ExchangeConnectionCreate, user: User = Depends(require_auth)):
    connection = ExchangeConnection(user_id=user.id, **conn_data.model_dump())
    conn_dict = connection.model_dump()
    conn_dict['created_at'] = conn_dict['created_at'].isoformat()
    if conn_dict.get('last_synced'):
        conn_dict['last_synced'] = conn_dict['last_synced'].isoformat()
    await db.exchange_connections.insert_one(conn_dict)
    return {"success": True, "id": connection.id}

@router.post("/exchange-connections/{conn_id}/sync")
async def sync_exchange_connection(conn_id: str, user: User = Depends(require_auth)):
    connection = await db.exchange_connections.find_one({"id": conn_id, "user_id": user.id})
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Here you would integrate with exchange APIs (Binance, Gemini, eToro)
    # For now, we'll return a mock response
    holdings = {
        "BTC": {"amount": 0.5, "value_usd": 20000},
        "ETH": {"amount": 2.5, "value_usd": 5000}
    }
    
    await db.exchange_connections.update_one(
        {"id": conn_id},
        {"$set": {
            "holdings": holdings,
            "last_synced": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "holdings": holdings}

@router.delete("/exchange-connections/{conn_id}")
async def delete_exchange_connection(conn_id: str, user: User = Depends(require_auth)):
    result = await db.exchange_connections.delete_one({"id": conn_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"success": True}
