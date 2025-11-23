from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import requests
from pycoingecko import CoinGeckoAPI
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# CoinGecko API
cg = CoinGeckoAPI()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Nominee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    relationship: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeadManSwitch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    inactivity_days: int = 90
    reminder_1_days: int = 60  # First reminder at 60 days
    reminder_2_days: int = 75  # Second reminder at 75 days
    reminder_3_days: int = 85  # Third reminder at 85 days
    is_active: bool = True
    last_reset: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reminders_sent: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Asset(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # bank, insurance, investment, crypto, gold, diamond, locker, property, loan
    name: str
    details: Dict[str, Any] = {}
    purchase_price: Optional[float] = None
    purchase_currency: str = "USD"
    purchase_date: Optional[str] = None
    current_price: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssetCreate(BaseModel):
    type: str
    name: str
    details: Dict[str, Any] = {}
    purchase_price: Optional[float] = None
    purchase_currency: str = "USD"
    purchase_date: Optional[str] = None

class NomineeCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    relationship: Optional[str] = None

class DMSCreate(BaseModel):
    inactivity_days: int = 90
    reminder_1_days: int = 60
    reminder_2_days: int = 75
    reminder_3_days: int = 85

# Auth Helper
async def get_current_user(request: Request) -> Optional[User]:
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": session_token})
    if not session:
        return None
    
    if datetime.fromisoformat(session["expires_at"]) < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        return None
    
    user_doc = await db.users.find_one({"id": session["user_id"]})
    if not user_doc:
        return None
    
    # Update last activity
    await db.users.update_one(
        {"id": session["user_id"]},
        {"$set": {"last_activity": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Convert datetime strings back to datetime objects
    if isinstance(user_doc.get('last_activity'), str):
        user_doc['last_activity'] = datetime.fromisoformat(user_doc['last_activity'])
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user

# Auth Routes
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Get session data from Emergent Auth
    try:
        auth_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10
        )
        auth_response.raise_for_status()
        session_data = auth_response.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to validate session: {str(e)}")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": session_data["email"]})
    
    if not existing_user:
        # Create new user
        user = User(
            email=session_data["email"],
            name=session_data["name"],
            picture=session_data.get("picture")
        )
        user_dict = user.model_dump()
        user_dict['last_activity'] = user_dict['last_activity'].isoformat()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)
        user_id = user.id
    else:
        user_id = existing_user["id"]
    
    # Create session
    session_token = session_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    
    session_dict = user_session.model_dump()
    session_dict['expires_at'] = session_dict['expires_at'].isoformat()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    await db.user_sessions.insert_one(session_dict)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {"success": True}

@api_router.get("/auth/me")
async def get_me(user: User = Depends(require_auth)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"success": True}

# Asset Routes
@api_router.get("/assets", response_model=List[Asset])
async def get_assets(user: User = Depends(require_auth)):
    assets = await db.assets.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    for asset in assets:
        if isinstance(asset.get('created_at'), str):
            asset['created_at'] = datetime.fromisoformat(asset['created_at'])
        if isinstance(asset.get('updated_at'), str):
            asset['updated_at'] = datetime.fromisoformat(asset['updated_at'])
    return assets

@api_router.post("/assets", response_model=Asset)
async def create_asset(asset_data: AssetCreate, user: User = Depends(require_auth)):
    asset = Asset(user_id=user.id, **asset_data.model_dump())
    asset_dict = asset.model_dump()
    asset_dict['created_at'] = asset_dict['created_at'].isoformat()
    asset_dict['updated_at'] = asset_dict['updated_at'].isoformat()
    await db.assets.insert_one(asset_dict)
    return asset

@api_router.put("/assets/{asset_id}", response_model=Asset)
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
    
    updated = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Asset(**updated)

