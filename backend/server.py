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

# Import scheduler functions
from scheduler import start_scheduler, stop_scheduler

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
    default_asset_view: str = "table"  # grid or table - DEFAULT TO TABLE
    subscription_plan: str = "Free"  # Free, Pro, Family
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    marketing_consent: bool = False
    communication_consent: bool = True
    demo_mode: bool = True  # Toggle between live and demo data - DEFAULT TO DEMO
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
    priority: int = 1  # Priority for contact order (1 = highest priority)
    access_granted: bool = False  # Whether nominee has been granted access
    access_type: str = "after_dms"  # 'after_dms', 'immediate', or 'temporary'
    access_token: Optional[str] = None  # Secure token for nominee login
    access_token_created_at: Optional[datetime] = None
    access_expires_at: Optional[datetime] = None  # For temporary access
    last_accessed_at: Optional[datetime] = None
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
    priority: int = 1
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
    linked_asset_id: Optional[str] = None

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

# Income & Expense Models
class MonthlyIncome(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    month: str  # YYYY-MM format
    source: str  # "salary", "business", "freelance", "rental", "investment", "other"
    description: str
    amount_before_tax: float
    tax_deducted: float = 0.0
    amount_after_tax: float
    currency: str = "USD"
    payment_date: Optional[str] = None  # YYYY-MM-DD
    notes: Optional[str] = None
    recurring: bool = True  # Is this a recurring income?
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MonthlyIncomeCreate(BaseModel):
    month: str
    source: str
    description: str
    amount_before_tax: float
    tax_deducted: Optional[float] = 0.0
    currency: Optional[str] = "USD"
    payment_date: Optional[str] = None
    notes: Optional[str] = None
    recurring: Optional[bool] = True

class MonthlyIncomeUpdate(BaseModel):
    source: Optional[str] = None
    description: Optional[str] = None
    amount_before_tax: Optional[float] = None
    tax_deducted: Optional[float] = None
    currency: Optional[str] = None
    payment_date: Optional[str] = None
    notes: Optional[str] = None
    recurring: Optional[bool] = None

class MonthlyExpense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    month: str  # YYYY-MM format
    category: str  # From predefined categories
    subcategory: Optional[str] = None
    description: str
    amount: float
    currency: str = "USD"
    payment_method: Optional[str] = None  # "cash", "credit_card", "debit_card", "upi", "bank_transfer"
    payment_date: Optional[str] = None  # YYYY-MM-DD
    is_recurring: bool = False
    is_essential: bool = True
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MonthlyExpenseCreate(BaseModel):
    month: str
    category: str
    subcategory: Optional[str] = None
    description: str
    amount: float
    currency: Optional[str] = "USD"
    payment_method: Optional[str] = None
    payment_date: Optional[str] = None
    is_recurring: Optional[bool] = False
    is_essential: Optional[bool] = True
    notes: Optional[str] = None

class MonthlyExpenseUpdate(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    payment_method: Optional[str] = None
    payment_date: Optional[str] = None
    is_recurring: Optional[bool] = None
    is_essential: Optional[bool] = None
    notes: Optional[str] = None

class MonthlySummary(BaseModel):
    month: str
    total_income_before_tax: float
    total_tax_deducted: float
    total_income_after_tax: float
    total_expenses: float
    net_savings: float
    savings_rate: float  # Percentage
    currency: str
    income_by_source: Dict[str, float] = {}
    expenses_by_category: Dict[str, float] = {}

# Tax & Wealth Blueprint Models
class Instrument80C(BaseModel):
    type: str
    annual_contribution: float
    lock_in_years: Optional[int] = None

class TaxProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Employment & Income
    employment_status: str  # salaried_private, salaried_govt, self_employed, freelancer, retired
    annual_gross_income: float
    monthly_net_income: Optional[float] = None
    tax_regime: str  # old, new, undecided
    residential_status: str = "resident"  # resident, nri, rnor
    
    # Family Structure
    marital_status: str  # single, married_earning, married_non_earning, divorced
    children_count: int = 0
    children_age_groups: List[str] = []
    dependent_parents: str = "none"  # none, one_senior, two_senior, disabled
    
    # Financial Goals
    primary_goals: List[str] = []
    goal_time_horizon: str = "long"  # short, medium, long, retirement
    risk_appetite: str = "moderate"  # conservative, moderate, aggressive
    
    # Current 80C Status
    current_80c_investment: float = 0
    existing_80c_instruments: List[Instrument80C] = []
    
    # Health Insurance (80D)
    health_insurance_self: float = 0
    health_insurance_parents: float = 0
    
    # Other Deductions
    home_loan_principal: float = 0
    home_loan_interest: float = 0
    education_loan_interest: float = 0
    donations_80g: float = 0
    nps_additional: float = 0
    
    # Additional Income
    rental_income: float = 0
    capital_gains: float = 0
    other_income: float = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaxProfileCreate(BaseModel):
    employment_status: str
    annual_gross_income: float
    monthly_net_income: Optional[float] = None
    tax_regime: str
    residential_status: str = "resident"
    marital_status: str
    children_count: int = 0
    children_age_groups: List[str] = []
    dependent_parents: str = "none"
    primary_goals: List[str] = []
    goal_time_horizon: str = "long"
    risk_appetite: str = "moderate"
    current_80c_investment: float = 0
    existing_80c_instruments: List[Dict[str, Any]] = []
    health_insurance_self: float = 0
    health_insurance_parents: float = 0
    home_loan_principal: float = 0
    home_loan_interest: float = 0
    education_loan_interest: float = 0
    donations_80g: float = 0
    nps_additional: float = 0
    rental_income: float = 0
    capital_gains: float = 0
    other_income: float = 0

class InstrumentRecommendation(BaseModel):
    instrument: str
    suggested_amount: float
    rationale: str
    expected_return: float
    risk_level: str
    monthly_sip: float
    tax_saved: float
    action: str

class HiddenSIPOpportunity(BaseModel):
    expense_category: str
    current_monthly_spend: float
    recommended_reduction: float
    reduction_percentage: float
    hidden_sip_amount: float
    wealth_projection_1yr: float
    wealth_projection_5yr: float
    wealth_projection_10yr: float
    behavioral_tips: List[str]
    action: str

class PriorityAction(BaseModel):
    rank: int
    action: str
    impact: str
    effort: str
    expected_saving: float
    time_to_complete: str

class TaxBlueprint(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    financial_year: str
    
    # Tax Analysis
    estimated_tax_liability: float
    current_tax_saved: float
    section_80c_max_limit: float = 150000
    section_80c_utilized: float
    section_80c_gap: float
    section_80c_recommendations: List[InstrumentRecommendation] = []
    
    # Other Deductions
    section_80d_opportunity: float = 0
    section_80e_opportunity: float = 0
    section_24b_opportunity: float = 0
    section_80ccd1b_opportunity: float = 0
    total_tax_saving_opportunity: float
    
    # Expense Optimization
    hidden_sip_opportunities: List[HiddenSIPOpportunity] = []
    total_hidden_sip_potential: float = 0
    
    # Wealth Projection
    current_monthly_savings: float
    optimized_monthly_savings: float
    projected_wealth_1yr: float
    projected_wealth_3yr: float
    projected_wealth_5yr: float
    projected_wealth_10yr: float
    projected_wealth_20yr: float = 0
    
    # AI Recommendations
    priority_actions: List[PriorityAction] = []
    ai_summary: str
    confidence_score: float = 0
    
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=30))

class RegimeComparison(BaseModel):
    old_regime_tax: float
    old_regime_deductions: float
    old_regime_final_tax: float
    new_regime_tax: float
    new_regime_final_tax: float
    recommended_regime: str
    tax_saving_difference: float
    rationale: str

# Auth Helper
async def get_current_user(request: Request) -> Optional[User]:
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        # Log for debugging - check if cookies are being sent
        cookies_present = list(request.cookies.keys())
        logger.debug(f"No session token found. Cookies present: {cookies_present}")
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
    logger.info(f"Auth session request received, session_id present: {bool(session_id)}")
    
    if not session_id:
        logger.error("No session ID provided in request")
        raise HTTPException(status_code=400, detail="Session ID required")
    
    try:
        auth_backend_url = os.environ.get('AUTH_BACKEND_URL', 'https://demobackend.emergentagent.com')
        logger.info(f"Validating session with auth backend: {auth_backend_url}")
        auth_response = requests.get(
            f"{auth_backend_url}/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10
        )
        auth_response.raise_for_status()
        session_data = auth_response.json()
        logger.info(f"Session validated for email: {session_data.get('email')}")
    except Exception as e:
        logger.error(f"Failed to validate session: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to validate session: {str(e)}")
    
    existing_user = await db.users.find_one({"email": session_data["email"]})
    
    if not existing_user:
        # Check if this is the admin user
        admin_email = os.environ.get('ADMIN_EMAIL', 'shivu7sm@gmail.com')
        is_admin = session_data["email"] == admin_email
        
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
        
        # Auto-seed demo data for new users (since demo_mode defaults to True)
        await seed_demo_data(user_id)
    else:
        user_id = existing_user["id"]
        # If existing user is the admin email but not marked as admin, update them
        if session_data["email"] == os.environ.get('ADMIN_EMAIL', 'shivu7sm@gmail.com') and existing_user.get("role") != "admin":
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
    
    # Detect if request came through HTTPS (via ingress/load balancer)
    # Check multiple headers that might indicate HTTPS
    forwarded_proto = request.headers.get("X-Forwarded-Proto", "")
    forwarded_ssl = request.headers.get("X-Forwarded-Ssl", "")
    
    # Determine if HTTPS based on headers or environment
    is_https = (
        forwarded_proto.lower() == "https" or
        forwarded_ssl.lower() == "on" or
        os.environ.get("ENVIRONMENT") == "production" or
        request.url.scheme == "https"
    )
    
    # For cross-domain auth (zivinc.com -> legacy-asset-dev.emergent.host),
    # we MUST use secure=True and samesite="none"
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,  # Always True for production cross-domain cookies
        samesite="none",  # Required for cross-origin cookies
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    logger.info(f"Session created for user {user_id}, cookie set (secure=True, samesite=none, proto={forwarded_proto or 'none'})")
    
    # Also return token in response body as fallback for browsers that block third-party cookies
    return {
        "success": True,
        "session_token": session_token,  # Client can store this and send via Authorization header
        "user": {
            "id": user_id,
            "email": existing_user["email"],
            "name": existing_user.get("name", "")
        }
    }

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
    # Filter based on demo mode
    demo_prefix = f"demo_{user.id}_"
    if user.demo_mode:
        # Show only demo data
        assets = await db.assets.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }, {"_id": 0}).to_list(1000)
    else:
        # Show only live data (exclude demo data)
        assets = await db.assets.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }, {"_id": 0}).to_list(1000)
    
    for asset in assets:
        if isinstance(asset.get('created_at'), str):
            asset['created_at'] = datetime.fromisoformat(asset['created_at'])
        if isinstance(asset.get('updated_at'), str):
            asset['updated_at'] = datetime.fromisoformat(asset['updated_at'])
    return assets

@api_router.post("/assets", response_model=Asset)
async def create_asset(asset_data: AssetCreate, user: User = Depends(require_auth), request: Request = None):
    # Check subscription limits - exclude demo assets from count
    plan = getattr(user, 'subscription_plan', 'Free')
    features = SUBSCRIPTION_FEATURES.get(plan, SUBSCRIPTION_FEATURES["Free"])
    
    if features["max_assets"] > 0:
        # Only count LIVE assets (non-demo) for limit
        demo_prefix = f"demo_{user.id}_"
        current_count = await db.assets.count_documents({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        })
        if current_count >= features["max_assets"]:
            raise HTTPException(
                status_code=403,
                detail=f"Asset limit reached. Your {plan} plan allows {features['max_assets']} live assets. Upgrade to add more or delete some assets."
            )
    
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
@api_router.get("/nominees", response_model=List[Nominee])
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

@api_router.get("/nominee", response_model=Optional[Nominee])
async def get_nominee(user: User = Depends(require_auth)):
    """Legacy endpoint - returns first nominee for backward compatibility"""
    nominee = await db.nominees.find_one({"user_id": user.id}, {"_id": 0}, sort=[("priority", 1)])
    if nominee:
        if isinstance(nominee.get('created_at'), str):
            nominee['created_at'] = datetime.fromisoformat(nominee['created_at'])
        return Nominee(**nominee)
    return None

@api_router.post("/nominees", response_model=Nominee)
async def create_nominee(nominee_data: NomineeCreate, user: User = Depends(require_auth)):
    """Create a new nominee"""
    nominee = Nominee(user_id=user.id, **nominee_data.model_dump())
    nominee_dict = nominee.model_dump()
    nominee_dict['created_at'] = nominee_dict['created_at'].isoformat()
    await db.nominees.insert_one(nominee_dict)
    return nominee

@api_router.put("/nominees/{nominee_id}", response_model=Nominee)
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

