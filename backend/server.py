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
import stripe

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

cg = CoinGeckoAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Stripe configuration
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_placeholder')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "customer"  # admin, customer, readonly
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    measurement_unit: str = "imperial"  # imperial or metric
    weight_unit: str = "ounce"  # ounce or gram
    currency_format: str = "standard"  # standard or indian
    selected_currency: str = "USD"  # USD, INR, EUR, GBP, etc.
    default_currency: str = "USD"  # Default currency for new users
    default_asset_view: str = "grid"  # grid or table
    subscription_plan: str = "Free"  # Free, Pro, Family
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    marketing_consent: bool = False
    communication_consent: bool = True
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
    linked_asset_id: Optional[str] = None  # Link document to specific asset
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
    current_price_per_area: Optional[float] = None
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
    current_price_per_area: Optional[float] = None
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
    currency_format: Optional[str] = "standard"
    selected_currency: Optional[str] = "USD"
    default_currency: Optional[str] = "USD"
    default_asset_view: Optional[str] = "grid"
    marketing_consent: Optional[bool] = None
    communication_consent: Optional[bool] = None

class ScheduledMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    recipient_name: str
    recipient_email: str
    subject: str
    message: str
    send_date: str
    occasion: Optional[str] = None
    status: str = "scheduled"  # scheduled, sent, failed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScheduledMessageCreate(BaseModel):
    recipient_name: str
    recipient_email: str
    subject: str
    message: str
    send_date: str
    occasion: Optional[str] = None

class ExchangeConnection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    exchange_name: str  # binance, gemini, etoro, zerodha, robinhood
    provider_type: str  # crypto_exchange, stock_broker, bank
    api_key: str
    api_secret: Optional[str] = None
    is_active: bool = True
    last_synced: Optional[datetime] = None
    sync_status: str = "pending"  # pending, success, failed
    error_message: Optional[str] = None
    holdings: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExchangeConnectionCreate(BaseModel):
    exchange_name: str
    provider_type: str
    api_key: str
    api_secret: Optional[str] = None

class PortfolioHolding(BaseModel):
    """Individual holding within a portfolio asset"""
    symbol: str
    name: str
    quantity: float
    purchase_price: float
    purchase_date: str
    purchase_currency: str
    current_price: Optional[float] = None
    current_value: Optional[float] = None
    asset_type: str  # stock, crypto, bond, etc