@api_router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, user: User = Depends(require_auth)):
    result = await db.assets.delete_one({"id": asset_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"success": True}

# Nominee Routes
@api_router.get("/nominee", response_model=Optional[Nominee])
async def get_nominee(user: User = Depends(require_auth)):
    nominee = await db.nominees.find_one({"user_id": user.id}, {"_id": 0})
    if nominee:
        if isinstance(nominee.get('created_at'), str):
            nominee['created_at'] = datetime.fromisoformat(nominee['created_at'])
        return Nominee(**nominee)
    return None

@api_router.post("/nominee", response_model=Nominee)
async def create_or_update_nominee(nominee_data: NomineeCreate, user: User = Depends(require_auth)):
    existing = await db.nominees.find_one({"user_id": user.id})
    
    if existing:
        await db.nominees.update_one(
            {"user_id": user.id},
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

# Dead Man Switch Routes
@api_router.get("/dms")
async def get_dms(user: User = Depends(require_auth)):
    dms = await db.dead_man_switches.find_one({"user_id": user.id}, {"_id": 0})
    if dms:
        if isinstance(dms.get('last_reset'), str):
            dms['last_reset'] = datetime.fromisoformat(dms['last_reset'])
        if isinstance(dms.get('created_at'), str):
            dms['created_at'] = datetime.fromisoformat(dms['created_at'])
        return DeadManSwitch(**dms)
    return None

@api_router.post("/dms")
async def create_or_update_dms(dms_data: DMSCreate, user: User = Depends(require_auth)):
    existing = await db.dead_man_switches.find_one({"user_id": user.id})
    
    if existing:
        await db.dead_man_switches.update_one(
            {"user_id": user.id},
            {"$set": {**dms_data.model_dump(), "last_reset": datetime.now(timezone.utc).isoformat()}}
        )
        dms_id = existing["id"]
    else:
        dms = DeadManSwitch(user_id=user.id, **dms_data.model_dump())
        dms_dict = dms.model_dump()
        dms_dict['last_reset'] = dms_dict['last_reset'].isoformat()
        dms_dict['created_at'] = dms_dict['created_at'].isoformat()
        await db.dead_man_switches.insert_one(dms_dict)
        dms_id = dms.id
    
    result = await db.dead_man_switches.find_one({"id": dms_id}, {"_id": 0})
    if isinstance(result.get('last_reset'), str):
        result['last_reset'] = datetime.fromisoformat(result['last_reset'])
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    return DeadManSwitch(**result)

@api_router.post("/dms/reset")
async def reset_dms(user: User = Depends(require_auth)):
    result = await db.dead_man_switches.update_one(
        {"user_id": user.id},
        {"$set": {
            "last_reset": datetime.now(timezone.utc).isoformat(),
            "reminders_sent": 0
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Dead man switch not configured")
    return {"success": True, "message": "Timer reset successfully"}

# Price API Routes
@api_router.get("/prices/crypto/{symbol}")
async def get_crypto_price(symbol: str, currency: str = "usd"):
    try:
        price_data = cg.get_price(ids=symbol.lower(), vs_currencies=currency)
        return {"symbol": symbol, "price": price_data[symbol.lower()][currency], "currency": currency}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch price: {str(e)}")

@api_router.get("/prices/gold")
async def get_gold_price(currency: str = "USD"):
    # Using metals-api.com free tier alternative
    # For production, use a proper API key
    try:
        # Simplified - return approximate gold price per gram
        # In production, integrate with metals-api.com or similar
        base_prices = {
            "USD": 65.0,
            "INR": 5400.0,
            "EUR": 60.0,
            "GBP": 52.0
        }
        return {"metal": "gold", "price": base_prices.get(currency.upper(), 65.0), "currency": currency, "unit": "gram"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch gold price: {str(e)}")

@api_router.get("/prices/currency/{from_currency}/{to_currency}")
async def get_currency_conversion(from_currency: str, to_currency: str):
    try:
        # Using exchangerate-api.com free tier
        response = requests.get(
            f"https://api.exchangerate-api.com/v4/latest/{from_currency.upper()}",
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        rate = data["rates"].get(to_currency.upper())
        if not rate:
            raise HTTPException(status_code=400, detail="Currency not found")
        return {"from": from_currency.upper(), "to": to_currency.upper(), "rate": rate}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch conversion rate: {str(e)}")

# Dashboard Routes
@api_router.get("/dashboard/summary")
async def get_dashboard_summary(user: User = Depends(require_auth)):
    assets = await db.assets.find({"user_id": user.id}).to_list(1000)
    
    total_assets = len(assets)
    asset_types = {}
    total_value_usd = 0.0
    
    for asset in assets:
        asset_type = asset["type"]
        asset_types[asset_type] = asset_types.get(asset_type, 0) + 1
        
        # Calculate value
        price = asset.get("current_price") or asset.get("purchase_price") or 0
        currency = asset.get("purchase_currency", "USD")
        
        # Convert to USD
        if currency.upper() != "USD":
            try:
                conv_response = requests.get(
                    f"https://api.exchangerate-api.com/v4/latest/{currency.upper()}",
                    timeout=5
                )
                if conv_response.status_code == 200:
                    rate = conv_response.json()["rates"]["USD"]
                    price = price * rate
            except:
                pass
        
        total_value_usd += price
    
    return {
        "total_assets": total_assets,
        "asset_types": asset_types,
        "total_value_usd": round(total_value_usd, 2),
        "has_nominee": await db.nominees.count_documents({"user_id": user.id}) > 0,
        "has_dms": await db.dead_man_switches.count_documents({"user_id": user.id}) > 0
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