@api_router.delete("/nominees/{nominee_id}")
async def delete_nominee(nominee_id: str, user: User = Depends(require_auth)):
    """Delete a nominee"""
    result = await db.nominees.delete_one({"id": nominee_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nominee not found")
    return {"success": True}

@api_router.post("/nominee", response_model=Nominee)
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
@api_router.post("/nominees/{nominee_id}/generate-access")
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

@api_router.post("/nominees/{nominee_id}/revoke-access")
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

@api_router.put("/nominees/{nominee_id}/access-type")
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
@api_router.post("/nominee/auth")
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

@api_router.get("/nominee/dashboard")
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

@api_router.get("/nominees/my-accesses")
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
    # Filter based on demo mode
    demo_prefix = f"demo_{user.id}_"
    if user.demo_mode:
        # Show only demo documents
        documents = await db.documents.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }, {"_id": 0, "file_data": 0}).to_list(1000)
    else:
        # Show only live documents (exclude demo)
        documents = await db.documents.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }, {"_id": 0, "file_data": 0}).to_list(1000)
    
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
    # Check subscription limits
    plan = getattr(user, 'subscription_plan', 'Free')
    features = SUBSCRIPTION_FEATURES.get(plan, SUBSCRIPTION_FEATURES["Free"])
    
    # Check document count limit
    if features["max_documents"] > 0:
        current_count = await db.documents.count_documents({"user_id": user.id})
        if current_count >= features["max_documents"]:
            raise HTTPException(
                status_code=403,
                detail=f"Document limit reached. Your {plan} plan allows {features['max_documents']} documents. Upgrade to add more."
            )
    
    # Check storage limit
    storage_bytes = await get_user_storage_usage(user.id)
    storage_mb = storage_bytes / (1024 * 1024)
    new_file_mb = doc_data.file_size / (1024 * 1024)
    
    if features["storage_mb"] > 0:
        if (storage_mb + new_file_mb) > features["storage_mb"]:
            raise HTTPException(
                status_code=403,
                detail=f"Storage limit exceeded. Your {plan} plan allows {features['storage_mb']} MB. Current: {storage_mb:.1f} MB, New file: {new_file_mb:.1f} MB. Upgrade for more storage."
            )
    
    document = Document(user_id=user.id, **doc_data.model_dump())
    doc_dict = document.model_dump()
    doc_dict['created_at'] = doc_dict['created_at'].isoformat()
    doc_dict['updated_at'] = doc_dict['updated_at'].isoformat()
    await db.documents.insert_one(doc_dict)
    
    # Fetch the document back without _id and file_data
    created_doc = await db.documents.find_one(
        {"id": document.id, "user_id": user.id},
        {"_id": 0, "file_data": 0}
    )
    
    if created_doc:
        # Convert datetime strings back to datetime objects for response
        if isinstance(created_doc.get('created_at'), str):
            created_doc['created_at'] = datetime.fromisoformat(created_doc['created_at'])
        if isinstance(created_doc.get('updated_at'), str):
            created_doc['updated_at'] = datetime.fromisoformat(created_doc['updated_at'])
        return created_doc
    
    raise HTTPException(status_code=500, detail="Failed to create document")

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
    Includes both individual assets and portfolio holdings.
    FILTERS BY DEMO MODE.
    """
    # Filter based on demo mode
    demo_prefix = f"demo_{user.id}_"
    if user.demo_mode:
        # Show only demo data
        assets = await db.assets.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }).to_list(1000)
        portfolios = await db.portfolio_assets.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }).to_list(1000)
    else:
        # Show only live data (exclude demo data)
        assets = await db.assets.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }).to_list(1000)
        portfolios = await db.portfolio_assets.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }).to_list(1000)
    
    # Define liability types
    liability_types = {'loan', 'credit_card'}
    
    # Define liquid asset types (portfolios are also liquid since they contain stocks/crypto)
    liquid_asset_types = {'bank', 'crypto', 'stock', 'portfolio'}
    
    total_assets_count = len(assets)
    total_portfolios_count = len(portfolios)
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
    
    # Process individual assets
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
    
    # Process portfolio assets
    for portfolio in portfolios:
        portfolio_type = "portfolio"
        portfolio_currency = portfolio.get("purchase_currency", "USD")
        portfolio_value_original = portfolio.get("total_value", 0.0)
        
        # Convert portfolio value to target currency
        portfolio_value_converted = convert_currency(
            portfolio_value_original,
            portfolio_currency,
            target_currency
        )
        
        # Track portfolio in asset types and values
        asset_types[portfolio_type] = asset_types.get(portfolio_type, 0) + 1
        total_assets_value += portfolio_value_converted
        asset_values_separate[portfolio_type] = asset_values_separate.get(portfolio_type, 0) + portfolio_value_converted
        asset_values[portfolio_type] = asset_values.get(portfolio_type, 0) + portfolio_value_converted
        
        # Portfolios are liquid assets
        liquid_assets_value += portfolio_value_converted
        
        # Track for validation
        individual_values.append({
            "name": portfolio.get("name", "Unknown Portfolio"),
            "type": portfolio_type,
            "original_value": portfolio_value_original,
            "original_currency": portfolio_currency,
            "converted_value": portfolio_value_converted,
            "target_currency": target_currency,
            "is_liability": False
        })
    
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
    
    # 3. Net Worth Growth Rate (compare current net worth with last snapshot)
    snapshots = await db.networth_snapshots.find(
        {"user_id": user.id}
    ).sort("snapshot_date", -1).limit(1).to_list(1)
    
    if len(snapshots) >= 1:
        previous_snapshot_nw = snapshots[0]["net_worth"]
        current_nw = net_worth
        
        if abs(previous_snapshot_nw) > 0:
            growth_rate = ((current_nw - previous_snapshot_nw) / abs(previous_snapshot_nw)) * 100
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
        "total_portfolios": total_portfolios_count,
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
            "calculated_sum": round(calculated_sum, 2),
            "includes_portfolios": total_portfolios_count > 0
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

# Audit Log Routes
@api_router.get("/audit/logs")
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

@api_router.delete("/audit/logs/cleanup")
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


# Demo Mode Routes
@api_router.get("/demo/status")
async def get_demo_status(user: User = Depends(require_auth)):
    """Get current demo mode status and test account access"""
    # Check if user has access to universal test account
    test_account_access = None
    if user.demo_mode:
        # In demo mode, users get automatic access to test account
        test_account_access = {
            "account_id": "test_account_universal",
            "account_name": "AssetVault Demo Portfolio",
            "access_type": "demo_preview"
        }
    
    return {
        "demo_mode": user.demo_mode,
        "test_account_access": test_account_access
    }

@api_router.post("/demo/toggle")
async def toggle_demo_mode(user: User = Depends(require_auth)):
    """Toggle between live and demo mode"""
    new_mode = not user.demo_mode
    
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"demo_mode": new_mode}}
    )
    
    # If switching to demo mode, ensure demo data exists
    if new_mode:
        await seed_demo_data(user.id)
    
    return {
        "demo_mode": new_mode,
        "message": f"Switched to {'Demo' if new_mode else 'Live'} mode"
    }

@api_router.post("/demo/reseed")
async def reseed_demo_data(user: User = Depends(require_auth)):
    """Force reseed demo data - useful after updates"""
    demo_prefix = f"demo_{user.id}_"
    
    # Delete all existing demo data
    await db.assets.delete_many({"user_id": user.id, "id": {"$regex": f"^{demo_prefix}"}})
    await db.portfolio_assets.delete_many({"user_id": user.id, "id": {"$regex": f"^{demo_prefix}"}})
    await db.documents.delete_many({"user_id": user.id, "id": {"$regex": f"^{demo_prefix}"}})
    await db.scheduled_messages.delete_many({"user_id": user.id, "id": {"$regex": f"^{demo_prefix}"}})
    await db.digital_wills.delete_many({"user_id": user.id, "demo_mode": True})
    await db.nominees.delete_many({"user_id": user.id, "id": {"$regex": f"^{demo_prefix}"}})
    
    # Reseed
    await seed_demo_data(user.id, force=True)
    
    return {"success": True, "message": "Demo data reseeded successfully"}

@api_router.get("/demo/test-account-assets")
async def get_test_account_assets(user: User = Depends(require_auth)):
    """Get assets from universal test account - only accessible in demo mode"""
    if not user.demo_mode:
        raise HTTPException(status_code=403, detail="Test account only accessible in demo mode")
    
    # Fetch test account assets
    test_account_id = "test_account_universal"
    
    # Get test account assets - exclude _id
    assets = await db.assets.find({
        "user_id": test_account_id
    }, {"_id": 0}).to_list(1000)
    
    portfolios = await db.portfolio_assets.find({
        "user_id": test_account_id
    }, {"_id": 0}).to_list(1000)
    
    return {
        "account_id": test_account_id,
        "account_name": "AssetVault Demo Portfolio",
        "account_owner": "Demo Account Holder",
        "assets": assets,
        "portfolios": portfolios,
        "access_type": "readonly_demo"
    }

async def seed_demo_data(user_id: str, force: bool = False):
    """Create comprehensive demo data for user with realistic values"""
    demo_prefix = f"demo_{user_id}_"
    
    # Check if demo data already exists (skip if not forcing)
    if not force:
        existing_demo = await db.assets.find_one({"user_id": user_id, "id": {"$regex": f"^{demo_prefix}"}})
        if existing_demo:
            return  # Demo data already exists
    
    # Demo Assets - Expanded with more realistic data
    demo_assets = [
        # Bank Accounts
        {
            "id": f"{demo_prefix}bank1",
            "user_id": user_id,
            "name": "Chase Checking Account",
            "type": "bank",
            "purchase_currency": "USD",
            "purchase_date": "2023-01-15",
            "total_value": 15000,
            "current_value": 15000,
            "details": {
                "account_number": "****1234",
                "bank_name": "Chase Bank",
                "account_type": "Checking"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}bank2",
            "user_id": user_id,
            "name": "Savings Account - Emergency Fund",
            "type": "bank",
            "purchase_currency": "USD",
            "purchase_date": "2022-06-10",
            "total_value": 45000,
            "current_value": 45000,
            "details": {
                "account_number": "****5678",
                "bank_name": "Bank of America",
                "account_type": "Savings"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}bank3",
            "user_id": user_id,
            "name": "Wells Fargo Money Market",
            "type": "bank",
            "purchase_currency": "USD",
            "purchase_date": "2023-03-01",
            "total_value": 28000,
            "current_value": 28500,
            "details": {
                "account_number": "****9012",
                "bank_name": "Wells Fargo",
                "account_type": "Money Market"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}bank4",
            "user_id": user_id,
            "name": "HSBC UK Savings Account",
            "type": "bank",
            "purchase_currency": "GBP",
            "purchase_date": "2023-02-20",
            "total_value": 18000,
            "current_value": 18500,
            "details": {
                "account_number": "****7890",
                "bank_name": "HSBC UK",
                "account_type": "Savings"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Crypto
        {
            "id": f"{demo_prefix}crypto1",
            "user_id": user_id,
            "name": "Bitcoin Holdings",
            "type": "crypto",
            "symbol": "BTC",
            "purchase_currency": "USD",
            "purchase_date": "2023-03-20",
            "quantity": 0.75,
            "unit_price": 40000,
            "current_unit_price": 95000,
            "total_value": 30000,
            "current_value": 71250,
            "details": {
                "wallet_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                "crypto_type": "BTC"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}crypto2",
            "user_id": user_id,
            "name": "Ethereum Holdings",
            "type": "crypto",
            "symbol": "ETH",
            "purchase_currency": "USD",
            "purchase_date": "2023-05-15",
            "quantity": 8,
            "unit_price": 2200,
            "current_unit_price": 3500,
            "total_value": 17600,
            "current_value": 28000,
            "details": {
                "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                "crypto_type": "ETH"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}crypto3",
            "user_id": user_id,
            "name": "Solana Holdings - EUR Account",
            "type": "crypto",
            "symbol": "SOL",
            "purchase_currency": "EUR",
            "purchase_date": "2023-09-10",
            "quantity": 100,
            "unit_price": 20,
            "current_unit_price": 110,
            "total_value": 2000,
            "current_value": 11000,
            "details": {
                "wallet_address": "SoL9x1...AbC123",
                "crypto_type": "SOL"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Stocks
        {
            "id": f"{demo_prefix}stock1",
            "user_id": user_id,
            "name": "Apple Inc.",
            "type": "stock",
            "symbol": "AAPL",
            "purchase_currency": "USD",
            "purchase_date": "2023-02-15",
            "quantity": 150,
            "unit_price": 150,
            "current_unit_price": 230,
            "total_value": 22500,
            "current_value": 34500,
            "details": {
                "ticker": "AAPL",
                "broker": "Robinhood"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}stock2",
            "user_id": user_id,
            "name": "Tesla Inc.",
            "type": "stock",
            "symbol": "TSLA",
            "purchase_currency": "USD",
            "purchase_date": "2023-06-20",
            "quantity": 50,
            "unit_price": 250,
            "current_unit_price": 380,
            "total_value": 12500,
            "current_value": 19000,
            "details": {
                "ticker": "TSLA",
                "broker": "E*TRADE"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}stock3",
            "user_id": user_id,
            "name": "Microsoft Corporation",
            "type": "stock",
            "symbol": "MSFT",
            "purchase_currency": "USD",
            "purchase_date": "2022-11-10",
            "quantity": 80,
            "unit_price": 280,
            "current_unit_price": 425,
            "total_value": 22400,
            "current_value": 34000,
            "details": {
                "ticker": "MSFT",
                "broker": "Fidelity"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Real Estate
        {
            "id": f"{demo_prefix}property1",
            "user_id": user_id,
            "name": "Family Home - Austin, TX",
            "type": "property",
            "purchase_currency": "USD",
            "purchase_date": "2020-05-10",
            "area": 2500,
            "area_unit": "sqft",
            "price_per_area": 160,
            "current_price_per_area": 220,
            "total_value": 400000,
            "current_value": 550000,
            "location": {
                "address": "123 Oak Street, Austin, TX 78701",
                "lat": "",
                "lng": ""
            },
            "details": {
                "property_type": "Residential",
                "area": 2500,
                "price_per_area": 160,
                "current_price_per_area": 220,
                "location": "Austin, TX"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}property2",
            "user_id": user_id,
            "name": "Rental Property - Miami",
            "type": "property",
            "purchase_currency": "USD",
            "purchase_date": "2021-08-15",
            "area": 1200,
            "area_unit": "sqft",
            "price_per_area": 180,
            "current_price_per_area": 210,
            "total_value": 216000,
            "current_value": 252000,
            "location": {
                "address": "456 Beach Blvd, Miami, FL 33139",
                "lat": "",
                "lng": ""
            },
            "details": {
                "property_type": "Rental",
                "monthly_rental_income": 2800
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}property3",
            "user_id": user_id,
            "name": "London Apartment Investment",
            "type": "property",
            "purchase_currency": "GBP",
            "purchase_date": "2022-04-10",
            "area": 800,
            "area_unit": "sqft",
            "price_per_area": 600,
            "current_price_per_area": 720,
            "total_value": 480000,
            "current_value": 576000,
            "location": {
                "address": "Baker Street, London, UK",
                "lat": "",
                "lng": ""
            },
            "details": {
                "property_type": "Rental",
                "monthly_rental_income": 2500
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Investments
        {
            "id": f"{demo_prefix}investment1",
            "user_id": user_id,
            "name": "401(k) Retirement Fund",
            "type": "investment",
            "purchase_currency": "USD",
            "purchase_date": "2018-01-01",
            "total_value": 85000,
            "current_value": 125000,
            "details": {
                "investment_type": "401k",
                "provider": "Vanguard",
                "annual_contribution": 19500
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}investment2",
            "user_id": user_id,
            "name": "Roth IRA",
            "type": "investment",
            "purchase_currency": "USD",
            "purchase_date": "2019-03-15",
            "total_value": 32000,
            "current_value": 48000,
            "details": {
                "investment_type": "Roth IRA",
                "provider": "Fidelity",
                "annual_contribution": 6500
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Insurance
        {
            "id": f"{demo_prefix}insurance1",
            "user_id": user_id,
            "name": "Life Insurance Policy",
            "type": "insurance",
            "purchase_currency": "USD",
            "purchase_date": "2021-08-01",
            "total_value": 750000,
            "current_value": 750000,
            "details": {
                "policy_number": "LI-2021-12345",
                "provider": "State Farm",
                "policy_type": "Term Life",
                "premium": 150,
                "coverage_amount": 750000
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Precious Metals
        {
            "id": f"{demo_prefix}precious1",
            "user_id": user_id,
            "name": "Gold Bars",
            "type": "precious_metals",
            "purchase_currency": "USD",
            "purchase_date": "2022-11-05",
            "weight": 300,
            "weight_unit": "gram",
            "purity": "99.9%",
            "unit_price": 60,
            "current_unit_price": 70,
            "total_value": 18000,
            "current_value": 21000,
            "details": {
                "purity": "99.9%",
                "weight": "300g",
                "storage": "Bank Locker"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}precious2",
            "user_id": user_id,
            "name": "Silver Coins Collection",
            "type": "precious_metals",
            "purchase_currency": "USD",
            "purchase_date": "2023-04-20",
            "weight": 1000,
            "weight_unit": "gram",
            "purity": "92.5%",
            "unit_price": 0.75,
            "current_unit_price": 0.90,
            "total_value": 750,
            "current_value": 900,
            "details": {
                "purity": "92.5%",
                "weight": "1kg",
                "type": "American Eagle coins"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Liabilities
        {
            "id": f"{demo_prefix}loan1",
            "user_id": user_id,
            "name": "Home Mortgage",
            "type": "loan",
            "purchase_currency": "USD",
            "purchase_date": "2020-05-10",
            "principal_amount": 350000,
            "interest_rate": 3.5,
            "tenure_months": 360,
            "total_value": 350000,
            "current_value": 310000,
            "details": {
                "loan_type": "Mortgage",
                "bank_name": "Wells Fargo",
                "interest_rate": 3.5,
                "emi_amount": 1800,
                "tenure_months": 360,
                "remaining_months": 312
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}credit1",
            "user_id": user_id,
            "name": "Chase Sapphire Credit Card",
            "type": "credit_card",
            "purchase_currency": "USD",
            "purchase_date": "2023-01-01",
            "total_value": 5200,
            "current_value": 5200,
            "details": {
                "card_number": "****4321",
                "interest_rate": 18.99,
                "credit_limit": 25000,
                "min_payment": 150
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}loan2",
            "user_id": user_id,
            "name": "Car Loan - Tesla Model Y",
            "type": "loan",
            "purchase_currency": "USD",
            "purchase_date": "2023-07-01",
            "principal_amount": 55000,
            "interest_rate": 4.5,
            "tenure_months": 60,
            "total_value": 55000,
            "current_value": 48000,
            "details": {
                "loan_type": "Auto Loan",
                "bank_name": "Tesla Financing",
                "interest_rate": 4.5,
                "emi_amount": 1025,
                "tenure_months": 60,
                "remaining_months": 52
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # New Asset Types - Multi-country
        {
            "id": f"{demo_prefix}vehicle1",
            "user_id": user_id,
            "name": "Tesla Model Y - 2023",
            "type": "vehicle",
            "purchase_currency": "USD",
            "purchase_date": "2023-07-01",
            "total_value": 65000,
            "current_value": 52000,
            "details": {
                "make": "Tesla",
                "model": "Model Y",
                "year": 2023,
                "vin": "5YJ3E1EB8PF123456",
                "license_plate": "CAL-1234",
                "mileage": 12500
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}art1",
            "user_id": user_id,
            "name": "Contemporary Art Collection",
            "type": "art",
            "purchase_currency": "USD",
            "purchase_date": "2022-09-15",
            "total_value": 35000,
            "current_value": 42000,
            "details": {
                "artist": "Various Artists",
                "pieces": 5,
                "authenticated": True,
                "storage": "Climate-controlled vault"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}nft1",
            "user_id": user_id,
            "name": "Bored Ape NFT #4521",
            "type": "nft",
            "purchase_currency": "ETH",
            "purchase_date": "2023-04-12",
            "quantity": 1,
            "unit_price": 45,
            "current_unit_price": 38,
            "total_value": 45,
            "current_value": 38,
            "details": {
                "collection": "Bored Ape Yacht Club",
                "token_id": "4521",
                "blockchain": "Ethereum",
                "wallet": "0x742d35Cc..."
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Singapore Assets
        {
            "id": f"{demo_prefix}sg_bank1",
            "user_id": user_id,
            "name": "DBS Singapore Savings Account",
            "type": "bank",
            "purchase_currency": "SGD",
            "purchase_date": "2023-01-10",
            "total_value": 65000,
            "current_value": 66500,
            "details": {
                "account_number": "****3456",
                "bank_name": "DBS Bank",
                "account_type": "High-Yield Savings",
                "country": "Singapore"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}sg_property1",
            "user_id": user_id,
            "name": "Condo Unit - Marina Bay",
            "type": "property",
            "purchase_currency": "SGD",
            "purchase_date": "2021-06-20",
            "area": 1000,
            "area_unit": "sqft",
            "price_per_area": 1800,
            "current_price_per_area": 2100,
            "total_value": 1800000,
            "current_value": 2100000,
            "location": {
                "address": "Marina Bay Residences, Singapore",
                "lat": "",
                "lng": ""
            },
            "details": {
                "property_type": "Condominium",
                "country": "Singapore"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # India Assets
        {
            "id": f"{demo_prefix}india_fd1",
            "user_id": user_id,
            "name": "ICICI Bank Fixed Deposit",
            "type": "investment",
            "purchase_currency": "INR",
            "purchase_date": "2023-02-01",
            "total_value": 500000,
            "current_value": 525000,
            "details": {
                "investment_type": "Fixed Deposit",
                "provider": "ICICI Bank",
                "interest_rate": 7.5,
                "maturity_date": "2026-02-01",
                "country": "India"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}india_gold1",
            "user_id": user_id,
            "name": "Gold Jewelry Collection",
            "type": "precious_metals",
            "purchase_currency": "INR",
            "purchase_date": "2022-10-15",
            "weight": 500,
            "weight_unit": "gram",
            "purity": "22K",
            "unit_price": 5000,
            "current_unit_price": 6200,
            "total_value": 2500000,
            "current_value": 3100000,
            "details": {
                "purity": "22K",
                "storage": "Bank Locker - Mumbai",
                "country": "India"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Australia Assets
        {
            "id": f"{demo_prefix}au_stock1",
            "user_id": user_id,
            "name": "Commonwealth Bank Shares",
            "type": "stock",
            "symbol": "CBA.AX",
            "purchase_currency": "AUD",
            "purchase_date": "2023-03-20",
            "quantity": 200,
            "unit_price": 95,
            "current_unit_price": 108,
            "total_value": 19000,
            "current_value": 21600,
            "details": {
                "ticker": "CBA.AX",
                "broker": "CommSec",
                "country": "Australia"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}au_property1",
            "user_id": user_id,
            "name": "Investment Apartment - Sydney",
            "type": "property",
            "purchase_currency": "AUD",
            "purchase_date": "2022-05-10",
            "area": 900,
            "area_unit": "sqft",
            "price_per_area": 800,
            "current_price_per_area": 920,
            "total_value": 720000,
            "current_value": 828000,
            "location": {
                "address": "Darling Harbour, Sydney, Australia",
                "lat": "",
                "lng": ""
            },
            "details": {
                "property_type": "Apartment",
                "monthly_rental_income": 3200,
                "country": "Australia"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Mutual Funds
        {
            "id": f"{demo_prefix}mf1",
            "user_id": user_id,
            "name": "Vanguard S&P 500 Index Fund",
            "type": "mutual_fund",
            "purchase_currency": "USD",
            "purchase_date": "2022-01-15",
            "total_value": 45000,
            "current_value": 58000,
            "details": {
                "fund_name": "Vanguard S&P 500",
                "ticker": "VFIAX",
                "expense_ratio": 0.04,
                "country": "USA"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}india_mf1",
            "user_id": user_id,
            "name": "SBI Bluechip Fund",
            "type": "mutual_fund",
            "purchase_currency": "INR",
            "purchase_date": "2022-08-10",
            "total_value": 300000,
            "current_value": 385000,
            "details": {
                "fund_name": "SBI Bluechip Fund",
                "folio_number": "12345678",
                "units": 5000,
                "country": "India"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.assets.insert_many(demo_assets)
    
    # Demo Portfolio
    demo_portfolio_id = f"{demo_prefix}portfolio1"
    demo_portfolio = {
        "id": demo_portfolio_id,
        "user_id": user_id,
        "name": "Binance Trading Account",
        "provider_name": "binance",
        "provider_type": "crypto_exchange",
        "purchase_currency": "USD",
        "total_value": 22500,
        "holdings": [
            {
                "symbol": "BTC",
                "name": "Bitcoin",
                "quantity": 0.15,
                "purchase_price": 45000,
                "current_price": 95000,
                "purchase_date": "2023-06-15",
                "purchase_currency": "USD",
                "asset_type": "crypto"
            },
            {
                "symbol": "ETH",
                "name": "Ethereum",
                "quantity": 3.2,
                "purchase_price": 2000,
                "current_price": 3500,
                "purchase_date": "2023-07-20",
                "purchase_currency": "USD",
                "asset_type": "crypto"
            },
            {
                "symbol": "SOL",
                "name": "Solana",
                "quantity": 50,
                "purchase_price": 25,
                "current_price": 110,
                "purchase_date": "2023-08-10",
                "purchase_currency": "USD",
                "asset_type": "crypto"
            }
        ],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.portfolio_assets.insert_one(demo_portfolio)
    
    # Demo Documents - Linked to Assets
    demo_documents = [
        {
            "id": f"{demo_prefix}doc1",
            "user_id": user_id,
            "name": "Life Insurance Policy Document",
            "category": "insurance",
            "file_path": "demo/life_insurance_policy.pdf",
            "file_size": 2457600,  # 2.4 MB
            "mime_type": "application/pdf",
            "description": "State Farm Term Life Insurance Policy - $750,000 coverage",
            "linked_asset_id": f"{demo_prefix}insurance1",  # Link to insurance asset
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}doc2",
            "user_id": user_id,
            "name": "Home Deed - Austin Property",
            "category": "property",
            "file_path": "demo/home_deed_austin.pdf",
            "file_size": 1843200,  # 1.8 MB
            "mime_type": "application/pdf",
            "description": "Property deed for 123 Oak Street, Austin, TX",
            "linked_asset_id": f"{demo_prefix}property1",  # Link to property asset
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}doc3",
            "user_id": user_id,
            "name": "401k Statement Q4 2024",
            "category": "investment",
            "file_path": "demo/401k_statement_q4_2024.pdf",
            "file_size": 892800,  # 870 KB
            "mime_type": "application/pdf",
            "description": "Vanguard 401(k) quarterly statement",
            "linked_asset_id": f"{demo_prefix}investment1",  # Link to 401k asset
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}doc4",
            "user_id": user_id,
            "name": "Bank Statement - November 2024",
            "category": "bank",
            "file_path": "demo/bank_statement_nov_2024.pdf",
            "file_size": 512000,  # 500 KB
            "mime_type": "application/pdf",
            "description": "Chase Bank checking account statement",
            "linked_asset_id": f"{demo_prefix}bank1",  # Link to bank asset
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}doc5",
            "user_id": user_id,
            "name": "Car Title - Tesla Model Y",
            "category": "vehicle",
            "file_path": "demo/car_title_tesla.pdf",
            "file_size": 614400,  # 600 KB
            "mime_type": "application/pdf",
            "description": "Vehicle title and registration documents",
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.documents.insert_many(demo_documents)
    
    # Demo Digital Will
    demo_will = {
        "id": f"{demo_prefix}will1",
        "user_id": user_id,
        "demo_mode": True,  # Mark as demo data
        "will_text": """LAST WILL AND TESTAMENT