class PortfolioAsset(BaseModel):
    """Portfolio/Exchange account with multiple holdings"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str = "portfolio"  # New asset type
    name: str
    provider_name: str  # Binance, Zerodha, Robinhood, etc
    provider_type: str  # crypto_exchange, stock_broker
    connection_id: Optional[str] = None  # Link to ExchangeConnection
    total_value: float = 0.0
    purchase_currency: str = "USD"
    holdings: List[PortfolioHolding] = []
    last_synced: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PortfolioAssetCreate(BaseModel):
    name: str
    provider_name: str
    provider_type: str
    connection_id: Optional[str] = None
    purchase_currency: Optional[str] = "USD"

class NetWorthSnapshot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    snapshot_date: str  # YYYY-MM-DD format
    total_assets: float
    total_liabilities: float
    net_worth: float
    currency: str
    asset_breakdown: Dict[str, float] = {}
    liability_breakdown: Dict[str, float] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NetWorthSnapshotCreate(BaseModel):
    snapshot_date: str
    currency: Optional[str] = "USD"

class AIInsight(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    portfolio_summary: str
    allocation_recommendations: List[str] = []
    risk_analysis: List[str] = []
    action_items: List[str] = []
    advantages: List[str] = []
    risks: List[str] = []
    asset_distribution_analysis: str = ""
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
class AIInsightResponse(BaseModel):
    portfolio_summary: str
    allocation_recommendations: List[str] = []
    risk_analysis: List[str] = []
    action_items: List[str] = []
    advantages: List[str] = []
    risks: List[str] = []
    asset_distribution_analysis: str = ""
    generated_at: Optional[str] = None

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: str
    action: str  # CREATE, UPDATE, DELETE, READ
    resource_type: str  # asset, document, user, settings, etc.
    resource_id: Optional[str] = None
    changes: Optional[dict] = None  # What changed
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_admin_action: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

async def require_admin(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
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
        # Check if this is the admin user
        is_admin = session_data["email"] == "shivu7sm@gmail.com"
        
        # Get system default currency from preferences (can be configured later)
        default_currency = os.environ.get('DEFAULT_CURRENCY', 'USD')
        
        user = User(
            email=session_data["email"],
            name=session_data["name"],
            picture=session_data.get("picture"),
            role="admin" if is_admin else "customer",
            default_currency=default_currency,
            selected_currency=default_currency
        )
        user_dict = user.model_dump()
        user_dict['last_activity'] = user_dict['last_activity'].isoformat()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)
        user_id = user.id
    else:
        user_id = existing_user["id"]
        # If existing user is the admin email but not marked as admin, update them
        if session_data["email"] == "shivu7sm@gmail.com" and existing_user.get("role") != "admin":
            await db.users.update_one(
                {"email": session_data["email"]},
                {"$set": {"role": "admin"}}
            )
    
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
async def create_asset(asset_data: AssetCreate, user: User = Depends(require_auth), request: Request = None):
    asset = Asset(user_id=user.id, **asset_data.model_dump())
    asset_dict = asset.model_dump()
    asset_dict['created_at'] = asset_dict['created_at'].isoformat()
    asset_dict['updated_at'] = asset_dict['updated_at'].isoformat()
    await db.assets.insert_one(asset_dict)
    
    # Log audit event
    await log_audit(user, "CREATE", "asset", asset.id, {"name": asset.name, "type": asset.type}, request)
    
    # Auto-create snapshot for purchase date if provided
    if asset.purchase_date:
        try:
            await create_snapshot_for_date(user.id, asset.purchase_date, asset.purchase_currency)
        except Exception as e:
            logger.warning(f"Failed to auto-create snapshot for asset purchase: {str(e)}")
    
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
    
    # Auto-create snapshot for purchase date if it changed
    old_purchase_date = existing.get('purchase_date')
    new_purchase_date = asset_data.purchase_date
    if new_purchase_date and new_purchase_date != old_purchase_date:
        try:
            await create_snapshot_for_date(user.id, new_purchase_date, asset_data.purchase_currency)
        except Exception as e:
            logger.warning(f"Failed to auto-create snapshot for asset update: {str(e)}")
    
    updated = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return Asset(**updated)

@api_router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, user: User = Depends(require_auth), request: Request = None):
    # Get asset name before deletion for logging
    asset = await db.assets.find_one({"id": asset_id, "user_id": user.id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    result = await db.assets.delete_one({"id": asset_id, "user_id": user.id})
    
    # Log audit event
    await log_audit(user, "DELETE", "asset", asset_id, {"name": asset.get("name"), "type": asset.get("type")}, request)
    
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

# Document Routes
@api_router.get("/documents")
async def get_documents(user: User = Depends(require_auth)):
    documents = await db.documents.find({"user_id": user.id}, {"_id": 0, "file_data": 0}).to_list(1000)
    for doc in documents:
        if isinstance(doc.get('created_at'), str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
        if isinstance(doc.get('updated_at'), str):
            doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    return documents

@api_router.get("/documents/{doc_id}")
async def get_document(doc_id: str, user: User = Depends(require_auth)):
    document = await db.documents.find_one({"id": doc_id, "user_id": user.id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if isinstance(document.get('created_at'), str):
        document['created_at'] = datetime.fromisoformat(document['created_at'])
    if isinstance(document.get('updated_at'), str):
        document['updated_at'] = datetime.fromisoformat(document['updated_at'])
    return document

@api_router.post("/documents")
async def create_document(doc_data: DocumentCreate, user: User = Depends(require_auth)):
    document = Document(user_id=user.id, **doc_data.model_dump())
    doc_dict = document.model_dump()
    doc_dict['created_at'] = doc_dict['created_at'].isoformat()
    doc_dict['updated_at'] = doc_dict['updated_at'].isoformat()
    await db.documents.insert_one(doc_dict)
    
    # Return without file_data for list view
    doc_dict.pop('file_data')
    doc_dict['created_at'] = datetime.fromisoformat(doc_dict['created_at'])
    doc_dict['updated_at'] = datetime.fromisoformat(doc_dict['updated_at'])
    return doc_dict

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user: User = Depends(require_auth)):
    result = await db.documents.delete_one({"id": doc_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True}

@api_router.put("/documents/{document_id}/link-asset")
async def link_document_to_asset(document_id: str, asset_data: dict, user: User = Depends(require_auth)):
    """Link a document to an asset"""
    asset_id = asset_data.get("asset_id")
    
    # Verify document exists and belongs to user
    document = await db.documents.find_one({"id": document_id, "user_id": user.id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # If asset_id provided, verify it exists and belongs to user
    if asset_id:
        asset = await db.assets.find_one({"id": asset_id, "user_id": user.id})
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
    
    # Update document with linked asset
    result = await db.documents.update_one(
        {"id": document_id},
        {"$set": {"linked_asset_id": asset_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to link document")
    
    return {"success": True, "message": "Document linked successfully"}

@api_router.get("/assets/{asset_id}/documents")
async def get_asset_documents(asset_id: str, user: User = Depends(require_auth)):
    """Get all documents linked to a specific asset"""
    # Verify asset belongs to user
    asset = await db.assets.find_one({"id": asset_id, "user_id": user.id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    documents = await db.documents.find(
        {"user_id": user.id, "linked_asset_id": asset_id},
        {"_id": 0}
    ).to_list(100)
    
    # Convert datetime fields
    for doc in documents:
        if isinstance(doc.get('created_at'), str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
        if isinstance(doc.get('updated_at'), str):
            doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    
    return documents

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
# Helper function to calculate current asset value in its original currency
def calculate_asset_current_value(asset: Dict[str, Any]) -> float:
    """
    Calculate the CURRENT value of an asset in its original currency.
    Prioritizes current values over purchase values.
    """
    value = 0.0
    
    # Priority 1: Explicit current values
    if asset.get('current_total_value'):
        value = float(asset['current_total_value'])
    elif asset.get('current_price'):
        value = float(asset['current_price'])
    # Priority 2: Calculated current values (quantity/weight/area * current_unit_price)
    elif asset.get('quantity') and asset.get('current_unit_price'):
        value = float(asset['quantity']) * float(asset['current_unit_price'])
    elif asset.get('area') and asset.get('current_price_per_area'):
        value = float(asset['area']) * float(asset['current_price_per_area'])
    elif asset.get('weight') and asset.get('current_unit_price'):
        value = float(asset['weight']) * float(asset['current_unit_price'])
    # Priority 3: Fall back to purchase values if no current value
    elif asset.get('total_value'):
        value = float(asset['total_value'])
    elif asset.get('quantity') and asset.get('unit_price'):
        value = float(asset['quantity']) * float(asset['unit_price'])
    elif asset.get('area') and asset.get('price_per_area'):
        value = float(asset['area']) * float(asset['price_per_area'])
    elif asset.get('weight') and asset.get('unit_price'):
        value = float(asset['weight']) * float(asset['unit_price'])
    # Priority 4: Loans/debts
    elif asset.get('outstanding_balance'):
        value = float(asset['outstanding_balance'])
    elif asset.get('principal_amount'):
        value = float(asset['principal_amount'])
    
    return value

# Helper function to convert currency
def convert_currency(amount: float, from_currency: str, to_currency: str) -> float:
    """Convert amount from one currency to another using live exchange rates."""
    if from_currency.upper() == to_currency.upper():
        return amount
    
    if amount == 0:
        return 0.0
    
    try:
        response = requests.get(
            f"https://api.exchangerate-api.com/v4/latest/{from_currency.upper()}",
            timeout=5
        )
        if response.status_code == 200:
            rate = response.json()["rates"].get(to_currency.upper(), 1.0)
            return amount * rate
    except:
        logger.warning(f"Currency conversion failed: {from_currency} to {to_currency}")
    
    return amount  # Return original if conversion fails

@api_router.get("/dashboard/summary")
async def get_dashboard_summary(user: User = Depends(require_auth), target_currency: str = "USD"):
    """
    Get dashboard summary with all values converted to target currency.
    This ensures consistent calculation across the app.
    """
    assets = await db.assets.find({"user_id": user.id}).to_list(1000)
    
    # Define liability types
    liability_types = {'loan', 'credit_card'}
    
    # Define liquid asset types
    liquid_asset_types = {'bank', 'crypto', 'stock'}
    
    total_assets_count = len(assets)
    asset_types = {}
    asset_values = {}
    total_assets_value = 0.0
    total_liabilities_value = 0.0
    asset_values_separate = {}
    liability_values_separate = {}
    liquid_assets_value = 0.0
    diversification_count = 0
    
    # Validation tracking
    individual_values = []
    
    for asset in assets:
        asset_type = asset["type"]
        asset_types[asset_type] = asset_types.get(asset_type, 0) + 1
        is_liability = asset_type in liability_types
        
        # Calculate current value in original currency
        value_in_original_currency = calculate_asset_current_value(asset)
        original_currency = asset.get("purchase_currency", "USD")
        
        # Convert to target currency
        value_in_target_currency = convert_currency(
            value_in_original_currency, 
            original_currency, 
            target_currency
        )
        
        # Track for validation
        individual_values.append({
            "name": asset.get("name", "Unknown"),
            "type": asset_type,
            "original_value": value_in_original_currency,
            "original_currency": original_currency,
            "converted_value": value_in_target_currency,
            "target_currency": target_currency,
            "is_liability": is_liability
        })
        
        # Separate assets and liabilities
        if is_liability:
            total_liabilities_value += value_in_target_currency
            liability_values_separate[asset_type] = liability_values_separate.get(asset_type, 0) + value_in_target_currency
            asset_values[asset_type] = asset_values.get(asset_type, 0) - value_in_target_currency
        else:
            total_assets_value += value_in_target_currency
            asset_values_separate[asset_type] = asset_values_separate.get(asset_type, 0) + value_in_target_currency
            asset_values[asset_type] = asset_values.get(asset_type, 0) + value_in_target_currency
            
            # Track liquid assets
            if asset_type in liquid_asset_types:
                liquid_assets_value += value_in_target_currency
    
    net_worth = total_assets_value - total_liabilities_value
    
    # Count unique asset types for diversification
    diversification_count = len([at for at in asset_types.keys() if at not in liability_types])
    
    # Calculate Financial Ratios
    financial_ratios = {}
    
    # 1. Debt-to-Asset Ratio (lower is better, <0.3 is good)
    if total_assets_value > 0:
        debt_to_asset = total_liabilities_value / total_assets_value
        financial_ratios["debt_to_asset_ratio"] = {
            "value": round(debt_to_asset * 100, 1),
            "display": f"{round(debt_to_asset * 100, 1)}%",
            "status": "good" if debt_to_asset < 0.3 else ("warning" if debt_to_asset < 0.5 else "bad"),
            "description": "Debt as % of total assets"
        }
    else:
        financial_ratios["debt_to_asset_ratio"] = {
            "value": 0,
            "display": "0%",
            "status": "good",
            "description": "Debt as % of total assets"
        }
    
    # 2. Liquidity Ratio (higher is better, >1.5 is good)
    if total_liabilities_value > 0:
        liquidity_ratio = liquid_assets_value / total_liabilities_value
        financial_ratios["liquidity_ratio"] = {
            "value": round(liquidity_ratio, 2),
            "display": f"{round(liquidity_ratio, 2)}x",
            "status": "good" if liquidity_ratio >= 1.5 else ("warning" if liquidity_ratio >= 1.0 else "bad"),
            "description": "Liquid assets to cover debts"
        }
    else:
        financial_ratios["liquidity_ratio"] = {
            "value": 999,
            "display": "∞",
            "status": "good",
            "description": "Liquid assets to cover debts"
        }
    
    # 3. Net Worth Growth Rate (get last snapshot for comparison)
    snapshots = await db.networth_snapshots.find(
        {"user_id": user.id}
    ).sort("snapshot_date", -1).limit(2).to_list(2)
    
    if len(snapshots) >= 2:
        latest_nw = snapshots[0]["net_worth"]
        previous_nw = snapshots[1]["net_worth"]
        if previous_nw > 0:
            growth_rate = ((latest_nw - previous_nw) / abs(previous_nw)) * 100
            financial_ratios["net_worth_growth"] = {
                "value": round(growth_rate, 1),
                "display": f"{'+' if growth_rate >= 0 else ''}{round(growth_rate, 1)}%",
                "status": "good" if growth_rate > 0 else ("warning" if growth_rate >= -5 else "bad"),
                "description": "Net worth change since last snapshot"
            }
        else:
            financial_ratios["net_worth_growth"] = {
                "value": 0,
                "display": "N/A",
                "status": "neutral",
                "description": "Net worth change since last snapshot"
            }
    else:
        financial_ratios["net_worth_growth"] = {
            "value": 0,
            "display": "N/A",
            "status": "neutral",
            "description": "Net worth change since last snapshot"
        }
    
    # 4. Diversification Score (0-100, higher is better)
    max_diversification = 8  # Ideal number of asset types
    diversification_score = min(100, (diversification_count / max_diversification) * 100)
    financial_ratios["diversification_score"] = {
        "value": round(diversification_score, 0),
        "display": f"{round(diversification_score, 0)}/100",
        "status": "good" if diversification_score >= 60 else ("warning" if diversification_score >= 30 else "bad"),
        "description": f"Portfolio spread across {diversification_count} asset types"
    }
    
    # 5. Emergency Fund Ratio (3-6 months expenses is ideal)
    # Assume monthly expenses = 30% of net worth or 10% of liquid assets as proxy
    estimated_monthly_expenses = liquid_assets_value * 0.1 if liquid_assets_value > 0 else 1000
    emergency_fund_months = liquid_assets_value / estimated_monthly_expenses if estimated_monthly_expenses > 0 else 0
    financial_ratios["emergency_fund_ratio"] = {
        "value": round(emergency_fund_months, 1),
        "display": f"{round(emergency_fund_months, 1)} months",
        "status": "good" if emergency_fund_months >= 3 else ("warning" if emergency_fund_months >= 1 else "bad"),
        "description": "Liquid assets coverage"
    }
    
    # 6. Debt Service Coverage (higher is better, >1.5 is good)
    # Calculate based on liquid assets vs total liabilities
    if total_liabilities_value > 0:
        dscr = (liquid_assets_value * 0.15) / (total_liabilities_value * 0.05)  # Assume 15% liquid income, 5% debt payment
        financial_ratios["debt_service_coverage"] = {
            "value": round(dscr, 2),
            "display": f"{round(dscr, 2)}x",
            "status": "good" if dscr >= 1.5 else ("warning" if dscr >= 1.0 else "bad"),
            "description": "Ability to service debt obligations"
        }
    else:
        financial_ratios["debt_service_coverage"] = {
            "value": 999,
            "display": "N/A",
            "status": "good",
            "description": "Ability to service debt obligations"
        }
    
    # Validation checks
    calculated_sum = sum([v["converted_value"] * (1 if not v["is_liability"] else -1) for v in individual_values])
    if abs(calculated_sum - net_worth) > 0.01:
        logger.error(f"Net worth calculation mismatch! Calculated: {calculated_sum}, Reported: {net_worth}")
    
    # Check for unrealistic values
    if net_worth > 100000000:  # $100M threshold
        logger.warning(f"Unusually high net worth detected: {net_worth} {target_currency} for user {user.id}")
    
    return {
        "total_assets": total_assets_count,
        "asset_types": asset_types,
        "asset_values": asset_values,
        "asset_values_separate": asset_values_separate,
        "liability_values_separate": liability_values_separate,
        "total_assets_value": round(total_assets_value, 2),
        "total_liabilities_value": round(total_liabilities_value, 2),
        "net_worth": round(net_worth, 2),
        "currency": target_currency,
        "total_value_usd": round(net_worth, 2) if target_currency == "USD" else round(convert_currency(net_worth, target_currency, "USD"), 2),
        "has_nominee": await db.nominees.count_documents({"user_id": user.id}) > 0,
        "has_dms": await db.dead_man_switches.count_documents({"user_id": user.id}) > 0,
        "has_will": await db.digital_wills.count_documents({"user_id": user.id}) > 0,
        "financial_ratios": financial_ratios,
        # Debug info (remove in production)
        "validation": {
            "individual_count": len(individual_values),
            "calculated_sum": round(calculated_sum, 2)
        }
    }

# User Preferences Routes
@api_router.put("/user/preferences")
async def update_preferences(prefs: UserPreferences, user: User = Depends(require_auth)):
    update_data = {k: v for k, v in prefs.model_dump().items() if v is not None}
    await db.users.update_one(
        {"id": user.id},
        {"$set": update_data}
    )
    return {"success": True}

@api_router.get("/user/preferences")
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

# Subscription Routes
@api_router.get("/subscription/current")
async def get_subscription(user: User = Depends(require_auth)):
    return {
        "plan": getattr(user, 'subscription_plan', 'Free'),
        "stripe_customer_id": getattr(user, 'stripe_customer_id', None),
        "stripe_subscription_id": getattr(user, 'stripe_subscription_id', None),
        "features": []
    }

async def get_stripe_price_for_plan(plan: str):
    """Fetch the price ID for a given plan from Stripe product."""
    try:
        product_id = os.environ.get('STRIPE_PRODUCT_ID')
        if not product_id:
            # Fallback to old method with direct price IDs
            if plan == 'Pro':
                return os.environ.get('STRIPE_PRICE_PRO')
            elif plan == 'Family':
                return os.environ.get('STRIPE_PRICE_FAMILY')
            else:
                raise HTTPException(status_code=400, detail="Invalid plan")
        
        # Fetch all prices for the product
        prices = stripe.Price.list(product=product_id, active=True, limit=10)
        
        # Map plan names to price amounts (in cents)
        plan_amounts = {
            'Pro': 999,      # $9.99
            'Family': 2499   # $24.99
        }
        
        target_amount = plan_amounts.get(plan)
        if not target_amount:
            raise HTTPException(status_code=400, detail="Invalid plan")
        
        # Find matching price
        for price in prices.data:
            if price.unit_amount == target_amount and price.currency == 'usd':
                return price.id
        
        # If no match found, raise error
        raise HTTPException(status_code=400, detail=f"No price found for {plan} plan")
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error fetching prices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscription prices")

@api_router.post("/subscription/create-checkout-session")
async def create_checkout_session(data: Dict[str, Any], user: User = Depends(require_auth)):
    try:
        plan = data.get('plan')
        
        # Get price ID based on plan (with dynamic fetching from product)
        price_id = await get_stripe_price_for_plan(plan)
        
        # Create or retrieve Stripe customer
        stripe_customer_id = getattr(user, 'stripe_customer_id', None)
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.name,
                metadata={"user_id": user.id}
            )
            stripe_customer_id = customer.id
            await db.users.update_one(
                {"id": user.id},
                {"$set": {"stripe_customer_id": stripe_customer_id}}
            )
        
        # Create checkout session
        frontend_url = os.environ.get('CORS_ORIGINS', '').split(',')[0] or 'http://localhost:3000'
        session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            mode='subscription',
            line_items=[{'price': price_id, 'quantity': 1}],
            success_url=f"{frontend_url}/subscription?success=true",
            cancel_url=f"{frontend_url}/subscription?canceled=true",
            metadata={"user_id": user.id, "plan": plan}
        )
        
        return {"sessionId": session.id, "url": session.url}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/subscription/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle events
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata']['user_id']
        plan = session['metadata']['plan']
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "subscription_plan": plan,
                "stripe_subscription_id": session.get('subscription')
            }}
        )
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        await db.users.update_one(
            {"stripe_subscription_id": subscription['id']},
            {"$set": {"subscription_plan": "Free", "stripe_subscription_id": None}}
        )
    
    return {"status": "success"}

@api_router.post("/subscription/cancel")
async def cancel_subscription(user: User = Depends(require_auth)):
    try:
        subscription_id = getattr(user, 'stripe_subscription_id', None)
        
        # If no subscription ID, user might be on Free plan or subscription was already reset
        if not subscription_id:
            # Reset to Free plan just in case
            await db.users.update_one(
                {"id": user.id},
                {"$set": {"subscription_plan": "Free"}, "$unset": {"stripe_customer_id": "", "stripe_subscription_id": ""}}
            )
            return {"success": True, "message": "Already on Free plan"}
        
        # Cancel subscription in Stripe
        try:
            stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)
        except stripe.error.InvalidRequestError as e:
            # Subscription doesn't exist in Stripe, clean up local DB
            logger.warning(f"Subscription {subscription_id} not found in Stripe, cleaning up: {str(e)}")
            await db.users.update_one(
                {"id": user.id},
                {"$set": {"subscription_plan": "Free"}, "$unset": {"stripe_customer_id": "", "stripe_subscription_id": ""}}
            )
            return {"success": True, "message": "Subscription reset to Free plan"}
        
        await db.users.update_one(
            {"id": user.id},
            {"$set": {"subscription_status": "canceling"}}
        )
        
        return {"success": True, "message": "Subscription will be canceled at period end"}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/subscription/reactivate")
async def reactivate_subscription(user: User = Depends(require_auth)):
    try:
        subscription_id = getattr(user, 'stripe_subscription_id', None)
        if not subscription_id:
            raise HTTPException(status_code=400, detail="No subscription to reactivate")
        
        # Reactivate subscription in Stripe
        stripe.Subscription.modify(subscription_id, cancel_at_period_end=False)
        
        await db.users.update_one(
            {"id": user.id},
            {"$set": {"subscription_status": "active"}}
        )
        
        return {"success": True, "message": "Subscription reactivated"}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Scheduled Messages Routes
@api_router.get("/scheduled-messages", response_model=List[ScheduledMessage])
async def get_scheduled_messages(user: User = Depends(require_auth)):
    messages = await db.scheduled_messages.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    return messages

@api_router.post("/scheduled-messages", response_model=ScheduledMessage)
async def create_scheduled_message(msg_data: ScheduledMessageCreate, user: User = Depends(require_auth)):
    message = ScheduledMessage(user_id=user.id, **msg_data.model_dump())
    msg_dict = message.model_dump()
    msg_dict['created_at'] = msg_dict['created_at'].isoformat()
    await db.scheduled_messages.insert_one(msg_dict)
    return message

@api_router.delete("/scheduled-messages/{message_id}")
async def delete_scheduled_message(message_id: str, user: User = Depends(require_auth)):
    result = await db.scheduled_messages.delete_one({"id": message_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"success": True}

# AI Insights Routes
@api_router.get("/insights/latest")
async def get_latest_insight(user: User = Depends(require_auth)):
    """Get the most recent AI insight for the user."""
    insight = await db.ai_insights.find_one(
        {"user_id": user.id},
        {"_id": 0}
    , sort=[("generated_at", -1)])
    
    if not insight:
        return None
    
    if isinstance(insight.get('generated_at'), str):
        insight['generated_at'] = datetime.fromisoformat(insight['generated_at'])
    
    # Convert datetime back to string for response
    if isinstance(insight.get('generated_at'), datetime):
        insight['generated_at'] = insight['generated_at'].isoformat()
    
    return AIInsightResponse(**insight)

@api_router.post("/insights/generate", response_model=AIInsightResponse)
async def generate_insights(user: User = Depends(require_auth)):
    """Generate fresh AI insights and store them."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Fetch user's assets
        assets = await db.assets.find({"user_id": user.id}).to_list(1000)
        
        if not assets:
            basic_insight = AIInsight(
                user_id=user.id,
                portfolio_summary="No assets found in your portfolio yet.",
                allocation_recommendations=[],
                risk_analysis=[],
                action_items=["Start by adding your first asset to get personalized insights."],
                advantages=[],
                risks=[],
                asset_distribution_analysis=""
            )
            
            insight_dict = basic_insight.model_dump()
            insight_dict['generated_at'] = insight_dict['generated_at'].isoformat()
            await db.ai_insights.insert_one(insight_dict)
            
            # Convert datetime to string for response
            response_data = basic_insight.model_dump()
            if isinstance(response_data.get('generated_at'), datetime):
                response_data['generated_at'] = response_data['generated_at'].isoformat()
            
            return AIInsightResponse(**response_data)
        
        # Calculate portfolio summary with proper currency conversion
        asset_types = {}
        liability_types = {'loan', 'credit_card'}
        total_assets_value = 0
        total_liabilities_value = 0
        
        # Get user's preferred currency
        target_currency = user.selected_currency or "USD"
        
        for asset in assets:
            asset_type = asset['type']
            asset_types[asset_type] = asset_types.get(asset_type, 0) + 1
            
            # Calculate value in original currency
            value_in_original_currency = calculate_asset_current_value(asset)
            original_currency = asset.get("purchase_currency", "USD")
            
            # Convert to target currency
            value_in_target_currency = convert_currency(
                value_in_original_currency,
                original_currency,
                target_currency
            )
            
            if asset_type in liability_types:
                total_liabilities_value += value_in_target_currency
            else:
                total_assets_value += value_in_target_currency
        
        net_worth = total_assets_value - total_liabilities_value
        
        # Create detailed portfolio context for AI
        asset_distribution_str = ", ".join([f"{k}: {v} items" for k, v in asset_types.items()])
        
        portfolio_context = f"""Analyze this investment portfolio and provide structured insights:

Portfolio Overview:
- Total Assets Value: {target_currency} {total_assets_value:,.2f}
- Total Liabilities: {target_currency} {total_liabilities_value:,.2f}
- Net Worth: {target_currency} {net_worth:,.2f}
- Currency: {target_currency}
- Asset Distribution: {asset_distribution_str}
- Total number of assets/liabilities: {len(assets)}

Please provide a comprehensive analysis in the following structure:

1. PORTFOLIO SUMMARY (2-3 sentences about overall health and composition)

2. ASSET DISTRIBUTION ANALYSIS (Brief analysis of how assets are distributed and if diversification is adequate)

3. ALLOCATION RECOMMENDATIONS (List 4-5 specific, actionable recommendations)

4. ADVANTAGES (List 3-4 positive aspects or strengths of this portfolio)

5. RISKS (List 3-4 potential risks or concerns, focusing on concentration, liquidity, or market risks)

6. ACTION ITEMS (List 4-5 concrete next steps the user should take)

Format your response clearly with these section headers."""
        
        # Initialize AI chat
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=f"insights_{user.id}_{datetime.now(timezone.utc).timestamp()}",
            system_message="You are an expert financial advisor specializing in portfolio analysis, asset allocation, and risk management. Provide clear, actionable, and personalized recommendations based on the user's portfolio composition. Focus on asset distribution, investment diversification, and identifying both opportunities and risks."
        ).with_model("openai", "gpt-4o-mini")
        
        # Send message
        user_message = UserMessage(text=portfolio_context)
        response = await chat.send_message(user_message)
        
        # Parse AI response into structured sections
        sections = {
            "summary": "",
            "distribution": "",
            "recommendations": [],
            "advantages": [],
            "risks": [],
            "actions": []
        }
        
        current_section = None
        lines = response.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect section headers
            upper_line = line.upper()
            if "PORTFOLIO SUMMARY" in upper_line or "SUMMARY" in upper_line:
                current_section = "summary"
                continue
            elif "DISTRIBUTION" in upper_line or "ASSET DISTRIBUTION" in upper_line:
                current_section = "distribution"
                continue
            elif "ALLOCATION" in upper_line or "RECOMMENDATION" in upper_line:
                current_section = "recommendations"
                continue
            elif "ADVANTAGE" in upper_line or "STRENGTH" in upper_line:
                current_section = "advantages"
                continue
            elif "RISK" in upper_line or "CONCERN" in upper_line:
                current_section = "risks"
                continue
            elif "ACTION" in upper_line or "NEXT STEP" in upper_line:
                current_section = "actions"
                continue
            
            # Add content to appropriate section
            if current_section == "summary":
                sections["summary"] += line + " "
            elif current_section == "distribution":
                sections["distribution"] += line + " "
            elif current_section in ["recommendations", "advantages", "risks", "actions"]:
                # Remove bullet points and numbering
                cleaned = line.lstrip('-*•123456789.').strip()
                if cleaned:
                    sections[current_section].append(cleaned)
        
        # Create insight object
        insight = AIInsight(
            user_id=user.id,
            portfolio_summary=sections["summary"].strip() or f"Portfolio net worth: ${net_worth:,.2f} across {len(assets)} holdings with diverse asset types.",
            asset_distribution_analysis=sections["distribution"].strip() or f"Your portfolio includes {len(asset_types)} different asset types: {asset_distribution_str}.",
            allocation_recommendations=sections["recommendations"][:5] or [
                "Consider diversifying across multiple asset classes",
                "Maintain adequate emergency fund in liquid assets",
                "Review portfolio allocation quarterly",
                "Balance growth assets with stable income generators"
            ],
            advantages=sections["advantages"][:4] or [
                "Diverse asset ownership tracked in one place",
                "Clear visibility of net worth",
                "Comprehensive financial overview"
            ],
            risks=sections["risks"][:4] or [
                "Monitor concentration risk in specific asset types",
                "Consider liquidity needs for emergency situations",
                "Stay aware of market volatility impact"
            ],
            action_items=sections["actions"][:5] or [
                "Update current valuations for all assets",
                "Review and rebalance portfolio quarterly",
                "Set up automatic tracking for market-linked assets",
                "Consider tax optimization strategies"
            ],
            risk_analysis=sections["risks"][:4] or []  # For backward compatibility
        )
        
        # Store in database
        insight_dict = insight.model_dump()
        insight_dict['generated_at'] = insight_dict['generated_at'].isoformat()
        await db.ai_insights.insert_one(insight_dict)
        
        # Convert datetime to string for response
        response_data = insight.model_dump()
        if isinstance(response_data.get('generated_at'), datetime):
            response_data['generated_at'] = response_data['generated_at'].isoformat()
        
        return AIInsightResponse(**response_data)
    except Exception as e:
        logger.error(f"AI insights generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

# Currency Conversion Routes
@api_router.get("/prices/currency/{from_currency}/{to_currency}")
async def get_currency_rate(from_currency: str, to_currency: str):
    if from_currency == to_currency:
        return {"rate": 1.0}
    
    try:
        response = requests.get(
            f"https://api.exchangerate-api.com/v4/latest/{from_currency.upper()}",
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            rate = data["rates"].get(to_currency.upper(), 1.0)
            return {"rate": rate}
    except:
        pass
    
    return {"rate": 1.0}

# Exchange Connection Routes
@api_router.get("/exchange-connections")
async def get_exchange_connections(user: User = Depends(require_auth)):
    connections = await db.exchange_connections.find({"user_id": user.id}, {"_id": 0, "api_key": 0, "api_secret": 0}).to_list(100)
    return connections

@api_router.post("/exchange-connections")
async def create_exchange_connection(conn_data: ExchangeConnectionCreate, user: User = Depends(require_auth)):
    connection = ExchangeConnection(user_id=user.id, **conn_data.model_dump())
    conn_dict = connection.model_dump()
    conn_dict['created_at'] = conn_dict['created_at'].isoformat()
    if conn_dict.get('last_synced'):
        conn_dict['last_synced'] = conn_dict['last_synced'].isoformat()
    await db.exchange_connections.insert_one(conn_dict)
    return {"success": True, "id": connection.id}

@api_router.post("/exchange-connections/{conn_id}/sync")
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

@api_router.delete("/exchange-connections/{conn_id}")
async def delete_exchange_connection(conn_id: str, user: User = Depends(require_auth)):
    result = await db.exchange_connections.delete_one({"id": conn_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"success": True}

# Portfolio Asset Routes
@api_router.get("/portfolio-assets")
async def get_portfolio_assets(user: User = Depends(require_auth)):
    """Get all portfolio assets for the user"""
    portfolios = await db.portfolio_assets.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    return portfolios

@api_router.post("/portfolio-assets")
async def create_portfolio_asset(portfolio_data: PortfolioAssetCreate, user: User = Depends(require_auth)):
    """Create a new portfolio asset"""
    portfolio = PortfolioAsset(user_id=user.id, **portfolio_data.model_dump())
    portfolio_dict = portfolio.model_dump()
    portfolio_dict['created_at'] = portfolio_dict['created_at'].isoformat()
    portfolio_dict['updated_at'] = portfolio_dict['updated_at'].isoformat()
    if portfolio_dict.get('last_synced'):
        portfolio_dict['last_synced'] = portfolio_dict['last_synced'].isoformat()
    
    await db.portfolio_assets.insert_one(portfolio_dict)
    return {"success": True, "id": portfolio.id}

@api_router.get("/portfolio-assets/{portfolio_id}")
async def get_portfolio_asset(portfolio_id: str, user: User = Depends(require_auth)):
    """Get a specific portfolio with all holdings"""
    portfolio = await db.portfolio_assets.find_one({"id": portfolio_id, "user_id": user.id}, {"_id": 0})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio

@api_router.post("/portfolio-assets/{portfolio_id}/holdings")
async def add_holding_to_portfolio(portfolio_id: str, holding: PortfolioHolding, user: User = Depends(require_auth)):
    """Add a holding to a portfolio"""
    portfolio = await db.portfolio_assets.find_one({"id": portfolio_id, "user_id": user.id})
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    holding_dict = holding.model_dump()
    
    # Calculate current value if current_price is provided
    if holding.current_price:
        holding_dict['current_value'] = holding.quantity * holding.current_price
    
    await db.portfolio_assets.update_one(
        {"id": portfolio_id, "user_id": user.id},
        {
            "$push": {"holdings": holding_dict},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    # Recalculate total portfolio value
    await recalculate_portfolio_value(portfolio_id, user.id)
    
    return {"success": True}

@api_router.put("/portfolio-assets/{portfolio_id}/holdings/{symbol}")
async def update_holding(portfolio_id: str, symbol: str, holding: PortfolioHolding, user: User = Depends(require_auth)):
    """Update a specific holding in a portfolio"""
    holding_dict = holding.model_dump()
    
    if holding.current_price:
        holding_dict['current_value'] = holding.quantity * holding.current_price
    
    await db.portfolio_assets.update_one(
        {"id": portfolio_id, "user_id": user.id, "holdings.symbol": symbol},
        {
            "$set": {
                "holdings.$": holding_dict,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    await recalculate_portfolio_value(portfolio_id, user.id)
    
    return {"success": True}

@api_router.delete("/portfolio-assets/{portfolio_id}/holdings/{symbol}")
async def delete_holding(portfolio_id: str, symbol: str, user: User = Depends(require_auth)):
    """Delete a holding from a portfolio"""
    await db.portfolio_assets.update_one(
        {"id": portfolio_id, "user_id": user.id},
        {
            "$pull": {"holdings": {"symbol": symbol}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    await recalculate_portfolio_value(portfolio_id, user.id)
    
    return {"success": True}

@api_router.delete("/portfolio-assets/{portfolio_id}")
async def delete_portfolio_asset(portfolio_id: str, user: User = Depends(require_auth)):
    """Delete an entire portfolio"""
    result = await db.portfolio_assets.delete_one({"id": portfolio_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return {"success": True}

async def recalculate_portfolio_value(portfolio_id: str, user_id: str):
    """Recalculate the total value of a portfolio based on holdings"""
    portfolio = await db.portfolio_assets.find_one({"id": portfolio_id, "user_id": user_id})
    if not portfolio:
        return
    
    total_value = 0.0
    for holding in portfolio.get("holdings", []):
        if holding.get("current_value"):
            total_value += holding["current_value"]
        elif holding.get("current_price"):
            total_value += holding["quantity"] * holding["current_price"]
        else:
            total_value += holding["quantity"] * holding["purchase_price"]
    
    await db.portfolio_assets.update_one(
        {"id": portfolio_id, "user_id": user_id},
        {"$set": {"total_value": total_value}}
    )

# Helper function to log audit events
async def log_audit(user: User, action: str, resource_type: str, resource_id: str = None, 
                   changes: dict = None, request: Request = None):
    """Log an audit event."""
    try:
        ip_address = None
        user_agent = None
        
        if request:
            # Get IP from X-Forwarded-For or X-Real-IP headers (from proxy) or direct connection
            ip_address = request.headers.get("X-Forwarded-For", request.headers.get("X-Real-IP", request.client.host if request.client else None))
            user_agent = request.headers.get("User-Agent")
        
        audit_log = AuditLog(
            user_id=user.id,
            user_email=user.email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent,
            is_admin_action=(user.role == "admin")
        )
        
        log_dict = audit_log.model_dump()
        log_dict['timestamp'] = log_dict['timestamp'].isoformat()
        
        await db.audit_logs.insert_one(log_dict)
    except Exception as e:
        # Don't fail the main operation if audit logging fails
        logger.error(f"Failed to log audit event: {str(e)}")

# Helper function to create snapshot for a specific date
async def create_snapshot_for_date(user_id: str, snapshot_date: str, currency: str = "USD"):
    """
    Helper function to create a net worth snapshot for a specific date.
    IMPORTANT: Only includes assets purchased ON or BEFORE the snapshot date for accurate historical tracking.
    """
    # Get all assets for this user
    all_assets = await db.assets.find({"user_id": user_id}).to_list(1000)
    
    # Filter assets: only include those purchased on or before the snapshot date
    assets = []
    for asset in all_assets:
        purchase_date = asset.get("purchase_date")
        if purchase_date:
            # Only include if purchase_date <= snapshot_date
            if purchase_date <= snapshot_date:
                assets.append(asset)
        else:
            # Include assets without purchase date (assume they existed)
            assets.append(asset)
    
    # Define liability types
    liability_types = {'loan', 'credit_card'}
    
    total_assets_value = 0.0
    total_liabilities_value = 0.0
    asset_breakdown = {}
    liability_breakdown = {}
    
    for asset in assets:
        asset_type = asset["type"]
        is_liability = asset_type in liability_types
        
        # Calculate value in original currency
        value_in_original_currency = calculate_asset_current_value(asset)
        original_currency = asset.get("purchase_currency", "USD")
        
        # Convert to target currency
        value_in_target_currency = convert_currency(
            value_in_original_currency, 
            original_currency, 
            currency
        )
        
        # Separate assets and liabilities
        if is_liability:
            total_liabilities_value += value_in_target_currency
            liability_breakdown[asset_type] = liability_breakdown.get(asset_type, 0) + value_in_target_currency
        else:
            total_assets_value += value_in_target_currency
            asset_breakdown[asset_type] = asset_breakdown.get(asset_type, 0) + value_in_target_currency
    
    net_worth = total_assets_value - total_liabilities_value
    
    snapshot = NetWorthSnapshot(
        user_id=user_id,
        snapshot_date=snapshot_date,
        total_assets=total_assets_value,
        total_liabilities=total_liabilities_value,
        net_worth=net_worth,
        currency=currency,
        asset_breakdown=asset_breakdown,
        liability_breakdown=liability_breakdown
    )
    
    snap_dict = snapshot.model_dump()
    snap_dict['created_at'] = snap_dict['created_at'].isoformat()
    
    # Upsert - update if snapshot for this date exists, create if not
    await db.networth_snapshots.update_one(
        {"user_id": user_id, "snapshot_date": snapshot_date},
        {"$set": snap_dict},
        upsert=True
    )
    
    return snapshot

# Net Worth Snapshot Routes
@api_router.post("/networth/snapshot")
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

@api_router.get("/networth/history")
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

@api_router.get("/networth/trends")
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

@api_router.post("/networth/backfill")
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

# Admin Routes
@api_router.get("/admin/stats")
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

@api_router.get("/admin/users")
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

@api_router.put("/admin/users/{user_id}/role")
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

@api_router.get("/admin/jobs/scheduled-messages")
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

@api_router.get("/admin/jobs/dms-reminders")
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

@api_router.delete("/admin/users/{user_id}")
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

@api_router.get("/admin/audit-logs")
async def get_audit_logs(
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

@api_router.get("/admin/subscription-analytics")
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

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
