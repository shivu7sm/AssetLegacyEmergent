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

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

cg = CoinGeckoAPI()

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
    measurement_unit: str = "imperial"  # imperial or metric
    weight_unit: str = "ounce"  # ounce or gram
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
    reminder_1_days: int = 60
    reminder_2_days: int = 75
    reminder_3_days: int = 85
    is_active: bool = True
    last_reset: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reminders_sent: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DigitalWill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    will_text: str
    beneficiaries: List[Dict[str, Any]] = []
    asset_distribution: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: Optional[str] = None
    file_type: str
    file_data: str  # base64 encoded
    file_size: int
    tags: List[str] = []
    share_with_nominee: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Asset(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    name: str
    
    # Common fields
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    current_unit_price: Optional[float] = None
    total_value: Optional[float] = None
    current_total_value: Optional[float] = None
    purchase_currency: str = "USD"
    purchase_date: Optional[str] = None
    
    # Crypto/Stock specific
    symbol: Optional[str] = None
    
    # Real Estate specific
    area: Optional[float] = None  # sqft or sqmt
    area_unit: Optional[str] = "sqft"  # sqft, sqmt, yard
    price_per_area: Optional[float] = None
    location: Optional[Dict[str, Any]] = None  # {address, lat, lng}
    
    # Loan/Credit Card specific
    principal_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    tenure_months: Optional[int] = None
    emi_amount: Optional[float] = None
    outstanding_balance: Optional[float] = None
    
    # Investment specific
    maturity_date: Optional[str] = None
    expected_return: Optional[float] = None
    
    # Locker specific
    bank_name: Optional[str] = None
    branch: Optional[str] = None
    locker_number: Optional[str] = None
    
    # Precious metals specific
    weight: Optional[float] = None
    weight_unit: Optional[str] = "gram"  # gram or ounce
    purity: Optional[str] = None
    
    details: Dict[str, Any] = {}
    current_price: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssetCreate(BaseModel):
    type: str
    name: str
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    current_unit_price: Optional[float] = None
    total_value: Optional[float] = None
    current_total_value: Optional[float] = None
    purchase_currency: str = "USD"
    purchase_date: Optional[str] = None
    symbol: Optional[str] = None
    area: Optional[float] = None
    area_unit: Optional[str] = "sqft"
    price_per_area: Optional[float] = None
    location: Optional[Dict[str, Any]] = None
    principal_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    tenure_months: Optional[int] = None
    emi_amount: Optional[float] = None
    outstanding_balance: Optional[float] = None
    maturity_date: Optional[str] = None
    expected_return: Optional[float] = None
    bank_name: Optional[str] = None
    branch: Optional[str] = None
    locker_number: Optional[str] = None
    weight: Optional[float] = None
    weight_unit: Optional[str] = "gram"
    purity: Optional[str] = None
    details: Dict[str, Any] = {}

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

class DigitalWillCreate(BaseModel):
    will_text: str
    beneficiaries: List[Dict[str, Any]] = []
    asset_distribution: Dict[str, Any] = {}

class DocumentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    file_type: str
    file_data: str
    file_size: int
    tags: List[str] = []
    share_with_nominee: bool = False

class UserPreferences(BaseModel):
    measurement_unit: str = "imperial"
    weight_unit: str = "ounce"

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
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        return None
    
    user_doc = await db.users.find_one({"id": session["user_id"]})
    if not user_doc:
        return None
    
    await db.users.update_one(
        {"id": session["user_id"]},
        {"$set": {"last_activity": datetime.now(timezone.utc).isoformat()}}
    )
    
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
    
    existing_user = await db.users.find_one({"email": session_data["email"]})
    
    if not existing_user:
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

# User Preferences
@api_router.put("/user/preferences")
async def update_preferences(prefs: UserPreferences, user: User = Depends(require_auth)):
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"measurement_unit": prefs.measurement_unit, "weight_unit": prefs.weight_unit}}
    )
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

@api_router.get("/assets/{asset_id}/loan-schedule")
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

# Digital Will Routes
@api_router.get("/will")
async def get_will(user: User = Depends(require_auth)):
    will = await db.digital_wills.find_one({"user_id": user.id}, {"_id": 0})
    if will:
        if isinstance(will.get('created_at'), str):
            will['created_at'] = datetime.fromisoformat(will['created_at'])
        if isinstance(will.get('updated_at'), str):
            will['updated_at'] = datetime.fromisoformat(will['updated_at'])
        return DigitalWill(**will)
    return None

@api_router.post("/will")
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

# Price API Routes
@api_router.get("/prices/crypto/{symbol}")
async def get_crypto_price(symbol: str, currency: str = "usd"):
    try:
        price_data = cg.get_price(ids=symbol.lower(), vs_currencies=currency)
        return {"symbol": symbol, "price": price_data[symbol.lower()][currency], "currency": currency}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch price: {str(e)}")

@api_router.get("/prices/gold")
async def get_gold_price(currency: str = "USD", unit: str = "gram"):
    try:
        base_prices = {
            "USD": {"gram": 65.0, "ounce": 2020.0},
            "INR": {"gram": 5400.0, "ounce": 167600.0},
            "EUR": {"gram": 60.0, "ounce": 1864.0},
            "GBP": {"gram": 52.0, "ounce": 1616.0}
        }
        price = base_prices.get(currency.upper(), base_prices["USD"])[unit]
        return {"metal": "gold", "price": price, "currency": currency, "unit": unit}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch gold price: {str(e)}")

@api_router.get("/prices/currency/{from_currency}/{to_currency}")
async def get_currency_conversion(from_currency: str, to_currency: str):
    try:
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
    asset_values = {}
    total_value_usd = 0.0
    
    for asset in assets:
        asset_type = asset["type"]
        asset_types[asset_type] = asset_types.get(asset_type, 0) + 1
        
        # Calculate value based on asset type
        value = 0
        if asset.get('current_price'):
            value = asset['current_price']
        elif asset.get('total_value'):
            value = asset['total_value']
        elif asset.get('quantity') and asset.get('unit_price'):
            value = asset['quantity'] * asset['unit_price']
        elif asset.get('area') and asset.get('price_per_area'):
            value = asset['area'] * asset['price_per_area']
        elif asset.get('weight') and asset.get('unit_price'):
            value = asset['weight'] * asset['unit_price']
        elif asset.get('principal_amount'):
            value = asset['principal_amount']
        
        currency = asset.get("purchase_currency", "USD")
        
        # Convert to USD
        if currency.upper() != "USD" and value > 0:
            try:
                conv_response = requests.get(
                    f"https://api.exchangerate-api.com/v4/latest/{currency.upper()}",
                    timeout=5
                )
                if conv_response.status_code == 200:
                    rate = conv_response.json()["rates"]["USD"]
                    value = value * rate
            except:
                pass
        
        total_value_usd += value
        asset_values[asset_type] = asset_values.get(asset_type, 0) + value
    
    return {
        "total_assets": total_assets,
        "asset_types": asset_types,
        "asset_values": asset_values,
        "total_value_usd": round(total_value_usd, 2),
        "has_nominee": await db.nominees.count_documents({"user_id": user.id}) > 0,
        "has_dms": await db.dead_man_switches.count_documents({"user_id": user.id}) > 0,
        "has_will": await db.digital_wills.count_documents({"user_id": user.id}) > 0
    }

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