I, [Your Name], being of sound mind and memory, do hereby declare this to be my Last Will and Testament.

ARTICLE I: FAMILY
I am married to Jane Doe and have two children:
- John Doe Jr. (Son, age 15)
- Sarah Doe (Daughter, age 12)

ARTICLE II: EXECUTOR
I appoint Jane Doe as the Executor of this Will. If Jane Doe is unable or unwilling to serve, I appoint my brother, Michael Doe, as alternate Executor.

ARTICLE III: ASSETS DISTRIBUTION
1. Primary Residence (Austin, TX): To be transferred to Jane Doe
2. Rental Property (Miami, FL): To be held in trust for children until age 25
3. Investment Accounts (401k, IRA): To be split equally between Jane Doe and children's education trust
4. Cryptocurrency Holdings: 50% to Jane Doe, 50% to children's trust
5. Life Insurance Proceeds: To be deposited in children's education trust

ARTICLE IV: GUARDIANSHIP
If Jane Doe is unable to care for our minor children, I appoint my sister, Emily Doe, as their guardian.

ARTICLE V: TRUSTS
I establish an education trust for my children to be managed by Jane Doe until each child reaches age 25.

ARTICLE VI: DIGITAL ASSETS
All digital assets, online accounts, and cryptocurrency wallets should be accessed using my AssetVault account. Login credentials are held by my trusted executor.

ARTICLE VII: FINAL INSTRUCTIONS
- Funeral: Simple ceremony, no elaborate arrangements
- Cremation preferred
- Memorial donations to American Heart Association

This Will revokes all previous Wills and Codicils.

Signed: [Your Signature]
Date: November 15, 2024
Witnesses: [To be completed with legal counsel]

---
DEMO NOTE: This is sample demo content. Please consult with a legal professional to create your actual will.""",
        "beneficiaries": [
            {
                "name": "Jane Doe",
                "relationship": "Spouse",
                "allocation_percentage": 50,
                "details": "Primary beneficiary - receives 50% of estate"
            },
            {
                "name": "John Doe Jr.",
                "relationship": "Son",
                "allocation_percentage": 25,
                "details": "Secondary beneficiary - receives 25% held in trust until age 25"
            },
            {
                "name": "Sarah Doe",
                "relationship": "Daughter",
                "allocation_percentage": 25,
                "details": "Secondary beneficiary - receives 25% held in trust until age 25"
            }
        ],
        "asset_distribution": {
            "real_estate": "Primary residence to Jane Doe, Rental property held in children's trust",
            "investments": "401k and IRA split equally between Jane Doe and children's education trust",
            "cryptocurrency": "50% to Jane Doe, 50% to children's trust",
            "life_insurance": "Proceeds deposited in children's education trust"
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    existing_will = await db.digital_wills.find_one({"user_id": user_id, "demo_mode": True})
    if not existing_will:
        await db.digital_wills.insert_one(demo_will)
    
    # Demo Scheduled Messages
    demo_messages = [
        {
            "id": f"{demo_prefix}msg1",
            "user_id": user_id,
            "recipient_email": "jane.demo@example.com",
            "recipient_name": "Jane Doe",
            "subject": "Happy Anniversary, My Love! 💕",
            "message": """My Dearest Jane,

Happy Anniversary! If you're reading this, it means I've scheduled this message to reach you on our special day.

I want you to know how much you mean to me. Every year with you has been a blessing. Thank you for being my partner, my best friend, and the love of my life.

Remember our first date at that little Italian restaurant? You wore that blue dress, and I knew right then that I wanted to spend my life with you.

Here's to many more years together!

All my love,
[Your Name]""",
            "send_date": (datetime.now(timezone.utc) + timedelta(days=45)).isoformat(),
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}msg2",
            "user_id": user_id,
            "recipient_email": "john.jr.demo@example.com",
            "recipient_name": "John Doe Jr.",
            "subject": "Happy 16th Birthday, Son! 🎂",
            "message": """Dear John,

Happy 16th Birthday! You're officially old enough to drive now - scary thought for your old dad!

I'm so proud of the young man you're becoming. Your dedication to your studies and your kindness to others make me incredibly proud every day.

