"""API routes: tax blueprint."""
from fastapi import APIRouter, HTTPException, Depends
import os
from datetime import datetime, timezone, timedelta
import requests
import json

from core.auth import require_auth
from core.config import db, logger
from core.models import HiddenSIPOpportunity, InstrumentRecommendation, NRITaxAnalysis, PriorityAction, RegimeComparison, TaxBlueprint, TaxProfile, TaxProfileCreate, User

router = APIRouter()

# Income & Expense Models and Routes continue...

# Tax & Wealth Blueprint Routes
@router.post("/tax-blueprint/profile")
async def create_tax_profile(profile_data: TaxProfileCreate, user: User = Depends(require_auth)):
    """Create or update user's tax profile"""
    try:
        # Validate income
        if profile_data.annual_gross_income <= 0:
            raise HTTPException(status_code=400, detail="Annual gross income must be greater than 0")
        
        # Check if profile already exists (filter by demo_mode to match GET behavior)
        existing_profile = await db.tax_profiles.find_one({"user_id": user.id, "demo_mode": user.demo_mode}, {"_id": 0})
        
        if existing_profile:
            # Update existing profile
            update_dict = profile_data.model_dump()
            update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            await db.tax_profiles.update_one(
                {"user_id": user.id, "demo_mode": user.demo_mode},
                {"$set": update_dict}
            )
            profile_id = existing_profile["id"]
        else:
            # Create new profile
            profile = TaxProfile(
                user_id=user.id,
                demo_mode=user.demo_mode,  # Track demo/live
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

@router.get("/tax-blueprint/profile")
async def get_tax_profile(user: User = Depends(require_auth)):
    """Retrieve user's tax profile"""
    profile = await db.tax_profiles.find_one({"user_id": user.id, "demo_mode": user.demo_mode}, {"_id": 0})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Tax profile not found")
    
    return profile

@router.get("/tax-blueprint/regime-comparison")
async def get_regime_comparison(user: User = Depends(require_auth)):
    """Compare Old vs New tax regime for user"""
    profile = await db.tax_profiles.find_one({"user_id": user.id, "demo_mode": user.demo_mode}, {"_id": 0})
    
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

@router.get("/tax-blueprint/tax-benefits-guide")
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

@router.get("/tax-blueprint/wealth-structures")
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

@router.post("/tax-blueprint/generate")
async def generate_blueprint(force_refresh: bool = False, user: User = Depends(require_auth)):
    """Generate AI-powered Tax & Wealth Blueprint"""
    
    # Check if recent blueprint exists (within 30 days) - filter by demo/live mode
    if not force_refresh:
        recent_blueprint = await db.tax_blueprints.find_one(
            {
                "user_id": user.id,
                "demo_mode": user.demo_mode,
                "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
            },
            {"_id": 0}
        )
        if recent_blueprint:
            return recent_blueprint
    
    # Get tax profile - filter by demo/live mode
    profile = await db.tax_profiles.find_one({"user_id": user.id, "demo_mode": user.demo_mode}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Tax profile not found. Please complete your profile first.")
    
    # Get expense data from last 3 months - filter by demo/live mode
    current_date = datetime.now(timezone.utc)
    months = []
    for i in range(3):
        month_date = current_date - timedelta(days=30*i)
        months.append(month_date.strftime("%Y-%m"))
    
    expenses_data = []
    incomes_data = []
    for month in months:
        expenses = await db.monthly_expenses.find({"user_id": user.id, "month": month, "demo_mode": user.demo_mode}, {"_id": 0}).to_list(100)
        incomes = await db.monthly_incomes.find({"user_id": user.id, "month": month, "demo_mode": user.demo_mode}, {"_id": 0}).to_list(100)
        expenses_data.extend(expenses)
        incomes_data.extend(incomes)
    
    # Calculate average monthly expenses by category
    expense_by_category = {}
    for expense in expenses_data:
        category = expense.get("category", "Other")
        amount = expense.get("amount", 0)
        expense_by_category[category] = expense_by_category.get(category, 0) + amount
    
    # Calculate average monthly income first
    total_income = sum(inc.get("amount_after_tax", 0) for inc in incomes_data)
    avg_monthly_income = total_income / max(len(months), 1) if months else profile.get("monthly_net_income", profile.get("annual_gross_income", 0) / 12)
    
    # Average over 3 months
    avg_expense_by_category = {k: v / max(len(months), 1) for k, v in expense_by_category.items()}
    
    # If no expense data, provide estimated categories based on income
    if not avg_expense_by_category and avg_monthly_income > 0:
        # Industry standard expense ratios for Indian middle class
        estimated_expenses = {
            "Food & Dining": avg_monthly_income * 0.15,  # 15%
            "Entertainment": avg_monthly_income * 0.08,   # 8%
            "Shopping": avg_monthly_income * 0.10,        # 10%
            "Transportation": avg_monthly_income * 0.08,  # 8%
            "Subscriptions": avg_monthly_income * 0.03    # 3%
        }
        avg_expense_by_category = estimated_expenses
    
    # Call AI for blueprint generation
    residential_status = profile.get('residential_status', 'resident')
    is_nri = residential_status in ['nri', 'rnor']
    
    ai_prompt = f"""Generate Tax & Wealth Blueprint for an Indian taxpayer:

INCOME:
- Annual Gross: ₹{profile.get('annual_gross_income', 0):,.0f}
- Monthly Net: ₹{avg_monthly_income:,.0f}
- Tax Regime: {profile.get('tax_regime', 'old')}
- Residential Status: {residential_status.upper()} {'(Non-Resident Indian)' if is_nri else '(Resident Indian)'}

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
2. Top 3 expense categories where user can reduce spending by 25-40% (Hidden SIP opportunities) - MANDATORY even if expenses are estimated
3. Calculate wealth projection for reduced expenses invested at 12% CAGR for 1yr, 5yr, 10yr
4. Provide 5 priority actions ranked by impact and ease
5. Write a motivational summary in simple language
{f'''
6. NRI-SPECIFIC ANALYSIS (IMPORTANT):
   - Tax on Indian income (rental, interest, capital gains) - rates and TDS implications
   - DTAA benefits if residing in {profile.get('country_of_residence', 'applicable country')}
   - NRE/NRO account recommendations and tax treatment
   - Repatriation rules for funds
   - Investment restrictions (no PPF, limited NPS, etc.)
   - Form 15CA/15CB requirements for foreign remittances
   - Consider NRI-specific mutual funds and bonds
''' if is_nri else ''}

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
    "confidence_score": <0-100>{f''',
    "nri_specific": {{
        "tax_on_indian_income": "<explanation of TDS rates on rental, interest, capital gains>",
        "dtaa_benefits": "<how to claim DTAA benefits>",
        "account_recommendations": "<NRE vs NRO recommendations>",
        "repatriation_rules": "<fund transfer rules>",
        "investment_restrictions": "<what NRIs cannot invest in>",
        "compliance_requirements": "<Form 15CA/15CB and other requirements>",
        "recommended_investments": ["<NRI-friendly investment options>"]
    }}''' if is_nri else ''}
}}"""
    
    try:
        # Call AI using Emergent LLM
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if not llm_key:
            logger.warning("EMERGENT_LLM_KEY not configured, using fallback recommendations")
            raise Exception("AI key not configured")
        
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
            logger.error(f"AI API error: {response.status_code} - {response.text}")
            raise Exception("AI service error")
        
        ai_response = response.json()
        ai_content = json.loads(ai_response["choices"][0]["message"]["content"])
        
    except Exception as e:
        logger.error(f"AI blueprint generation failed: {str(e)}")
        # Fallback to rule-based blueprint
        section_80c_gap_val = max(150000 - profile.get('current_80c_investment', 0), 0)
        
        # Generate hidden SIP opportunities from expense data
        fallback_hidden_sips = []
        if avg_expense_by_category:
            # Find top 3 expense categories
            sorted_expenses = sorted(avg_expense_by_category.items(), key=lambda x: x[1], reverse=True)[:3]
            for category, amount in sorted_expenses:
                if amount > 1000:  # Only if spending > ₹1000
                    reduction_pct = 25  # Suggest 25% reduction
                    reduction_amt = amount * 0.25
                    fallback_hidden_sips.append({
                        "category": category,
                        "current_monthly": amount,
                        "reduction_amount": reduction_amt,
                        "reduction_percent": reduction_pct,
                        "tips": [
                            f"Track your {category.lower()} spending daily",
                            f"Set a monthly budget of ₹{amount * 0.75:.0f}",
                            "Look for more cost-effective alternatives"
                        ],
                        "wealth_1yr": reduction_amt * 12 * 1.04,
                        "wealth_5yr": reduction_amt * 12 * 5 * 1.61,
                        "wealth_10yr": reduction_amt * 12 * 10 * 3.11
                    })
        
        ai_content = {
            "section_80c_gap": section_80c_gap_val,
            "recommendations_80c": [
                {
                    "instrument": "ELSS Mutual Fund",
                    "amount": min(section_80c_gap_val, 60000) if section_80c_gap_val > 0 else 40000,
                    "monthly_sip": min(section_80c_gap_val, 60000) / 12 if section_80c_gap_val > 0 else 3334,
                    "rationale": "High growth potential with 3-year lock-in. Suits moderate risk appetite.",
                    "expected_return": 52000,
                    "tax_saved": 12000,
                    "risk_level": "moderate",
                    "action": f"Start SIP of ₹{min(section_80c_gap_val, 60000) / 12:.0f}/month" if section_80c_gap_val > 0 else "Start SIP of ₹3,334/month"
                },
                {
                    "instrument": "Public Provident Fund (PPF)",
                    "amount": min(section_80c_gap_val - 60000, 50000) if section_80c_gap_val > 60000 else 30000,
                    "monthly_sip": (min(section_80c_gap_val - 60000, 50000) if section_80c_gap_val > 60000 else 30000) / 12,
                    "rationale": "Safe, tax-free returns at 7.1%. Good for risk-averse investors.",
                    "expected_return": 35000,
                    "tax_saved": 9000,
                    "risk_level": "low",
                    "action": "Open PPF account at nearest post office or bank"
                }
            ],
            "hidden_sip_opportunities": fallback_hidden_sips,
            "priority_actions": [
                {
                    "rank": 1,
                    "action": "Complete 80C limit to save ₹45,000 in taxes",
                    "impact": "High",
                    "effort": "Easy",
                    "expected_saving": section_80c_gap_val * 0.30,
                    "time": "10 minutes"
                },
                {
                    "rank": 2,
                    "action": "Start tracking expenses in Income & Expense section",
                    "impact": "High",
                    "effort": "Easy",
                    "expected_saving": 0,
                    "time": "5 minutes daily"
                },
                {
                    "rank": 3,
                    "action": "Review and claim lesser-known tax benefits (TCS, LTA, HRA)",
                    "impact": "Medium",
                    "effort": "Moderate",
                    "expected_saving": 30000,
                    "time": "30 minutes"
                }
            ],
            "ai_summary": "You have ₹" + f"{section_80c_gap_val:,.0f}" + " gap in Section 80C. Start with ELSS for growth and PPF for safety. Track your expenses to unlock more savings opportunities.",
            "confidence_score": 65
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
    
    # Use AI-provided hidden SIPs or fallback to generated ones
    ai_hidden_sips = ai_content.get("hidden_sip_opportunities", [])
    hidden_sip_data = ai_hidden_sips if len(ai_hidden_sips) > 0 else fallback_hidden_sips
    
    hidden_opportunities = []
    total_hidden_sip = 0
    for opp in hidden_sip_data:
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
    
    # Parse NRI-specific analysis if available
    nri_analysis_data = None
    if is_nri and "nri_specific" in ai_content:
        nri_data = ai_content["nri_specific"]
        nri_analysis_data = NRITaxAnalysis(
            tax_on_indian_income=nri_data.get("tax_on_indian_income", ""),
            dtaa_benefits=nri_data.get("dtaa_benefits", ""),
            account_recommendations=nri_data.get("account_recommendations", ""),
            repatriation_rules=nri_data.get("repatriation_rules", ""),
            investment_restrictions=nri_data.get("investment_restrictions", ""),
            compliance_requirements=nri_data.get("compliance_requirements", ""),
            recommended_investments=nri_data.get("recommended_investments", [])
        )
    
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
        confidence_score=ai_content.get("confidence_score", 75),
        nri_analysis=nri_analysis_data,
        demo_mode=user.demo_mode  # Track demo/live
    )
    
    # Save to database
    blueprint_dict = blueprint.model_dump()
    blueprint_dict['generated_at'] = blueprint_dict['generated_at'].isoformat()
    blueprint_dict['expires_at'] = blueprint_dict['expires_at'].isoformat()
    
    await db.tax_blueprints.insert_one(blueprint_dict)
    
    return blueprint
