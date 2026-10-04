"""Pydantic models for the API."""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta


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
    onboarding_completed: bool = False  # Track if user has completed onboarding
    color_theme: str = "dark"  # UI color theme preference (dark/light)
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
    reminder_method: str = "email"  # email, phone, or both

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
    demo_mode: bool = False  # Whether this is demo data
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
    demo_mode: bool = False  # Whether this is demo data
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
    
    demo_mode: bool = False  # Whether this is demo data
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

class NRITaxAnalysis(BaseModel):
    tax_on_indian_income: str = ""
    dtaa_benefits: str = ""
    account_recommendations: str = ""
    repatriation_rules: str = ""
    investment_restrictions: str = ""
    compliance_requirements: str = ""
    recommended_investments: List[str] = []

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
    
    # NRI-Specific Analysis
    nri_analysis: Optional[NRITaxAnalysis] = None
    
    demo_mode: bool = False  # Whether this is demo data
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

# =======================
# Loan Repayment Calculator
# =======================

class LoanCalculatorRequest(BaseModel):
    principal: float
    annual_interest_rate: float  # e.g., 8.5 for 8.5%
    tenure_months: int
    loan_type: str = "personal"  # personal, home, auto, credit_card, education, business
    
class PrepaymentOption(BaseModel):
    type: str  # one_time, monthly_extra, annual_extra
    amount: float
    start_month: int = 1
    
class PrepaymentScenario(BaseModel):
    monthly_payment: float
    total_interest: float
    total_amount: float
    tenure_months: int
    interest_saved: float
    time_saved_months: int
    amortization_schedule: List[Dict]
    
class TaxBenefit(BaseModel):
    loan_type: str
    principal_deduction: float  # 80C
    interest_deduction: float  # 24(b) or 80E
    total_tax_saved: float
    effective_interest_rate: float
    tax_bracket: float
    
class RefinanceComparison(BaseModel):
    current_remaining_payment: float
    new_total_payment: float
    closing_costs: float
    net_savings: float
    breakeven_months: int
    should_refinance: bool
    monthly_savings: float

class MultiLoanStrategy(BaseModel):
    strategy_name: str  # avalanche or snowball
    total_interest: float
    payoff_months: int
    monthly_payment: float
    payment_order: List[Dict]
    
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
    prepayment_scenarios: Optional[Dict[str, PrepaymentScenario]] = None
    tax_benefits: Optional[TaxBenefit] = None
    principal_vs_interest_split: Optional[Dict] = None