A few things I want you to remember as you grow:
- Always be honest, even when it's hard
- Treat everyone with respect
- Chase your dreams, but work hard for them
- Your family will always be there for you

Enjoy your special day!

Love,
Dad""",
            "send_date": (datetime.now(timezone.utc) + timedelta(days=120)).isoformat(),
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}msg3",
            "user_id": user_id,
            "recipient_email": "sarah.demo@example.com",
            "recipient_name": "Sarah Doe",
            "subject": "Graduation Day Message 🎓",
            "message": """My Sweet Sarah,

If you're reading this on your high school graduation day, I want you to know how incredibly proud I am of you!

Watching you grow from a little girl into this amazing young woman has been one of the greatest joys of my life. Your creativity, your compassion, and your determination inspire me every day.

As you head off to college and start this new chapter:
- Trust your instincts
- Don't be afraid to fail - that's how we learn
- Stay curious and keep asking questions
- Remember that home is always here for you

The world is lucky to have you. Go make your mark!

All my love,
Dad""",
            "send_date": (datetime.now(timezone.utc) + timedelta(days=1095)).isoformat(),  # ~3 years
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.scheduled_messages.insert_many(demo_messages)
    
    # Demo Nominees (keep existing)
    demo_nominees = [
        {
            "id": f"{demo_prefix}nominee1",
            "user_id": user_id,
            "name": "Jane Doe (Spouse)",
            "email": "jane.demo@example.com",
            "phone": "+1-555-0101",
            "relationship": "spouse",
            "priority": 1,
            "access_granted": True,  # Already has access in demo
            "access_type": "immediate",
            "access_token": f"nom_demo_{user_id}_jane",
            "access_token_created_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}nominee2",
            "user_id": user_id,
            "name": "John Doe Jr. (Son)",
            "email": "john.jr.demo@example.com",
            "phone": "+1-555-0102",
            "relationship": "child",
            "priority": 2,
            "access_granted": False,
            "access_type": "after_dms",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.nominees.insert_many(demo_nominees)
    
    # Demo DMS (keep existing)
    demo_dms = {
        "user_id": user_id,
        "inactivity_days": 90,
        "reminder_1_days": 60,
        "reminder_2_days": 75,
        "reminder_3_days": 85,
        "is_active": True,
        "last_reset": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    existing_dms = await db.dead_man_switches.find_one({"user_id": user_id})
    if not existing_dms:
        await db.dead_man_switches.insert_one(demo_dms)
    
    # Demo AI Insight - Create a comprehensive insight snapshot
    demo_insight = {
        "id": f"{demo_prefix}insight1",
        "user_id": user_id,
        "portfolio_summary": "Your portfolio demonstrates strong diversification across multiple asset classes with a healthy balance of liquid and long-term investments. Total net worth stands at approximately $520,000, with a well-balanced mix of real estate, stocks, cryptocurrencies, and cash reserves.",
        "asset_distribution_analysis": "Your asset allocation shows 45% in real estate, 25% in equities and portfolios, 15% in cash and liquid assets, 10% in cryptocurrencies, and 5% in precious metals. This distribution provides both stability through real estate and growth potential through equities and crypto.",
        "allocation_recommendations": [
            "Consider increasing emergency fund to cover 6 months of expenses for optimal financial security",
            "Evaluate rebalancing crypto holdings if they exceed 15% of total portfolio due to volatility",
            "Review real estate holdings for diversification opportunities in different geographic locations",
            "Consider tax-advantaged retirement accounts to optimize long-term growth"
        ],
        "advantages": [
            "Strong real estate foundation providing stable, appreciating assets",
            "Diversified across traditional and alternative investments",
            "Healthy emergency fund in liquid bank accounts",
            "Multi-currency holdings providing natural hedge against currency fluctuations",
            "Active portfolio management with both US and international exposure"
        ],
        "risks": [
            "Real estate concentration may limit liquidity in emergencies",
            "Cryptocurrency holdings carry high volatility risk",
            "Outstanding loan obligations require consistent cash flow management",
            "Some investments may not be optimally diversified within their asset class",
            "Currency exposure may introduce foreign exchange risk"
        ],
        "action_items": [
            "Schedule quarterly portfolio rebalancing reviews",
            "Set up automatic transfers to build emergency fund to 6-month target",
            "Review and optimize tax strategy with a financial advisor",
            "Consider dollar-cost averaging for crypto investments to reduce volatility impact",
            "Document all account access information in secure location for nominees"
        ],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    # Remove existing demo insights if force reseeding
    if force:
        await db.ai_insights.delete_many({"user_id": user_id, "id": {"$regex": f"^{demo_prefix}"}})
    await db.ai_insights.insert_one(demo_insight)
    
    # Demo Income & Expense Data
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    last_month = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m")
    
    # Demo Incomes for current month
    demo_incomes_current = [
        {
            "id": f"{demo_prefix}income1",
            "user_id": user_id,
            "month": current_month,
            "source": "Salary",
            "description": "Monthly salary from TechCorp Inc.",
            "amount_before_tax": 8500.00,
            "tax_deducted": 1700.00,
            "amount_after_tax": 6800.00,
            "currency": "USD",
            "payment_date": datetime.now(timezone.utc).replace(day=1).isoformat().split('T')[0],
            "notes": "Regular monthly salary",
            "recurring": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}income2",
            "user_id": user_id,
            "month": current_month,
            "source": "Freelance/Consulting",
            "description": "Web development project for Client XYZ",
            "amount_before_tax": 2000.00,
            "tax_deducted": 300.00,
            "amount_after_tax": 1700.00,
            "currency": "USD",
            "payment_date": datetime.now(timezone.utc).replace(day=15).isoformat().split('T')[0],
            "notes": "One-time project payment",
            "recurring": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}income3",
            "user_id": user_id,
            "month": current_month,
            "source": "Investment Returns",
            "description": "Dividend from stock portfolio",
            "amount_before_tax": 450.00,
            "tax_deducted": 67.50,
            "amount_after_tax": 382.50,
            "currency": "USD",
            "payment_date": datetime.now(timezone.utc).replace(day=20).isoformat().split('T')[0],
            "notes": "Quarterly dividend payment",
            "recurring": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Demo Expenses for current month
    demo_expenses_current = [
        {
            "id": f"{demo_prefix}expense1",
            "user_id": user_id,
            "month": current_month,
            "category": "Housing",
            "subcategory": "Rent",
            "description": "Monthly apartment rent",
            "amount": 1800.00,
            "currency": "USD",
            "payment_method": "Bank Transfer",
            "payment_date": datetime.now(timezone.utc).replace(day=1).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "2-bedroom apartment downtown",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense2",
            "user_id": user_id,
            "month": current_month,
            "category": "Food & Dining",
            "subcategory": "Groceries",
            "description": "Weekly grocery shopping",
            "amount": 450.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=5).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "Monthly groceries",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense3",
            "user_id": user_id,
            "month": current_month,
            "category": "Transportation",
            "subcategory": "Fuel",
            "description": "Gas for car",
            "amount": 180.00,
            "currency": "USD",
            "payment_method": "Debit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=10).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "Monthly fuel expenses",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense4",
            "user_id": user_id,
            "month": current_month,
            "category": "Utilities",
            "subcategory": "Electricity",
            "description": "Monthly electricity bill",
            "amount": 120.00,
            "currency": "USD",
            "payment_method": "Bank Transfer",
            "payment_date": datetime.now(timezone.utc).replace(day=5).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "Utility bill",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense5",
            "user_id": user_id,
            "month": current_month,
            "category": "Technology",
            "subcategory": "Internet",
            "description": "Internet and streaming bundle",
            "amount": 85.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=1).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "High-speed internet + Netflix",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense6",
            "user_id": user_id,
            "month": current_month,
            "category": "Food & Dining",
            "subcategory": "Restaurants",
            "description": "Dining out and restaurants",
            "amount": 320.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=15).isoformat().split('T')[0],
            "is_recurring": False,
            "is_essential": False,
            "notes": "Weekend dining",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense7",
            "user_id": user_id,
            "month": current_month,
            "category": "Entertainment",
            "subcategory": "Movies",
            "description": "Movie tickets and entertainment",
            "amount": 65.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=12).isoformat().split('T')[0],
            "is_recurring": False,
            "is_essential": False,
            "notes": "Weekend entertainment",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense8",
            "user_id": user_id,
            "month": current_month,
            "category": "Healthcare",
            "subcategory": "Health Insurance",
            "description": "Monthly health insurance premium",
            "amount": 350.00,
            "currency": "USD",
            "payment_method": "Bank Transfer",
            "payment_date": datetime.now(timezone.utc).replace(day=1).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "Family health insurance",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense9",
            "user_id": user_id,
            "month": current_month,
            "category": "Personal Care",
            "subcategory": "Gym",
            "description": "Gym membership",
            "amount": 45.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=1).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": False,
            "notes": "Monthly gym membership",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense10",
            "user_id": user_id,
            "month": current_month,
            "category": "Shopping",
            "subcategory": "Clothing",
            "description": "Clothing and accessories",
            "amount": 150.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=18).isoformat().split('T')[0],
            "is_recurring": False,
            "is_essential": False,
            "notes": "New work clothes",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Remove existing demo income/expenses if force reseeding
    if force:
        await db.monthly_incomes.delete_many({"user_id": user_id, "id": {"$regex": f"^{demo_prefix}"}})
        await db.monthly_expenses.delete_many({"user_id": user_id, "id": {"$regex": f"^{demo_prefix}"}})
    
    # Insert demo income and expenses
    await db.monthly_incomes.insert_many(demo_incomes_current)
    await db.monthly_expenses.insert_many(demo_expenses_current)


# Subscription Routes
@api_router.get("/subscription/current")
async def get_subscription(user: User = Depends(require_auth)):
    plan = getattr(user, 'subscription_plan', 'Free')
    features = SUBSCRIPTION_FEATURES.get(plan, SUBSCRIPTION_FEATURES["Free"])
    
    # Get current usage
    asset_count = await db.assets.count_documents({"user_id": user.id})
    document_count = await db.documents.count_documents({"user_id": user.id})
    storage_bytes = await get_user_storage_usage(user.id)
    storage_mb = storage_bytes / (1024 * 1024)
    
    # Get subscription details from Stripe if applicable
    subscription_details = None
    stripe_customer_id = getattr(user, 'stripe_customer_id', None)
    
    if stripe_customer_id and plan != 'Free':
        try:
            subscriptions = stripe.Subscription.list(
                customer=stripe_customer_id,
                status='all',
                limit=10
            )
            
            if subscriptions.data and len(subscriptions.data) > 0:
                sub = subscriptions.data[0]  # Get most recent subscription
                
                # Convert Stripe object to dict for easier access
                sub_dict = sub.to_dict()
                logger.info(f"Stripe subscription keys: {list(sub_dict.keys())}")
                logger.info(f"Subscription status: {sub_dict.get('status')}, cancel_at: {sub_dict.get('cancel_at')}")
                
                # Get payment method
                payment_method_info = None
                default_pm = sub_dict.get('default_payment_method')
                if default_pm:
                    try:
                        pm = stripe.PaymentMethod.retrieve(default_pm)
                        if pm.type == 'card':
                            payment_method_info = {
                                "type": "card",
                                "brand": pm.card.brand,
                                "last4": pm.card.last4,
                                "exp_month": pm.card.exp_month,
                                "exp_year": pm.card.exp_year
                            }
                    except Exception as pm_error:
                        logger.warning(f"Failed to fetch payment method: {str(pm_error)}")
                
                try:
                    # Calculate current period dates from billing cycle
                    billing_anchor = sub_dict.get('billing_cycle_anchor', sub_dict.get('created', 0))
                    current_time = int(datetime.now().timestamp())
                    
                    # Get the plan interval to calculate period
                    interval = sub_dict.get('items', {}).get('data', [{}])[0].get('price', {}).get('recurring', {}).get('interval', 'month')
                    interval_count = sub_dict.get('items', {}).get('data', [{}])[0].get('price', {}).get('recurring', {}).get('interval_count', 1)
                    
                    # Calculate period end based on interval
                    if interval == 'month':
                        from dateutil.relativedelta import relativedelta
                        period_start_dt = datetime.fromtimestamp(billing_anchor)
                        # Find the current period by adding months until we're past current time
                        periods_passed = 0
                        while True:
                            period_end_dt = period_start_dt + relativedelta(months=interval_count * (periods_passed + 1))
                            if period_end_dt.timestamp() > current_time:
                                period_start_dt = period_start_dt + relativedelta(months=interval_count * periods_passed)
                                break
                            periods_passed += 1
                    else:
                        # For non-monthly intervals, use billing anchor as start
                        period_start_dt = datetime.fromtimestamp(billing_anchor)
                        period_end_dt = datetime.fromtimestamp(sub_dict.get('cancel_at', billing_anchor))
                    
                    subscription_details = {
                        "subscription_id": sub_dict.get('id'),
                        "status": sub_dict.get('status'),
                        "current_period_start": period_start_dt.isoformat(),
                        "current_period_end": period_end_dt.isoformat(),
                        "cancel_at_period_end": sub_dict.get('cancel_at_period_end', False),
                        "cancel_at": datetime.fromtimestamp(sub_dict['cancel_at']).isoformat() if sub_dict.get('cancel_at') else None,
                        "canceled_at": datetime.fromtimestamp(sub_dict['canceled_at']).isoformat() if sub_dict.get('canceled_at') else None,
                        "created": datetime.fromtimestamp(sub_dict.get('created', 0)).isoformat(),
                        "payment_method": payment_method_info,
                        "amount": sub_dict['items']['data'][0]['price']['unit_amount'] / 100 if sub_dict.get('items') and sub_dict['items'].get('data') else 0,
                        "currency": sub_dict['items']['data'][0]['price']['currency'].upper() if sub_dict.get('items') and sub_dict['items'].get('data') else "USD",
                        "interval": interval
                    }
                except (KeyError, IndexError, TypeError) as parse_err:
                    logger.error(f"Failed to parse subscription details: {str(parse_err)}")
                    subscription_details = None
        except Exception as e:
            logger.error(f"Failed to fetch Stripe subscription details: {str(e)}")
    
    return {
        "plan": plan,
        "status": "active" if plan != 'Free' else None,
        "features": features,
        "usage": {
            "assets": asset_count,
            "documents": document_count,
            "storage_mb": round(storage_mb, 2),
            "storage_bytes": storage_bytes
        },
        "limits": {
            "assets_remaining": features["max_assets"] - asset_count if features["max_assets"] > 0 else -1,
            "documents_remaining": features["max_documents"] - document_count if features["max_documents"] > 0 else -1,
            "storage_remaining_mb": features["storage_mb"] - storage_mb if features["storage_mb"] > 0 else -1
        },
        "subscription_details": subscription_details
    }

@api_router.post("/subscription/verify-and-update")
async def verify_and_update_subscription(user: User = Depends(require_auth)):
    """
    Manually verify subscription status with Stripe and update local database.
    Useful as fallback when webhooks don't fire.
    """
    try:
        stripe_customer_id = getattr(user, 'stripe_customer_id', None)
        if not stripe_customer_id:
            return {"plan": "Free", "updated": False}
        
        # Fetch active subscriptions from Stripe
        subscriptions = stripe.Subscription.list(
            customer=stripe_customer_id,
            status='active',
            limit=10
        )
        
        if subscriptions.data and len(subscriptions.data) > 0:
            # Get the first active subscription
            subscription = subscriptions.data[0]
            price_id = subscription['items']['data'][0]['price']['id']
            
            # Determine plan based on price amount
            price = stripe.Price.retrieve(price_id)
            plan = "Pro" if price.unit_amount == 999 else "Family" if price.unit_amount == 2499 else "Free"
            
            # Update database
            await db.users.update_one(
                {"id": user.id},
                {"$set": {
                    "subscription_plan": plan,
                    "stripe_subscription_id": subscription['id']
                }}
            )
            
            logger.info(f"Updated subscription for {user.email}: {plan}")
            return {"plan": plan, "updated": True}
        else:
            # No active subscription found
            await db.users.update_one(
                {"id": user.id},
                {"$set": {"subscription_plan": "Free"}}
            )
            return {"plan": "Free", "updated": True}
            
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error verifying subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify subscription")
    except Exception as e:
        logger.error(f"Error verifying subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
        
        # If no match found, provide detailed error
        available_prices = [f"${p.unit_amount/100:.2f}" for p in prices.data]
        raise HTTPException(
            status_code=400, 
            detail=f"No price found for {plan} plan (${target_amount/100:.2f}). Available prices in Stripe product {product_id}: {', '.join(available_prices)}. Please add the {plan} plan price in Stripe Dashboard."
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error fetching prices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscription prices")

@api_router.post("/subscription/create-checkout-session")
async def create_checkout_session(data: dict, user: User = Depends(require_auth)):
    try:
        plan = data.get('plan')
        logger.info(f"Creating checkout session for user {user.email}, plan: {plan}")
        
        # Get price ID based on plan (with dynamic fetching from product)
        price_id = await get_stripe_price_for_plan(plan)
        logger.info(f"Found price ID: {price_id}")
        
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
        # Get frontend URL - use FRONTEND_URL env var or derive from request
        frontend_url = os.environ.get('FRONTEND_URL')
        if not frontend_url:
            # Fallback: try to get from CORS_ORIGINS if it's not '*'
            cors_origins = os.environ.get('CORS_ORIGINS', '')
            if cors_origins and cors_origins != '*':
                frontend_url = cors_origins.split(',')[0]
            else:
                # Last resort: use the backend URL domain (they're usually the same in preview)
                frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('APP_URL', 'https://legacy-planner-13.preview.emergentagent.com'))
        
        # Ensure URL has scheme
        if not frontend_url.startswith('http'):
            frontend_url = f"https://{frontend_url}"
        
        session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            mode='subscription',
            line_items=[{'price': price_id, 'quantity': 1}],
            success_url=f"{frontend_url}/subscription?success=true",
            cancel_url=f"{frontend_url}/subscription?canceled=true",
            metadata={"user_id": user.id, "plan": plan}
        )
        
        logger.info(f"Checkout session created: {session.id}, URL: {session.url}")
        return {"sessionId": session.id, "url": session.url}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

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
    # Filter based on demo mode
    demo_prefix = f"demo_{user.id}_"
    if user.demo_mode:
        # Show only demo messages
        messages = await db.scheduled_messages.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }, {"_id": 0}).to_list(1000)
    else:
        # Show only live messages (exclude demo)
        messages = await db.scheduled_messages.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }, {"_id": 0}).to_list(1000)
    
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
    """Generate fresh AI insights and store them. Includes portfolio holdings. Filters by demo mode."""
    try:
        # Check if LLM key is available
        llm_key = os.environ.get("EMERGENT_LLM_KEY")
        if not llm_key:
            logger.warning("EMERGENT_LLM_KEY not set - AI insights will use fallback templates")
        
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Fetch user's assets and portfolios - FILTER BY DEMO MODE
        demo_prefix = f"demo_{user.id}_"
        if user.demo_mode:
            # Use only demo assets and portfolios
            assets = await db.assets.find({
                "user_id": user.id,
                "id": {"$regex": f"^{demo_prefix}"}
            }).to_list(1000)
            portfolios = await db.portfolio_assets.find({
                "user_id": user.id,
                "id": {"$regex": f"^{demo_prefix}"}
            }).to_list(1000)
        else:
            # Use only live assets and portfolios (exclude demo)
            assets = await db.assets.find({
                "user_id": user.id,
                "id": {"$not": {"$regex": f"^{demo_prefix}"}}
            }).to_list(1000)
            portfolios = await db.portfolio_assets.find({
                "user_id": user.id,
                "id": {"$not": {"$regex": f"^{demo_prefix}"}}
            }).to_list(1000)
        
        if not assets and not portfolios:
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
        holdings_details = []  # Track individual holdings from portfolios
        
        # Get user's preferred currency
        target_currency = user.selected_currency or "USD"
        
        # Process individual assets
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
        
        # Process portfolio assets and their holdings
        for portfolio in portfolios:
            asset_types['portfolio'] = asset_types.get('portfolio', 0) + 1
            portfolio_currency = portfolio.get("purchase_currency", "USD")
            portfolio_value = portfolio.get("total_value", 0.0)
            
            # Convert portfolio value to target currency
            portfolio_value_converted = convert_currency(
                portfolio_value,
                portfolio_currency,
                target_currency
            )
            total_assets_value += portfolio_value_converted
            
            # Track holdings for detailed analysis
            if portfolio.get('holdings'):
                for holding in portfolio['holdings']:
                    holdings_details.append({
                        'portfolio': portfolio.get('name'),
                        'symbol': holding.get('symbol'),
                        'name': holding.get('name'),
                        'type': holding.get('asset_type'),
                        'quantity': holding.get('quantity'),
                        'value': holding.get('quantity', 0) * holding.get('current_price', holding.get('purchase_price', 0))
                    })
                    # Count holding types separately
                    holding_type = holding.get('asset_type', 'unknown')
                    asset_types[holding_type] = asset_types.get(holding_type, 0) + 1
        
        net_worth = total_assets_value - total_liabilities_value
        
        # Create detailed portfolio context for AI
        asset_distribution_str = ", ".join([f"{k}: {v} items" for k, v in asset_types.items()])
        
        # Format holdings for AI context
        holdings_summary = ""
        if holdings_details:
            holdings_summary = "\n\nPortfolio Holdings Breakdown:\n"
            for h in holdings_details[:20]:  # Limit to first 20 for context size
                holdings_summary += f"- {h['name']} ({h['symbol']}): {h['quantity']} units in {h['portfolio']}, Type: {h['type']}\n"
        
        portfolio_context = f"""Analyze this investment portfolio and provide structured insights:

Portfolio Overview:
- Total Assets Value: {target_currency} {total_assets_value:,.2f}
- Total Liabilities: {target_currency} {total_liabilities_value:,.2f}
- Net Worth: {target_currency} {net_worth:,.2f}
- Currency: {target_currency}
- Asset Distribution: {asset_distribution_str}
- Total number of individual assets: {len(assets)}
- Total number of portfolios: {len(portfolios)}
- Total holdings across portfolios: {len(holdings_details)}{holdings_summary}

Please provide a comprehensive analysis in the following structure:

1. PORTFOLIO SUMMARY (2-3 sentences about overall health and composition)

2. ASSET DISTRIBUTION ANALYSIS (Brief analysis of how assets are distributed and if diversification is adequate)

3. ALLOCATION RECOMMENDATIONS (List 4-5 specific, actionable recommendations)

4. ADVANTAGES (List 3-4 positive aspects or strengths of this portfolio)

5. RISKS (List 3-4 potential risks or concerns, focusing on concentration, liquidity, or market risks)

6. ACTION ITEMS (List 4-5 concrete next steps the user should take)

Format your response clearly with these section headers."""
        
        # Initialize AI chat
        ai_response = None
        try:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            chat = LlmChat(
                api_key=api_key,
                session_id=f"insights_{user.id}_{datetime.now(timezone.utc).timestamp()}",
                system_message="You are an expert financial advisor specializing in portfolio analysis, asset allocation, and risk management. Provide clear, actionable, and personalized recommendations based on the user's portfolio composition. Focus on asset distribution, investment diversification, and identifying both opportunities and risks."
            ).with_model("openai", "gpt-4o-mini")
            
            # Send message
            user_message = UserMessage(text=portfolio_context)
            ai_response = await chat.send_message(user_message)
        except Exception as ai_error:
            logger.error(f"AI service error: {str(ai_error)}")
            # Fall back to template-based insights
            ai_response = None
        
        # Parse AI response into structured sections
        sections = {
            "summary": "",
            "distribution": "",
            "recommendations": [],
            "advantages": [],
            "risks": [],
            "actions": []
        }
        
        if ai_response:
            current_section = None
            lines = ai_response.strip().split('\n')
        else:
            # Use fallback template when AI fails
            lines = []
            # Pre-populate sections with template-based insights
            sections["summary"] = f"Portfolio analysis shows net worth of ${net_worth:,.2f} across {len(assets) + len(portfolios)} holdings."
            sections["distribution"] = f"Your portfolio includes {len(asset_types)} different asset types with the following distribution: {asset_distribution_str}."
            sections["recommendations"] = [
                "Consider diversifying across multiple asset classes to reduce risk",
                "Maintain 3-6 months of expenses in liquid emergency funds",
                "Review and rebalance your portfolio quarterly",
                "Consider tax-advantaged investment accounts"
            ]
            sections["advantages"] = [
                "Comprehensive tracking of all financial assets",
                "Clear visibility into total net worth",
                "Organized financial overview for planning"
            ]
            sections["risks"] = [
                "Monitor concentration risk in any single asset type",
                "Consider liquidity needs for emergency situations",
                "Stay informed about market volatility impacts"
            ]
            sections["actions"] = [
                "Update current market valuations for all assets",
                "Set up regular portfolio review schedule",
                "Consider professional financial planning consultation",
                "Evaluate insurance coverage adequacy"
            ]
        
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

# Income & Expense Tracking Routes
@api_router.post("/income")
async def create_income(income_data: MonthlyIncomeCreate, user: User = Depends(require_auth)):
    """Create a new income entry"""
    # Calculate after-tax amount
    amount_after_tax = income_data.amount_before_tax - (income_data.tax_deducted or 0.0)
    
    income = MonthlyIncome(
        user_id=user.id,
        month=income_data.month,
        source=income_data.source,
        description=income_data.description,
        amount_before_tax=income_data.amount_before_tax,
        tax_deducted=income_data.tax_deducted or 0.0,
        amount_after_tax=amount_after_tax,
        currency=income_data.currency or "USD",
        payment_date=income_data.payment_date,
        notes=income_data.notes,
        recurring=income_data.recurring if income_data.recurring is not None else True
    )
    
    income_dict = income.model_dump()
    income_dict['created_at'] = income_dict['created_at'].isoformat()
    income_dict['updated_at'] = income_dict['updated_at'].isoformat()
    
    await db.monthly_incomes.insert_one(income_dict)
    
    return {"success": True, "income_id": income.id, "income": income}

@api_router.get("/income")
async def get_incomes(month: Optional[str] = None, user: User = Depends(require_auth)):
    """Get all income entries, optionally filtered by month"""
    query = {"user_id": user.id}
    if month:
        query["month"] = month
    
    incomes = await db.monthly_incomes.find(query, {"_id": 0}).sort("month", -1).to_list(1000)
    return {"incomes": incomes}

@api_router.get("/income/{income_id}")
async def get_income(income_id: str, user: User = Depends(require_auth)):
    """Get a specific income entry"""
    income = await db.monthly_incomes.find_one({"id": income_id, "user_id": user.id}, {"_id": 0})
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    return income

@api_router.put("/income/{income_id}")
async def update_income(income_id: str, update_data: MonthlyIncomeUpdate, user: User = Depends(require_auth)):
    """Update an income entry"""
    income = await db.monthly_incomes.find_one({"id": income_id, "user_id": user.id}, {"_id": 0})
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # Recalculate after-tax amount if before-tax or tax changed
    if "amount_before_tax" in update_dict or "tax_deducted" in update_dict:
        before_tax = update_dict.get("amount_before_tax", income["amount_before_tax"])
        tax_deducted = update_dict.get("tax_deducted", income["tax_deducted"])
        update_dict["amount_after_tax"] = before_tax - tax_deducted
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.monthly_incomes.update_one(
        {"id": income_id, "user_id": user.id},
        {"$set": update_dict}
    )
    
    return {"success": True, "message": "Income updated"}

@api_router.delete("/income/{income_id}")
async def delete_income(income_id: str, user: User = Depends(require_auth)):
    """Delete an income entry"""
    result = await db.monthly_incomes.delete_one({"id": income_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Income not found")
    return {"success": True, "message": "Income deleted"}

@api_router.post("/expenses")
async def create_expense(expense_data: MonthlyExpenseCreate, user: User = Depends(require_auth)):
    """Create a new expense entry"""
    expense = MonthlyExpense(
        user_id=user.id,
        month=expense_data.month,
        category=expense_data.category,
        subcategory=expense_data.subcategory,
        description=expense_data.description,
        amount=expense_data.amount,
        currency=expense_data.currency or "USD",
        payment_method=expense_data.payment_method,
        payment_date=expense_data.payment_date,
        is_recurring=expense_data.is_recurring if expense_data.is_recurring is not None else False,
        is_essential=expense_data.is_essential if expense_data.is_essential is not None else True,
        notes=expense_data.notes
    )
    
    expense_dict = expense.model_dump()
    expense_dict['created_at'] = expense_dict['created_at'].isoformat()
    expense_dict['updated_at'] = expense_dict['updated_at'].isoformat()
    
    await db.monthly_expenses.insert_one(expense_dict)
    
    return {"success": True, "expense_id": expense.id, "expense": expense}

@api_router.get("/expenses")
async def get_expenses(month: Optional[str] = None, category: Optional[str] = None, user: User = Depends(require_auth)):
    """Get all expense entries, optionally filtered by month and/or category"""
    query = {"user_id": user.id}
    if month:
        query["month"] = month
    if category:
        query["category"] = category
    
    expenses = await db.monthly_expenses.find(query, {"_id": 0}).sort("month", -1).to_list(1000)
    return {"expenses": expenses}

@api_router.get("/expenses/{expense_id}")
async def get_expense(expense_id: str, user: User = Depends(require_auth)):
    """Get a specific expense entry"""
    expense = await db.monthly_expenses.find_one({"id": expense_id, "user_id": user.id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@api_router.put("/expenses/{expense_id}")
async def update_expense(expense_id: str, update_data: MonthlyExpenseUpdate, user: User = Depends(require_auth)):
    """Update an expense entry"""
    expense = await db.monthly_expenses.find_one({"id": expense_id, "user_id": user.id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.monthly_expenses.update_one(
        {"id": expense_id, "user_id": user.id},
        {"$set": update_dict}
    )
    
    return {"success": True, "message": "Expense updated"}

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user: User = Depends(require_auth)):
    """Delete an expense entry"""
    result = await db.monthly_expenses.delete_one({"id": expense_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"success": True, "message": "Expense deleted"}

@api_router.get("/income-expense/summary")
async def get_monthly_summary(month: str, target_currency: str = "USD", user: User = Depends(require_auth)):
    """Get monthly income and expense summary"""
    # Fetch incomes for the month
    incomes = await db.monthly_incomes.find({"user_id": user.id, "month": month}, {"_id": 0}).to_list(1000)
    
    # Fetch expenses for the month
    expenses = await db.monthly_expenses.find({"user_id": user.id, "month": month}, {"_id": 0}).to_list(1000)
    
    # Helper function to get conversion rate
    async def get_rate(from_curr, to_curr):
        if from_curr.upper() == to_curr.upper():
            return 1.0
        try:
            result = await get_currency_conversion(from_curr, to_curr)
            return result['rate']
        except:
            return 1.0
    
    # Convert all to target currency
    total_income_before_tax = 0
    total_tax_deducted = 0
    total_income_after_tax = 0
    income_by_source = {}
    
    for income in incomes:
        rate = await get_rate(income['currency'], target_currency)
        before_tax = income['amount_before_tax'] * rate
        tax = income['tax_deducted'] * rate
        after_tax = income['amount_after_tax'] * rate
        
        total_income_before_tax += before_tax
        total_tax_deducted += tax
        total_income_after_tax += after_tax
        
        source = income['source']
        income_by_source[source] = income_by_source.get(source, 0) + after_tax
    
    total_expenses = 0
    expenses_by_category = {}
    
    for expense in expenses:
        rate = await get_rate(expense['currency'], target_currency)
        amount = expense['amount'] * rate
        total_expenses += amount
        
        category = expense['category']
        expenses_by_category[category] = expenses_by_category.get(category, 0) + amount
    
    net_savings = total_income_after_tax - total_expenses
    savings_rate = (net_savings / total_income_after_tax * 100) if total_income_after_tax > 0 else 0
    
    return MonthlySummary(
        month=month,
        total_income_before_tax=round(total_income_before_tax, 2),
        total_tax_deducted=round(total_tax_deducted, 2),
        total_income_after_tax=round(total_income_after_tax, 2),
        total_expenses=round(total_expenses, 2),
        net_savings=round(net_savings, 2),
        savings_rate=round(savings_rate, 2),
        currency=target_currency,
        income_by_source=income_by_source,
        expenses_by_category=expenses_by_category
    )

@api_router.get("/income-expense/categories")
async def get_expense_categories():
    """Get predefined expense categories"""
    categories = {
        "Housing": ["Rent", "Mortgage", "Property Tax", "Home Insurance", "Maintenance", "Utilities"],
        "Transportation": ["Car Payment", "Fuel", "Car Insurance", "Maintenance", "Public Transport", "Parking", "Tolls"],
        "Food & Dining": ["Groceries", "Restaurants", "Takeout", "Coffee Shops", "Meal Delivery"],
        "Healthcare": ["Health Insurance", "Doctor Visits", "Medications", "Dental", "Vision", "Medical Equipment"],
        "Insurance": ["Life Insurance", "Health Insurance", "Car Insurance", "Home Insurance", "Other Insurance"],
        "Education": ["Tuition", "Books", "Supplies", "Courses", "Training", "School Fees"],
        "Entertainment": ["Movies", "Concerts", "Sports Events", "Hobbies", "Games", "Streaming Services"],
        "Personal Care": ["Haircuts", "Spa", "Gym", "Cosmetics", "Clothing", "Accessories"],
        "Technology": ["Phone Bill", "Internet", "Software Subscriptions", "Electronics", "Gadgets"],
        "Financial": ["Bank Fees", "Credit Card Fees", "Investment Fees", "Tax Preparation", "Financial Advisor"],
        "Shopping": ["Clothing", "Electronics", "Home Goods", "Gifts", "Online Shopping"],
        "Travel": ["Flights", "Hotels", "Vacation", "Travel Insurance", "Visa Fees"],
        "Utilities": ["Electricity", "Water", "Gas", "Trash", "Internet", "Phone"],
        "Children": ["Childcare", "Diapers", "Toys", "Activities", "Babysitting"],
        "Pets": ["Pet Food", "Vet", "Pet Insurance", "Grooming", "Pet Supplies"],
        "Debt Payments": ["Credit Card Payments", "Loan EMI", "Personal Loan", "Student Loan"],
        "Savings & Investments": ["Emergency Fund", "Retirement", "SIP", "Fixed Deposits", "Stocks"],
        "Charity": ["Donations", "Religious Contributions", "NGO Support"],
        "Other": ["Miscellaneous", "One-time Expenses", "Unexpected"]
    }
    
    income_sources = [
        "Salary",
        "Bonus",
        "Business Income",
        "Freelance/Consulting",
        "Rental Income",
        "Investment Returns",
        "Dividends",
        "Interest",
        "Capital Gains",
        "Gift/Inheritance",
        "Pension",
        "Social Security",
        "Other"
    ]
    
    payment_methods = [
        "Cash",
        "Credit Card",
        "Debit Card",
        "UPI",
        "Net Banking",
        "Check",
        "Mobile Wallet",
        "Other"
    ]
    
    return {
        "expense_categories": categories,
        "income_sources": income_sources,
        "payment_methods": payment_methods
    }

# Tax & Wealth Blueprint Routes
@api_router.post("/tax-blueprint/profile")
async def create_tax_profile(profile_data: TaxProfileCreate, user: User = Depends(require_auth)):
    """Create or update user's tax profile"""
    try:
        # Validate income
        if profile_data.annual_gross_income <= 0:
            raise HTTPException(status_code=400, detail="Annual gross income must be greater than 0")
        
        # Check if profile already exists
        existing_profile = await db.tax_profiles.find_one({"user_id": user.id}, {"_id": 0})
        
        if existing_profile:
            # Update existing profile
            update_dict = profile_data.model_dump()
            update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            await db.tax_profiles.update_one(
                {"user_id": user.id},
                {"$set": update_dict}
            )
            profile_id = existing_profile["id"]
        else:
            # Create new profile
            profile = TaxProfile(
                user_id=user.id,
                **profile_data.model_dump()
            )
            
            profile_dict = profile.model_dump()
            profile_dict['created_at'] = profile_dict['created_at'].isoformat()
            profile_dict['updated_at'] = profile_dict['updated_at'].isoformat()
            
            await db.tax_profiles.insert_one(profile_dict)
            profile_id = profile.id
        
        # Calculate completion percentage
        required_fields = [
            "employment_status", "annual_gross_income", "tax_regime",
            "marital_status", "risk_appetite"
        ]
        completed_fields = sum(1 for field in required_fields if getattr(profile_data, field, None))
        completion_percentage = int((completed_fields / len(required_fields)) * 100)
        
        missing_fields = []
        if profile_data.health_insurance_self == 0:
            missing_fields.append("health_insurance_self")
        
        return {
            "profile_id": profile_id,
            "completion_percentage": completion_percentage,
            "missing_fields": missing_fields,
            "next_steps": ["Review your expense patterns" if completion_percentage >= 80 else "Complete remaining profile fields"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating tax profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save profile")

@api_router.get("/tax-blueprint/profile")
async def get_tax_profile(user: User = Depends(require_auth)):
    """Retrieve user's tax profile"""
    profile = await db.tax_profiles.find_one({"user_id": user.id}, {"_id": 0})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Tax profile not found")
    
    return profile

@api_router.get("/tax-blueprint/regime-comparison")
async def get_regime_comparison(user: User = Depends(require_auth)):
    """Compare Old vs New tax regime for user"""
    profile = await db.tax_profiles.find_one({"user_id": user.id}, {"_id": 0})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Tax profile not found. Please complete your profile first.")
    
    annual_income = profile.get("annual_gross_income", 0)
    
    # Old Regime Tax Calculation (FY 2024-25)
    old_regime_tax = 0
    if annual_income > 1000000:
        old_regime_tax = (250000 * 0) + (250000 * 0.05) + (500000 * 0.20) + ((annual_income - 1000000) * 0.30)
    elif annual_income > 500000:
        old_regime_tax = (250000 * 0) + (250000 * 0.05) + ((annual_income - 500000) * 0.20)
    elif annual_income > 250000:
        old_regime_tax = (250000 * 0) + ((annual_income - 250000) * 0.05)
    
    # Deductions in old regime
    deductions_80c = min(profile.get("current_80c_investment", 0), 150000)
    deductions_80d = profile.get("health_insurance_self", 0) + profile.get("health_insurance_parents", 0)
    deductions_80d = min(deductions_80d, 50000)
    total_deductions = deductions_80c + deductions_80d
    
    old_regime_final_tax = old_regime_tax - (total_deductions * 0.30 if annual_income > 1000000 else total_deductions * 0.20)
    old_regime_final_tax = max(old_regime_final_tax, 0)
    
    # New Regime Tax Calculation (FY 2024-25)
    new_regime_tax = 0
    if annual_income > 1500000:
        new_regime_tax = (300000 * 0) + (300000 * 0.05) + (300000 * 0.10) + (300000 * 0.15) + (300000 * 0.20) + ((annual_income - 1500000) * 0.30)
    elif annual_income > 1200000:
        new_regime_tax = (300000 * 0) + (300000 * 0.05) + (300000 * 0.10) + (300000 * 0.15) + ((annual_income - 1200000) * 0.20)
    elif annual_income > 900000:
        new_regime_tax = (300000 * 0) + (300000 * 0.05) + (300000 * 0.10) + ((annual_income - 900000) * 0.15)
    elif annual_income > 600000:
        new_regime_tax = (300000 * 0) + (300000 * 0.05) + ((annual_income - 600000) * 0.10)
    elif annual_income > 300000:
        new_regime_tax = (300000 * 0) + ((annual_income - 300000) * 0.05)
    
    # Determine recommendation
    tax_difference = old_regime_final_tax - new_regime_tax
    
    if tax_difference < 0:
        recommended_regime = "old"
        rationale = f"Old regime saves you ₹{abs(int(tax_difference))} in taxes. Plus, it encourages disciplined investments toward your goals."
    elif tax_difference > 0:
        recommended_regime = "new"
        rationale = f"New regime saves you ₹{int(tax_difference)} in taxes and offers simpler calculations."
    else:
        recommended_regime = "old"
        rationale = "Both regimes result in similar tax. Old regime is recommended for building investment discipline."
    
    return RegimeComparison(
        old_regime_tax=round(old_regime_tax, 2),
        old_regime_deductions=round(total_deductions, 2),
        old_regime_final_tax=round(old_regime_final_tax, 2),
        new_regime_tax=round(new_regime_tax, 2),
        new_regime_final_tax=round(new_regime_tax, 2),
        recommended_regime=recommended_regime,
        tax_saving_difference=round(abs(tax_difference), 2),
        rationale=rationale
    )

@api_router.get("/tax-blueprint/tax-benefits-guide")
async def get_tax_benefits_guide(user: User = Depends(require_auth)):
    """Get comprehensive tax benefits guide based on user profile"""
    profile = await db.tax_profiles.find_one({"user_id": user.id}, {"_id": 0})
    
    # Common deductions for all
    common_deductions = [
        {
            "section": "80C",
            "name": "Life Insurance Premium",
            "limit": 150000,
            "description": "Premium paid for life insurance policies",
            "applicable": True
        },
        {
            "section": "80C",
            "name": "Employee Provident Fund (EPF)",
            "limit": 150000,
            "description": "Contribution to EPF (auto-deducted from salary)",
            "applicable": True
        },
        {
            "section": "80C",
            "name": "Public Provident Fund (PPF)",
            "limit": 150000,
            "description": "Investment in PPF account (7.1% interest, 15-year lock-in)",
            "applicable": True
        },
        {
            "section": "80C",
            "name": "ELSS Mutual Funds",
            "limit": 150000,
            "description": "Equity-Linked Savings Scheme (3-year lock-in, market-linked returns)",
            "applicable": True
        },
        {
            "section": "80C",
            "name": "National Pension System (NPS)",
            "limit": 150000,
            "description": "Contribution to NPS Tier-I (retirement planning)",
            "applicable": True
        },
        {
            "section": "80C",
            "name": "Tax-Saving Fixed Deposit",
            "limit": 150000,
            "description": "5-year FD with tax benefit (7% interest)",
            "applicable": True
        },
        {
            "section": "80C",
            "name": "Sukanya Samriddhi Yojana",
            "limit": 150000,
            "description": "For girl child education (8.2% interest)",
            "applicable": profile and profile.get("children_count", 0) > 0
        },
        {
            "section": "80C",
            "name": "Tuition Fees",
            "limit": 150000,
            "description": "School/college fees for up to 2 children",
            "applicable": profile and profile.get("children_count", 0) > 0
        },
        {
            "section": "80CCD(1B)",
            "name": "Additional NPS Contribution",
            "limit": 50000,
            "description": "Additional deduction over 80C limit for NPS",
            "applicable": True
        },
        {
            "section": "80D",
            "name": "Health Insurance - Self & Family",
            "limit": 25000,
            "description": "Premium for health insurance (self, spouse, children)",
            "applicable": True
        },
        {
            "section": "80D",
            "name": "Health Insurance - Parents (Below 60)",
            "limit": 25000,
            "description": "Premium for parents' health insurance",
            "applicable": profile and profile.get("dependent_parents") != "none"
        },
        {
            "section": "80D",
            "name": "Health Insurance - Senior Citizen Parents",
            "limit": 50000,
            "description": "Premium for parents above 60 years",
            "applicable": profile and profile.get("dependent_parents") in ["one_senior", "two_senior"]
        },
        {
            "section": "80E",
            "name": "Education Loan Interest",
            "limit": "No Limit",
            "description": "Interest on education loan for higher studies (for 8 years)",
            "applicable": True
        },
        {
            "section": "80G",
            "name": "Donations to Charity",
            "limit": "50-100% of donation",
            "description": "Donations to registered NGOs, PM Relief Fund, etc.",
            "applicable": True
        },
        {
            "section": "24B",
            "name": "Home Loan Interest",
            "limit": 200000,
            "description": "Interest on home loan for self-occupied property",
            "applicable": profile and profile.get("home_loan_interest", 0) > 0
        },
        {
            "section": "80EE",
            "name": "Home Loan Interest (First-time Buyers)",
            "limit": 50000,
            "description": "Additional deduction for first-time home buyers (loan up to ₹35L, property value up to ₹50L)",
            "applicable": True
        },
        {
            "section": "80TTA",
            "name": "Savings Account Interest",
            "limit": 10000,
            "description": "Interest earned on savings account",
            "applicable": True
        },
        {
            "section": "80TTB",
            "name": "Savings Interest (Senior Citizens)",
            "limit": 50000,
            "description": "Interest on savings/FD for senior citizens",
            "applicable": False
        }
    ]
    
    # Lesser-known benefits
    lesser_known = [
        {
            "name": "TCS (Tax Collected at Source) on Car Purchase",
            "description": "If you buy a car/vehicle above ₹10 lakhs, 1% TCS is collected. This can be claimed as refund in ITR.",
            "how_to_claim": "Show TCS certificate from dealer in ITR filing under 'TCS' section",
            "potential_saving": "₹10,000 - ₹50,000"
        },
        {
            "name": "TCS on Foreign Remittance",
            "description": "TCS of 5% collected on foreign remittance above ₹7 lakhs (under LRS). Can be claimed back.",
            "how_to_claim": "Enter TCS details in ITR under 'Taxes Paid' section",
            "potential_saving": "₹35,000+"
        },
        {
            "name": "Capital Gains Rollover (Section 54)",
            "description": "If you sell a house and buy another within 2 years, capital gains tax is exempt",
            "how_to_claim": "Invest in new property within 2 years, show in ITR",
            "potential_saving": "Entire capital gains tax (20%+)"
        },
        {
            "name": "Capital Gains Exemption (Section 54EC)",
            "description": "Invest capital gains in REC/NHAI bonds within 6 months to save tax",
            "how_to_claim": "Buy bonds up to ₹50 lakhs, 5-year lock-in",
            "potential_saving": "Up to ₹10 lakhs"
        },
        {
            "name": "Standard Deduction",
            "description": "₹50,000 automatic deduction for salaried individuals (no proof needed)",
            "how_to_claim": "Auto-applied in ITR, ensure employer has deducted",
            "potential_saving": "₹15,000 (30% bracket)"
        },
        {
            "name": "Leave Travel Allowance (LTA)",
            "description": "Tax exemption on travel within India (2 journeys in 4 years)",
            "how_to_claim": "Submit travel bills to employer",
            "potential_saving": "Up to ₹30,000"
        },
        {
            "name": "House Rent Allowance (HRA)",
            "description": "If living in rented house, HRA is partially tax-exempt",
            "how_to_claim": "Submit rent receipts to employer",
            "potential_saving": "₹50,000 - ₹1,00,000"
        }
    ]
    
    # Capital gains investment account
    capital_gains_info = {
        "name": "Capital Gains Account Scheme (CGAS)",
        "description": "Special savings account to deposit capital gains and get time to reinvest",
        "benefits": [
            "Deposit sale proceeds before ITR filing due date",
            "Get 2-3 years to find and buy new property",
            "Money earns interest while you search",
            "Prevents immediate tax payment"
        ],
        "how_to_open": [
            "Open account with any nationalized bank",
            "Fill Form A (for immovable property) or Form B (for shares)",
            "Deposit amount within ITR filing deadline",
            "Use funds within 2-3 years for exempt investment"
        ],
        "where_to_open": "SBI, PNB, Bank of Baroda, ICICI, HDFC (nationalized banks preferred)"
    }
    
    return {
        "common_deductions": common_deductions,
        "lesser_known_benefits": lesser_known,
        "capital_gains_account": capital_gains_info,
        "total_potential_saving": "₹2,00,000 - ₹5,00,000 annually"
    }

@api_router.get("/tax-blueprint/wealth-structures")
async def get_wealth_structures_guide(user: User = Depends(require_auth)):
    """Get guide on HUF and Trust structures for wealth management"""
    
    huf_info = {
        "name": "Hindu Undivided Family (HUF)",
        "what_is_it": "A separate legal entity for Hindu families that can own assets and earn income",
        "tax_benefits": [
            "Separate PAN and tax slab (up to ₹2.5L exempt)",
            "Additional ₹1.5L deduction under Section 80C",
            "Can claim all deductions like individual",
            "Total potential saving: ₹78,000/year (30% bracket)"
        ],
        "how_it_works": [
            "Minimum 2 members needed (you + spouse/children)",
            "Karta (head) manages HUF assets",
            "Can transfer ancestral property or gift money to HUF",
            "HUF can run business, invest in stocks, buy property"
        ],
        "pros": [
            "Additional tax exemption (saves ₹78,000/year)",
            "Asset protection (separate from personal assets)",
            "Wealth distribution to family members",
            "Business income can be split"
        ],
        "cons": [
            "Requires maintaining separate accounts",
            "Complex accounting and ITR filing",
            "Cannot dissolve easily",
            "Gift to HUF becomes HUF property permanently"
        ],
        "how_to_setup": [
            "Draft HUF deed on stamp paper (₹100-500)",
            "Apply for HUF PAN card online",
            "Open HUF bank account",
            "Transfer funds as gift (maintain gift deed)",
            "File separate ITR for HUF annually"
        ],
        "ideal_for": "Individuals with income > ₹15 lakhs, ancestral property, or family business",
        "cost": "₹5,000 - ₹20,000 (lawyer + CA fees)"
    }
    
    trust_info = {
        "name": "Private Trust for Asset Protection",
        "what_is_it": "Legal entity to hold and manage assets for beneficiaries (family members)",
        "types": [
            {
                "name": "Revocable Trust",
                "description": "Can be modified/dissolved by settlor",
                "use_case": "Estate planning, will alternative"
            },
            {
                "name": "Irrevocable Trust",
                "description": "Cannot be changed once created",
                "use_case": "Asset protection, creditor protection"
            },
            {
                "name": "Charitable Trust",
                "description": "For social/religious purposes",
                "use_case": "Tax-exempt donations, CSR activities"
            }
        ],
        "benefits_for_asset_tracking": [
            "Centralized ownership of multiple assets",
            "Professional management by trustees",
            "Succession planning (avoids probate)",
            "Asset protection from creditors/lawsuits",
            "Tax efficiency (trust income taxed separately)",
            "Privacy (trust details not public)"
        ],
        "pros": [
            "Assets protected from personal liabilities",
            "Smooth transfer to next generation",
            "Professional asset management",
            "Can avoid probate (faster inheritance)",
            "Tax planning opportunities",
            "Creditor protection for beneficiaries"
        ],
        "cons": [
            "High setup cost (₹50,000 - ₹2,00,000)",
            "Annual compliance (ITR, audit if income > ₹2.5L)",
            "Irrevocable trusts cannot be dissolved",
            "Complex taxation (30% flat rate on income)",
            "Requires professional trustees",
            "Loss of direct control over assets"
        ],
        "how_to_setup": [
            "Consult trust lawyer (estate planning specialist)",
            "Draft trust deed (on stamp paper worth 0.25-1% of asset value)",
            "Register trust with Sub-Registrar",
            "Apply for trust PAN and bank account",
            "Transfer assets to trust (maintain proper documents)",
            "Appoint trustees (minimum 2 recommended)",
            "File annual ITR-7 for trust"
        ],
        "taxation": {
            "trust_income": "30% flat rate (no slabs)",
            "beneficiary_distribution": "Tax-free in hands of beneficiary",
            "capital_gains": "Same as individual (LTCG/STCG rules apply)"
        },
        "ideal_for": "Individuals with assets > ₹1 crore, multiple properties, family business, or succession planning needs",
        "cost_breakdown": {
            "setup": "₹50,000 - ₹2,00,000",
            "stamp_duty": "0.25-1% of asset value",
            "annual_compliance": "₹25,000 - ₹1,00,000",
            "trustee_fees": "Negotiable (family can be trustees)"
        },
        "when_to_consider": [
            "Net worth > ₹1 crore",
            "Multiple immovable properties",
            "Business succession planning needed",
            "Want to protect assets from business risks",
            "Planning for special needs children",
            "Concerned about legal disputes"
        ]
    }
    
    return {
        "huf": huf_info,
        "trust": trust_info,
        "comparison": {
            "huf": {
                "cost": "Low (₹5,000 - ₹20,000)",
                "complexity": "Moderate",
                "tax_benefit": "High (₹78,000+/year)",
                "asset_protection": "Moderate"
            },
            "trust": {
                "cost": "High (₹50,000 - ₹2,00,000)",
                "complexity": "High",
                "tax_benefit": "Moderate",
                "asset_protection": "Very High"
            }
        },
        "recommendation": "Start with HUF for tax benefits, consider Trust when net worth exceeds ₹1 crore"
    }

@api_router.post("/tax-blueprint/generate")
async def generate_blueprint(force_refresh: bool = False, user: User = Depends(require_auth)):
    """Generate AI-powered Tax & Wealth Blueprint"""
    
    # Check if recent blueprint exists (within 30 days)
    if not force_refresh:
        recent_blueprint = await db.tax_blueprints.find_one(
            {
                "user_id": user.id,
                "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
            },
            {"_id": 0}
        )
        if recent_blueprint:
            return recent_blueprint
    
    # Get tax profile
    profile = await db.tax_profiles.find_one({"user_id": user.id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Tax profile not found. Please complete your profile first.")
    
    # Get expense data from last 3 months
    current_date = datetime.now(timezone.utc)
    months = []
    for i in range(3):
        month_date = current_date - timedelta(days=30*i)
        months.append(month_date.strftime("%Y-%m"))
    
    expenses_data = []
    incomes_data = []
    for month in months:
        expenses = await db.monthly_expenses.find({"user_id": user.id, "month": month}, {"_id": 0}).to_list(100)
        incomes = await db.monthly_incomes.find({"user_id": user.id, "month": month}, {"_id": 0}).to_list(100)
        expenses_data.extend(expenses)
        incomes_data.extend(incomes)
    
    # Calculate average monthly expenses by category
    expense_by_category = {}
    for expense in expenses_data:
        category = expense.get("category", "Other")
        amount = expense.get("amount", 0)
        expense_by_category[category] = expense_by_category.get(category, 0) + amount
    
    # Average over 3 months
    avg_expense_by_category = {k: v / max(len(months), 1) for k, v in expense_by_category.items()}
    
    # Calculate average monthly income
    total_income = sum(inc.get("amount_after_tax", 0) for inc in incomes_data)
    avg_monthly_income = total_income / max(len(months), 1) if months else profile.get("monthly_net_income", profile.get("annual_gross_income", 0) / 12)
    
    # Call AI for blueprint generation
    ai_prompt = f"""Generate Tax & Wealth Blueprint for an Indian taxpayer:

INCOME:
- Annual Gross: ₹{profile.get('annual_gross_income', 0):,.0f}
- Monthly Net: ₹{avg_monthly_income:,.0f}
- Tax Regime: {profile.get('tax_regime', 'old')}

FAMILY:
- Status: {profile.get('marital_status', 'single')}
- Children: {profile.get('children_count', 0)}
- Parents: {profile.get('dependent_parents', 'none')}

CURRENT TAX PLANNING:
- 80C Utilized: ₹{profile.get('current_80c_investment', 0):,.0f} / ₹1,50,000
- Health Insurance: ₹{profile.get('health_insurance_self', 0) + profile.get('health_insurance_parents', 0):,.0f}

MONTHLY EXPENSES (Last 3 months avg):
{chr(10).join([f'- {cat}: ₹{amt:,.0f}' for cat, amt in sorted(avg_expense_by_category.items(), key=lambda x: x[1], reverse=True)[:10]])}

GOALS:
- Primary: {', '.join(profile.get('primary_goals', ['Wealth Building']))}
- Timeline: {profile.get('goal_time_horizon', 'long')} term
- Risk Appetite: {profile.get('risk_appetite', 'moderate')}

Please provide:
1. 80C gap analysis with specific instrument recommendations (ELSS, NPS, PPF)
2. Top 3 expense categories where user can reduce spending by 25-40% (Hidden SIP opportunities)
3. Calculate wealth projection for reduced expenses invested at 12% CAGR for 1yr, 5yr, 10yr
4. Provide 5 priority actions ranked by impact and ease
5. Write a motivational summary in simple language

Return response in JSON format matching this structure:
{{
    "section_80c_gap": <amount>,
    "recommendations_80c": [
        {{
            "instrument": "ELSS Mutual Fund",
            "amount": <annual_amount>,
            "monthly_sip": <monthly_amount>,
            "rationale": "<why this suits the user>",
            "expected_return": <amount_after_3_years>,
            "tax_saved": <tax_benefit>,
            "risk_level": "moderate",
            "action": "<specific action>"
        }}
    ],
    "hidden_sip_opportunities": [
        {{
            "category": "<expense_category>",
            "current_monthly": <amount>,
            "reduction_amount": <amount>,
            "reduction_percent": <percentage>,
            "tips": ["<tip1>", "<tip2>", "<tip3>"],
            "wealth_1yr": <projected_amount>,
            "wealth_5yr": <projected_amount>,
            "wealth_10yr": <projected_amount>
        }}
    ],
    "priority_actions": [
        {{
            "rank": 1,
            "action": "<action_description>",
            "impact": "High/Medium/Low",
            "effort": "Easy/Moderate/Hard",
            "expected_saving": <amount>,
            "time": "<time_to_complete>"
        }}
    ],
    "ai_summary": "<personalized motivational message>",
    "confidence_score": <0-100>
}}"""
    
    try:
        # Call AI using Emergent LLM
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if not llm_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        import json
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {llm_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a Senior Financial Planner specializing in Indian tax laws and wealth building for middle-class professionals. Provide practical, actionable advice in simple language. Always return valid JSON."},
                    {"role": "user", "content": ai_prompt}
                ],
                "temperature": 0.7,
                "response_format": {"type": "json_object"}
            },
            timeout=30
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="AI service error")
        
        ai_response = response.json()
        ai_content = json.loads(ai_response["choices"][0]["message"]["content"])
        
    except Exception as e:
        logger.error(f"AI blueprint generation failed: {str(e)}")
        # Fallback to rule-based blueprint
        ai_content = {
            "section_80c_gap": max(150000 - profile.get('current_80c_investment', 0), 0),
            "recommendations_80c": [
                {
                    "instrument": "ELSS Mutual Fund",
                    "amount": 40000,
                    "monthly_sip": 3334,
                    "rationale": "High growth potential with 3-year lock-in. Suits moderate risk appetite.",
                    "expected_return": 52000,
                    "tax_saved": 12000,
                    "risk_level": "moderate",
                    "action": "Start SIP of ₹3,334/month"
                }
            ],
            "hidden_sip_opportunities": [],
            "priority_actions": [
                {
                    "rank": 1,
                    "action": "Max out 80C investments",
                    "impact": "High",
                    "effort": "Easy",
                    "expected_saving": 45000,
                    "time": "5 minutes"
                }
            ],
            "ai_summary": "Complete your tax profile and expense tracking for personalized recommendations.",
            "confidence_score": 60
        }
    
    # Build blueprint from AI response
    section_80c_gap = ai_content.get("section_80c_gap", 0)
    
    recommendations_80c = []
    for rec in ai_content.get("recommendations_80c", []):
        recommendations_80c.append(InstrumentRecommendation(
            instrument=rec.get("instrument", ""),
            suggested_amount=rec.get("amount", 0),
            rationale=rec.get("rationale", ""),
            expected_return=rec.get("expected_return", 0),
            risk_level=rec.get("risk_level", "moderate"),
            monthly_sip=rec.get("monthly_sip", 0),
            tax_saved=rec.get("tax_saved", 0),
            action=rec.get("action", "")
        ))
    
    hidden_opportunities = []
    total_hidden_sip = 0
    for opp in ai_content.get("hidden_sip_opportunities", []):
        reduction = opp.get("reduction_amount", 0)
        total_hidden_sip += reduction
        hidden_opportunities.append(HiddenSIPOpportunity(
            expense_category=opp.get("category", ""),
            current_monthly_spend=opp.get("current_monthly", 0),
            recommended_reduction=reduction,
            reduction_percentage=opp.get("reduction_percent", 0),
            hidden_sip_amount=reduction,
            wealth_projection_1yr=opp.get("wealth_1yr", reduction * 12 * 1.04),
            wealth_projection_5yr=opp.get("wealth_5yr", reduction * 12 * 5 * 1.61),
            wealth_projection_10yr=opp.get("wealth_10yr", reduction * 12 * 10 * 3.11),
            behavioral_tips=opp.get("tips", []),
            action=f"Create SIP of ₹{reduction:,.0f}/month"
        ))
    
    priority_actions = []
    for action in ai_content.get("priority_actions", []):
        priority_actions.append(PriorityAction(
            rank=action.get("rank", 0),
            action=action.get("action", ""),
            impact=action.get("impact", "Medium"),
            effort=action.get("effort", "Moderate"),
            expected_saving=action.get("expected_saving", 0),
            time_to_complete=action.get("time", "")
        ))
    
    # Calculate total savings opportunity
    tax_saved_80c = section_80c_gap * 0.30  # Assuming 30% tax bracket
    total_opportunity = tax_saved_80c + (total_hidden_sip * 12)
    
    # Current and optimized savings
    current_savings = avg_monthly_income - sum(avg_expense_by_category.values())
    optimized_savings = current_savings + total_hidden_sip
    
    # Wealth projections (12% CAGR)
    def calculate_sip_value(monthly_amount, years, rate=0.12):
        months = years * 12
        monthly_rate = rate / 12
        if monthly_rate == 0:
            return monthly_amount * months
        return monthly_amount * ((pow(1 + monthly_rate, months) - 1) / monthly_rate) * (1 + monthly_rate)
    
    # Create blueprint
    blueprint = TaxBlueprint(
        user_id=user.id,
        financial_year="FY2024-25",
        estimated_tax_liability=0,
        current_tax_saved=profile.get('current_80c_investment', 0) * 0.30,
        section_80c_utilized=profile.get('current_80c_investment', 0),
        section_80c_gap=section_80c_gap,
        section_80c_recommendations=recommendations_80c,
        total_tax_saving_opportunity=total_opportunity,
        hidden_sip_opportunities=hidden_opportunities,
        total_hidden_sip_potential=total_hidden_sip,
        current_monthly_savings=current_savings,
        optimized_monthly_savings=optimized_savings,
        projected_wealth_1yr=calculate_sip_value(optimized_savings, 1),
        projected_wealth_3yr=calculate_sip_value(optimized_savings, 3),
        projected_wealth_5yr=calculate_sip_value(optimized_savings, 5),
        projected_wealth_10yr=calculate_sip_value(optimized_savings, 10),
        priority_actions=priority_actions,
        ai_summary=ai_content.get("ai_summary", "Complete your profile for detailed recommendations."),
        confidence_score=ai_content.get("confidence_score", 75)
    )
    
    # Save to database
    blueprint_dict = blueprint.model_dump()
    blueprint_dict['generated_at'] = blueprint_dict['generated_at'].isoformat()
    blueprint_dict['expires_at'] = blueprint_dict['expires_at'].isoformat()
    
    await db.tax_blueprints.insert_one(blueprint_dict)
    
    return blueprint

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
    demo_prefix = f"demo_{user.id}_"
    if user.demo_mode:
        portfolios = await db.portfolio_assets.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }, {"_id": 0}).to_list(1000)
    else:
        portfolios = await db.portfolio_assets.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }, {"_id": 0}).to_list(1000)
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
    IMPORTANT: Only includes assets AND portfolios created ON or BEFORE the snapshot date for accurate historical tracking.
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
    
    # Get all portfolios for this user
    all_portfolios = await db.portfolio_assets.find({"user_id": user_id}).to_list(1000)
    
    # Filter portfolios: only include those created on or before snapshot date
    portfolios = []
    for portfolio in all_portfolios:
        created_at = portfolio.get("created_at")
        if created_at:
            # Parse created_at and compare
            if isinstance(created_at, str):
                created_date = created_at.split('T')[0]  # Get date part
            else:
                created_date = created_at.date().isoformat()
            
            if created_date <= snapshot_date:
                portfolios.append(portfolio)
        else:
            # Include portfolios without created_at (assume they existed)
            portfolios.append(portfolio)
    
    # Define liability types
    liability_types = {'loan', 'credit_card'}
    
    total_assets_value = 0.0
    total_liabilities_value = 0.0
    asset_breakdown = {}
    liability_breakdown = {}
    
    # Process individual assets
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
    
    # Process portfolios
    for portfolio in portfolios:
        portfolio_type = "portfolio"
        portfolio_currency = portfolio.get("purchase_currency", "USD")
        portfolio_value_original = portfolio.get("total_value", 0.0)
        
        # Convert portfolio value to target currency
        portfolio_value_converted = convert_currency(
            portfolio_value_original,
            portfolio_currency,
            currency
        )
        
        total_assets_value += portfolio_value_converted
        asset_breakdown[portfolio_type] = asset_breakdown.get(portfolio_type, 0) + portfolio_value_converted
    
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

# Subscription Plan Features
SUBSCRIPTION_FEATURES = {
    "Free": {
        "max_assets": 10,
        "max_documents": 5,
        "storage_mb": 50,  # 50 MB
        "ai_insights": False,
        "scheduled_messages": False,
        "dms": False,
        "portfolio_tracking": False
    },
    "Pro": {
        "max_assets": 100,
        "max_documents": 50,
        "storage_mb": 5120,  # 5 GB
        "ai_insights": True,
        "scheduled_messages": True,
        "dms": True,
        "portfolio_tracking": True
    },
    "Family": {
        "max_assets": -1,  # Unlimited
        "max_documents": -1,  # Unlimited
        "storage_mb": 51200,  # 50 GB
        "ai_insights": True,
        "scheduled_messages": True,
        "dms": True,
        "portfolio_tracking": True
    }
}

def check_subscription_limit(user: User, feature: str) -> bool:
    """Check if user's subscription allows a feature."""
    plan = getattr(user, 'subscription_plan', 'Free')
    features = SUBSCRIPTION_FEATURES.get(plan, SUBSCRIPTION_FEATURES["Free"])
    return features.get(feature, False)

async def get_user_storage_usage(user_id: str) -> int:
    """Calculate total storage used by user in bytes."""
    documents = await db.documents.find({"user_id": user_id}).to_list(1000)
    total_bytes = sum(doc.get("file_size", 0) for doc in documents)
    return total_bytes

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

# =======================
# Loan Repayment Calculator
# =======================

class LoanCalculatorRequest(BaseModel):
    principal: float
    annual_interest_rate: float  # e.g., 8.5 for 8.5%
    tenure_months: int
    loan_type: str = "personal"  # personal, home, auto, credit_card
    
class AmortizationEntry(BaseModel):
    month: int
    payment: float
    principal_payment: float
    interest_payment: float
    remaining_balance: float
    
class LoanCalculatorResponse(BaseModel):
    monthly_payment: float
    total_interest: float
    total_amount: float
    amortization_schedule: List[AmortizationEntry]
    ai_tips: Optional[str] = None

def calculate_amortization(principal: float, monthly_rate: float, tenure_months: int) -> List[Dict[str, float]]:
    """Calculate loan amortization schedule"""
    schedule = []
    remaining_balance = principal
    
    # Calculate monthly payment using loan formula
    if monthly_rate == 0:
        monthly_payment = principal / tenure_months
    else:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate) ** tenure_months) / ((1 + monthly_rate) ** tenure_months - 1)
    
    for month in range(1, tenure_months + 1):
        interest_payment = remaining_balance * monthly_rate
        principal_payment = monthly_payment - interest_payment
        remaining_balance = remaining_balance - principal_payment
        
        # Handle rounding issues for last payment
        if month == tenure_months:
            remaining_balance = 0
            
        schedule.append({
            "month": month,
            "payment": round(monthly_payment, 2),
            "principal_payment": round(principal_payment, 2),
            "interest_payment": round(interest_payment, 2),
            "remaining_balance": round(max(0, remaining_balance), 2)
        })
    
    return schedule

@api_router.post("/loan-calculator")
async def calculate_loan_repayment(request: LoanCalculatorRequest, user: User = Depends(require_auth)):
    """Calculate loan repayment schedule with AI-powered debt reduction tips"""
    try:
        # Calculate monthly rate
        monthly_rate = (request.annual_interest_rate / 100) / 12
        
        # Generate amortization schedule
        schedule = calculate_amortization(request.principal, monthly_rate, request.tenure_months)
        
        # Calculate totals
        total_payment = sum([entry["payment"] for entry in schedule])
        total_interest = total_payment - request.principal
        monthly_payment = schedule[0]["payment"] if schedule else 0
        
        # Generate AI tips using OpenAI GPT-5 (with timeout and fallback)
        ai_tips = ""
        try:
            api_key = os.getenv("EMERGENT_LLM_KEY")
            if api_key:
                from emergentintegrations.llm.chat import LlmChat, UserMessage
                
                # Use asyncio.wait_for to add timeout
                async def generate_tips():
                    chat = LlmChat(
                        api_key=api_key,
                        session_id=f"loan_tips_{user.id}_{datetime.now().timestamp()}",
                        system_message="You are a financial advisor specializing in debt reduction and loan management. Provide practical, actionable advice."
                    ).with_model("openai", "gpt-5")
                    
                    user_message = UserMessage(
                        text=f"""Analyze this loan and provide 3-5 specific, actionable tips for debt reduction:
                        
Loan Type: {request.loan_type.title()}
Principal Amount: ${request.principal:,.2f}
Interest Rate: {request.annual_interest_rate}%
Tenure: {request.tenure_months} months
Monthly Payment: ${monthly_payment:,.2f}
Total Interest: ${total_interest:,.2f}

Focus on practical strategies like:
- Extra payment opportunities
- Refinancing considerations
- Payment timing optimization
- Debt avalanche vs snowball methods
- Budget adjustments

Keep tips concise and numbered. Avoid generic advice."""
                    )
                    
                    return await chat.send_message(user_message)
                
                # Add 15 second timeout for AI generation
                ai_tips = await asyncio.wait_for(generate_tips(), timeout=15.0)
            else:
                ai_tips = "AI tips feature requires API key configuration."
        except asyncio.TimeoutError:
            logger.warning(f"AI tips generation timed out for user {user.id}")
            ai_tips = "AI tips generation timed out. Please try again later or continue with the calculation results below."
        except Exception as ai_error:
            logger.error(f"AI tips generation failed: {str(ai_error)}")
            ai_tips = "AI tips temporarily unavailable. The calculation results below are still accurate."
        
        return {
            "monthly_payment": round(monthly_payment, 2),
            "total_interest": round(total_interest, 2),
            "total_amount": round(total_payment, 2),
            "amortization_schedule": schedule,
            "ai_tips": ai_tips
        }
        
    except Exception as e:
        logger.error(f"Loan calculator error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)

# CORS configuration for production
# For cross-origin requests with credentials, we need specific origins
cors_origins_str = os.environ.get('CORS_ORIGINS', '')

if cors_origins_str and cors_origins_str != '*':
    # Production with specific origins configured
    cors_origins = [origin.strip() for origin in cors_origins_str.split(',')]
    allow_origin_regex = None
    logger.info(f"CORS: Configured for specific origins: {cors_origins}")
else:
    # Development/testing: Use regex to match common patterns
    # This allows any subdomain of emergent.host and emergentagent.com, plus localhost
    cors_origins = []  # Must be empty when using regex
    allow_origin_regex = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://[a-zA-Z0-9\-]+\.(emergent\.host|emergentagent\.com)$|^https://zivinc\.com$"
    logger.info("CORS: Using regex pattern for development (supports localhost, *.emergent.host, *.emergentagent.com, zivinc.com)")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_origin_regex=allow_origin_regex,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("startup")
async def startup_scheduler():
    """Start the background job scheduler and seed test account"""
    logger.info("Starting background job scheduler...")
    start_scheduler()
    
    # Seed universal test account for demo mode
    await seed_universal_test_account()

async def seed_universal_test_account():
    """Create universal test account that all demo users can access"""
    test_account_id = "test_account_universal"
    
    # Check if test account already exists
    existing_user = await db.users.find_one({"id": test_account_id})
    if existing_user:
        return  # Already exists
    
    # Create test user
    test_user = {
        "id": test_account_id,
        "email": "demo.portfolio@assetvault.com",
        "name": "AssetVault Demo Portfolio",
        "picture": None,
        "role": "customer",
        "demo_mode": False,
        "last_activity": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "subscription_plan": "Family"
    }
    await db.users.insert_one(test_user)
    
    # Create comprehensive test assets
    test_assets = [
        # USA Assets
        {
            "id": f"test_bank_us1",
            "user_id": test_account_id,
            "name": "Wells Fargo Premier Checking",
            "type": "bank",
            "purchase_currency": "USD",
            "purchase_date": "2022-01-15",
            "total_value": 125000,
            "current_value": 127500,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"test_crypto_btc1",
            "user_id": test_account_id,
            "name": "Bitcoin Investment",
            "type": "crypto",
            "symbol": "BTC",
            "purchase_currency": "USD",
            "purchase_date": "2021-05-10",
            "quantity": 2.5,
            "unit_price": 35000,
            "current_unit_price": 95000,
            "total_value": 87500,
            "current_value": 237500,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"test_property_us1",
            "user_id": test_account_id,
            "name": "Luxury Penthouse - Manhattan",
            "type": "property",
            "purchase_currency": "USD",
            "purchase_date": "2019-03-20",
            "area": 3500,
            "area_unit": "sqft",
            "price_per_area": 1200,
            "current_price_per_area": 1650,
            "total_value": 4200000,
            "current_value": 5775000,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Singapore Assets
        {
            "id": f"test_bank_sg1",
            "user_id": test_account_id,
            "name": "OCBC Premium Banking Account",
            "type": "bank",
            "purchase_currency": "SGD",
            "purchase_date": "2022-06-01",
            "total_value": 180000,
            "current_value": 185000,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # UK Assets
        {
            "id": f"test_stock_uk1",
            "user_id": test_account_id,
            "name": "HSBC Holdings PLC",
            "type": "stock",
            "symbol": "HSBA.L",
            "purchase_currency": "GBP",
            "purchase_date": "2021-09-15",
            "quantity": 5000,
            "unit_price": 4.5,
            "current_unit_price": 6.2,
            "total_value": 22500,
            "current_value": 31000,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.assets.insert_many(test_assets)
    logger.info("Universal test account seeded successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Shutdown database client and scheduler"""
    logger.info("Shutting down...")
    stop_scheduler()
    client.close()
