# The Tax & Wealth Blueprint - Feature Specification

## Executive Summary

**Feature Name:** Sankalp Planner - The Tax & Wealth Blueprint  
**Tagline:** "अपने सपनों को सच करें - Save Smart, Grow Wealth"  
**Target Users:** Indian middle-class salaried professionals (₹6L - ₹25L annual income)  
**Core Value Proposition:** Transform hidden tax savings and wasted expenses into a ₹50L+ wealth creation roadmap

---

## 1. USER PROFILING QUESTIONNAIRE

### Phase 1: Financial Identity (Required)
```
1. What's your employment status?
   ○ Salaried Employee (Private Sector)
   ○ Salaried Employee (Government/PSU)
   ○ Self-Employed/Business Owner
   ○ Freelancer/Consultant
   ○ Retired

2. Your Annual Gross Income (₹):
   ○ Below 5 Lakhs
   ○ 5-10 Lakhs
   ○ 10-15 Lakhs
   ○ 15-25 Lakhs
   ○ Above 25 Lakhs

3. Current Tax Regime:
   ○ Old Regime (with 80C deductions)
   ○ New Regime (lower rates, no deductions)
   ○ Not sure - Help me decide

4. Residential Status for Tax:
   ○ Resident Indian
   ○ Non-Resident Indian (NRI)
   ○ Resident but Not Ordinarily Resident (RNOR)
```

### Phase 2: Family & Dependents (Required)
```
5. Marital Status:
   ○ Single
   ○ Married (Spouse earning)
   ○ Married (Spouse non-earning/homemaker)
   ○ Divorced/Separated

6. Number of Children:
   ○ None
   ○ 1 child
   ○ 2 children
   ○ 3+ children

7. Children's Age Groups (if applicable):
   □ Below 5 years (Early Childhood)
   □ 5-12 years (Primary Education)
   □ 13-18 years (Secondary Education)
   □ 18+ years (College/Higher Education)

8. Dependent Parents:
   ○ No dependent parents
   ○ One parent (above 60)
   ○ Two parents (above 60)
   ○ Parents with disabilities
```

### Phase 3: Financial Goals (Required)
```
9. Primary Financial Goals (Select all that apply):
   □ Child's Higher Education (₹20-50L)
   □ Child's Wedding (₹10-30L)
   □ Retirement Corpus (₹1-5Cr)
   □ Buying Home/Real Estate (₹50L-2Cr)
   □ Emergency Fund (6-12 months expenses)
   □ Debt-Free Life
   □ Early Retirement (before 50)

10. Time Horizon for Major Goal:
    ○ 0-3 years (Short-term)
    ○ 3-7 years (Medium-term)
    ○ 7-15 years (Long-term)
    ○ 15+ years (Retirement planning)

11. Risk Appetite:
    ○ Conservative (Fixed Deposits, PPF only)
    ○ Moderate (Mix of equity and debt)
    ○ Aggressive (High equity exposure acceptable)
```

### Phase 4: Current Tax Planning (Required)
```
12. Current 80C Investments (Annual):
    ○ ₹0 - Not started
    ○ ₹1 - ₹50,000
    ○ ₹50,000 - ₹1,00,000
    ○ ₹1,00,000 - ₹1,50,000
    ○ ₹1,50,000 (Maxed out)

13. Existing 80C Instruments (Select all):
    □ PPF (Public Provident Fund)
    □ ELSS (Tax-Saving Mutual Funds)
    □ NPS (National Pension System)
    □ Life Insurance Premium
    □ Home Loan Principal Repayment
    □ Tax-Saving FDs
    □ Tuition Fees (Children)
    □ EPF (Employee Provident Fund)

14. Health Insurance Coverage:
    ○ No health insurance
    ○ Self only (under ₹5L)
    ○ Self + Family (₹5-10L)
    ○ Self + Family + Parents (₹10L+)
```

### Phase 5: Advanced Tax Optimization (Optional but Recommended)
```
15. Home Loan Status:
    ○ No home loan
    ○ Have home loan (claiming 24B interest deduction)
    ○ Planning to take home loan

16. Additional Income Sources:
    □ Rental Income
    □ Capital Gains from Stock Trading
    □ Freelance/Consulting Income
    □ Interest Income from FDs/Savings

17. Educational Loan (For Children):
    ○ No educational loan
    ○ Have educational loan (claiming 80E deduction)

18. Donations to Charity (80G):
    ○ No donations
    ○ Regular donor (annual donations)
```

### Phase 6: Expense Profile (Auto-extracted + Manual)
```
19. Monthly Rent/EMI: ₹________
20. Monthly Groceries & Household: ₹________
21. Monthly Utilities (Electricity, Water, Gas): ₹________
22. Monthly Transport (Fuel/Public Transport): ₹________
23. Monthly Subscriptions (OTT, Gym, etc.): ₹________
24. Monthly Dining Out & Entertainment: ₹________
25. Monthly Shopping & Lifestyle: ₹________
26. Monthly Medical & Healthcare: ₹________
27. Monthly Education (Tuition, Books): ₹________
28. Monthly Others/Miscellaneous: ₹________
```

---

## 2. DATA MODELS

### A. TaxProfile (New Collection)
```javascript
{
  id: string,
  user_id: string,
  
  // Employment & Income
  employment_status: enum["salaried_private", "salaried_govt", "self_employed", "freelancer", "retired"],
  annual_gross_income: number,
  monthly_net_income: number,
  tax_regime: enum["old", "new", "undecided"],
  residential_status: enum["resident", "nri", "rnor"],
  
  // Family Structure
  marital_status: enum["single", "married_earning", "married_non_earning", "divorced"],
  children_count: number,
  children_age_groups: array[string],
  dependent_parents: enum["none", "one_senior", "two_senior", "disabled"],
  
  // Financial Goals
  primary_goals: array[string],
  goal_time_horizon: enum["short", "medium", "long", "retirement"],
  risk_appetite: enum["conservative", "moderate", "aggressive"],
  
  // Current 80C Status
  current_80c_investment: number,
  existing_80c_instruments: array[{
    type: string,
    annual_contribution: number,
    lock_in_years: number
  }],
  
  // Health Insurance (80D)
  health_insurance_self: number,
  health_insurance_parents: number,
  
  // Other Deductions
  home_loan_principal: number,      // 80C
  home_loan_interest: number,       // 24B (up to ₹2L)
  education_loan_interest: number,  // 80E
  donations_80g: number,
  nps_additional: number,           // 80CCD(1B) - additional ₹50k
  
  // Additional Income
  rental_income: number,
  capital_gains: number,
  other_income: number,
  
  created_at: datetime,
  updated_at: datetime
}
```

### B. ExpenseProfile (New Collection)
```javascript
{
  id: string,
  user_id: string,
  month: string,  // YYYY-MM
  
  // Fixed Expenses
  rent_emi: number,
  utilities: number,
  insurance_premiums: number,
  education_fees: number,
  
  // Variable Essentials
  groceries: number,
  transport: number,
  medical: number,
  
  // Discretionary Expenses
  subscriptions: array[{
    name: string,
    amount: number,
    category: string,
    necessity_score: number  // AI-calculated 0-10
  }],
  dining_out: number,
  entertainment: number,
  shopping: number,
  travel: number,
  miscellaneous: number,
  
  // Calculated Fields
  total_essential: number,
  total_discretionary: number,
  savings_rate: number,  // (Income - Expenses) / Income
  
  created_at: datetime
}
```

### C. TaxBlueprint (New Collection - AI Generated Insights)
```javascript
{
  id: string,
  user_id: string,
  financial_year: string,  // FY2024-25
  
  // Tax Analysis
  estimated_tax_liability: number,
  current_tax_saved: number,
  
  // 80C Analysis
  section_80c: {
    max_limit: 150000,
    utilized: number,
    remaining_gap: number,
    recommended_instruments: array[{
      instrument: string,
      suggested_amount: number,
      rationale: string,
      expected_return: number,
      risk_level: string
    }]
  },
  
  // Other Deductions
  section_80d_opportunity: number,  // Health insurance gap
  section_80e_opportunity: number,  // Education loan
  section_24b_opportunity: number,  // Home loan interest
  section_80ccd1b_opportunity: number,  // NPS additional
  
  total_tax_saving_opportunity: number,
  
  // Expense Optimization
  hidden_sip_opportunities: array[{
    expense_category: string,
    current_monthly_spend: number,
    recommended_reduction: number,
    reduction_percentage: number,
    opportunity_cost_1yr: number,
    opportunity_cost_5yr: number,
    opportunity_cost_10yr: number,
    conversion_strategy: string,
    behavioral_tips: array[string]
  }],
  
  // Wealth Projection
  current_monthly_savings: number,
  optimized_monthly_savings: number,
  projected_wealth: {
    year_1: number,
    year_3: number,
    year_5: number,
    year_10: number,
    year_20: number
  },
  
  // AI Recommendations
  priority_actions: array[{
    rank: number,
    action: string,
    impact: string,  // "High", "Medium", "Low"
    effort: string,  // "Easy", "Moderate", "Hard"
    expected_saving: number
  }],
  
  ai_summary: string,
  confidence_score: number,  // 0-100
  
  generated_at: datetime,
  expires_at: datetime  // Re-generate monthly
}
```

### D. WealthGoal (New Collection)
```javascript
{
  id: string,
  user_id: string,
  
  goal_name: string,
  goal_type: enum["education", "wedding", "retirement", "home", "emergency", "other"],
  target_amount: number,
  target_date: datetime,
  current_progress: number,
  
  // AI-Calculated SIP
  recommended_monthly_sip: number,
  recommended_instruments: array[string],
  expected_return_rate: number,
  risk_adjusted_return: number,
  
  linked_expenses: array[string],  // Which expense reductions fund this
  
  status: enum["active", "paused", "completed"],
  created_at: datetime
}
```

---

## 3. API ENDPOINTS

### A. Tax Profile Management

#### POST /api/tax-blueprint/profile
**Description:** Create or update user's tax profile  
**Request Body:**
```json
{
  "employment_status": "salaried_private",
  "annual_gross_income": 1200000,
  "tax_regime": "old",
  "marital_status": "married_earning",
  "children_count": 2,
  "risk_appetite": "moderate",
  "current_80c_investment": 80000,
  "existing_80c_instruments": [
    {"type": "EPF", "annual_contribution": 50000},
    {"type": "LIC", "annual_contribution": 30000}
  ]
}
```
**Response:** 201 Created
```json
{
  "profile_id": "tax_prof_123",
  "completion_percentage": 85,
  "missing_fields": ["health_insurance_self"],
  "next_steps": ["Complete expense tracking for 3 months"]
}
```

#### GET /api/tax-blueprint/profile
**Description:** Retrieve user's tax profile  
**Response:** 200 OK

---

### B. Expense Tracking

#### POST /api/tax-blueprint/expenses
**Description:** Submit monthly expenses (auto-extracted or manual)  
**Request Body:**
```json
{
  "month": "2025-01",
  "rent_emi": 25000,
  "groceries": 12000,
  "subscriptions": [
    {"name": "Netflix", "amount": 649, "category": "entertainment"},
    {"name": "Gym", "amount": 2000, "category": "health"}
  ],
  "dining_out": 8000,
  "shopping": 15000
}
```

#### GET /api/tax-blueprint/expenses/summary?months=6
**Description:** Get expense summary for analysis  
**Response:**
```json
{
  "average_monthly_spend": 75000,
  "top_categories": [
    {"category": "Rent/EMI", "amount": 25000, "percentage": 33},
    {"category": "Dining Out", "amount": 8000, "percentage": 11}
  ],
  "savings_rate": 35,
  "trend": "increasing"
}
```

---

### C. Blueprint Generation (Core AI Endpoint)

#### POST /api/tax-blueprint/generate
**Description:** Generate AI-powered Tax & Wealth Blueprint  
**Request Body:**
```json
{
  "force_refresh": false  // If true, regenerate even if recent blueprint exists
}
```

**Response:** 200 OK
```json
{
  "blueprint_id": "blueprint_202501_abc",
  "financial_year": "FY2024-25",
  
  "tax_optimization": {
    "80c_gap": 70000,
    "total_tax_saving_opportunity": 124000,
    "estimated_refund": 24000,
    
    "recommendations": [
      {
        "instrument": "ELSS Mutual Fund",
        "amount": 40000,
        "rationale": "High growth potential with 3-year lock-in. Suits your moderate risk appetite.",
        "expected_return_3yr": 52000,
        "tax_saved": 12000,
        "action": "Start SIP of ₹3,334/month"
      },
      {
        "instrument": "NPS Tier-1",
        "amount": 30000,
        "rationale": "Additional ₹50k benefit under 80CCD(1B). Retirement-focused.",
        "expected_return_retirement": "₹12L+",
        "tax_saved": 9000,
        "action": "Enable auto-debit of ₹2,500/month"
      }
    ]
  },
  
  "expense_optimization": {
    "total_hidden_sip_potential": 12000,
    
    "opportunities": [
      {
        "category": "Dining Out",
        "current_monthly": 8000,
        "recommended_reduction": 3000,
        "reduction_percentage": 37.5,
        "hidden_sip_amount": 3000,
        
        "wealth_projection": {
          "1_year": 37440,
          "5_years": 240000,
          "10_years": 620000
        },
        
        "behavioral_tips": [
          "Cook 2 extra meals per week at home",
          "Use dining out only for special occasions",
          "Try meal prep on Sundays"
        ],
        
        "action": "Create 'Dining to Wealth' SIP of ₹3,000"
      },
      {
        "category": "Unused Subscriptions",
        "current_monthly": 2649,
        "recommended_reduction": 1649,
        "unused_services": ["Prime Video", "Hotstar", "Spotify Family"],
        "suggestion": "Keep only Netflix. Family share others.",
        "hidden_sip_amount": 1649
      }
    ]
  },
  
  "priority_actions": [
    {
      "rank": 1,
      "action": "Start ELSS SIP of ₹3,334 (fills 80C gap)",
      "impact": "High",
      "effort": "Easy",
      "expected_saving": 52000,
      "time_to_complete": "5 minutes"
    },
    {
      "rank": 2,
      "action": "Reduce dining out by 2 meals/week",
      "impact": "High",
      "effort": "Moderate",
      "expected_saving": 240000,  // Over 5 years
      "time_to_complete": "Ongoing habit"
    }
  ],
  
  "ai_summary": "Suresh, you're leaving ₹94,000 on the table! By maxing your 80C (₹70k gap) and cutting just 2 dining-out meals per week, you could build a ₹6.2L corpus in 5 years—enough for your child's college first year. Start today with one SIP.",
  
  "confidence_score": 92
}
```

---

### D. Goal-Based SIP Creator

#### POST /api/tax-blueprint/create-goal-sip
**Description:** Convert Hidden SIP opportunity into actual investment  
**Request Body:**
```json
{
  "goal_name": "Daughter's Engineering College Fund",
  "target_amount": 2500000,
  "target_date": "2030-06-01",
  "funding_sources": [
    {"expense_category": "dining_out", "monthly_amount": 3000},
    {"expense_category": "subscriptions", "monthly_amount": 1649}
  ],
  "recommended_instruments": ["ELSS", "Index Fund", "Balanced Hybrid Fund"]
}
```

**Response:** 201 Created
```json
{
  "goal_id": "goal_edu_123",
  "total_monthly_sip": 4649,
  "projected_corpus_10yr": 930000,
  "shortfall": 1570000,
  "shortfall_sip_required": 7850,
  "recommendation": "Increase SIP to ₹12,500 or extend timeline to 12 years",
  "next_steps": [
    "Link bank account for auto-debit",
    "Choose fund allocation",
    "Set expense tracking alerts"
  ]
}
```

---

### E. Tax Regime Comparison

#### GET /api/tax-blueprint/regime-comparison
**Description:** Compare Old vs New tax regime for user  
**Response:**
```json
{
  "old_regime": {
    "taxable_income": 950000,
    "tax_before_deductions": 112500,
    "deductions_80c": 150000,
    "deductions_80d": 25000,
    "final_tax": 62500,
    "take_home_benefit": 50000
  },
  
  "new_regime": {
    "taxable_income": 1200000,
    "tax_liability": 90000,
    "no_deductions": true,
    "take_home_benefit": 0
  },
  
  "recommendation": "old",
  "rationale": "Old regime saves you ₹27,500 in taxes. Plus, it forces disciplined investments toward your retirement goal.",
  "switch_threshold": "Consider new regime only if income exceeds ₹25L and you have no deductions"
}
```

---

## 4. AI ANALYSIS LOGIC (Prompt Engineering)

### System Prompt for Blueprint Generation
```
You are a Senior Financial Planner specializing in Indian tax laws and middle-class wealth building. 

Context:
- User is a {employment_status} earning ₹{annual_income}/year
- Family: {marital_status}, {children_count} children
- Primary Goal: {primary_goal} in {time_horizon} years
- Risk Appetite: {risk_appetite}
- Current 80C: ₹{current_80c}/₹1,50,000

Your task:
1. TAX GAP ANALYSIS
   - Calculate 80C shortfall (₹1,50,000 - current)
   - Suggest best instruments based on age, risk, and liquidity needs
   - Estimate tax saved (30% slab assumed for >₹12L income)

2. EXPENSE PRUNING
   - Identify top 3 discretionary categories consuming >10% of income
   - Calculate "Hidden SIP" by reducing each by 25-40%
   - Project wealth at 12% CAGR for 1yr, 5yr, 10yr

3. BEHAVIORAL NUDGES
   - Give 3 practical tips to cut each expense
   - Use relatable Indian context (e.g., "Cook Sunday meals", "Cancel unused OTT")

4. PRIORITY RANKING
   - Rank all actions by (Impact × Ease of Execution)
   - Show "5-minute wins" first

Output Format: JSON matching TaxBlueprint schema

Constraints:
- All amounts in INR
- Use simple language (8th-grade reading level)
- Include emotional motivators (child's future, retirement peace)
- Cite specific tax sections (80C, 80D, 24B)
- Assume 12% equity returns, 7% debt returns
```

### User Message Template
```
Generate Tax & Wealth Blueprint for:

INCOME:
- Annual Gross: ₹{annual_gross_income}
- Monthly Net: ₹{monthly_net_income}
- Tax Regime: {tax_regime}

FAMILY:
- Status: {marital_status}
- Children: {children_count} ({children_ages})
- Parents: {dependent_parents}

CURRENT TAX PLANNING:
- 80C Utilized: ₹{current_80c_investment}
- Instruments: {existing_80c_instruments}
- Health Insurance: ₹{health_insurance_total}

MONTHLY EXPENSES (Last 3 months avg):
- Rent/EMI: ₹{rent_emi}
- Groceries: ₹{groceries}
- Subscriptions: ₹{total_subscriptions}
  {subscription_details}
- Dining Out: ₹{dining_out}
- Shopping: ₹{shopping}
- Entertainment: ₹{entertainment}
- Total Essential: ₹{total_essential}
- Total Discretionary: ₹{total_discretionary}

GOALS:
- Primary: {primary_goal}
- Target Amount: ₹{target_amount}
- Timeline: {time_horizon}
- Risk Appetite: {risk_appetite}

Please provide:
1. 80C gap analysis with specific instrument recommendations
2. Top 3 expense reduction opportunities with Hidden SIP calculations
3. 5-year wealth projection if recommendations are followed
4. 5 priority actions ranked by impact
```

---

## 5. UI/UX WIREFRAMES

### Screen 1: Blueprint Dashboard (Home Screen)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ Sankalp Planner                           Profile Icon ⚙  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🎯 Your Financial Year 2024-25 Blueprint                    │
│  Last updated: 2 days ago                    [Refresh 🔄]    │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 💰 TAX SAVINGS UNLOCKED                                │  │
│  │                                                         │  │
│  │  ₹94,000                                               │  │
│  │  Hidden Money You Can Save                             │  │
│  │                                                         │  │
│  │  [View Breakdown →]                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📊 80C Tax Saver Gap                                 │    │
│  │                                                       │    │
│  │  ████████████░░░░░░░░░░░░   ₹80,000 / ₹1,50,000    │    │
│  │                                                       │    │
│  │  ⚠️ You're missing ₹70,000 in tax deductions!       │    │
│  │  → Save ₹21,000 in taxes by filling this gap         │    │
│  │                                                       │    │
│  │  Recommended:                                         │    │
│  │  • ELSS SIP ₹3,334/month → ₹40k/year                │    │
│  │  • NPS ₹2,500/month → ₹30k/year                     │    │
│  │                                                       │    │
│  │  [Start SIP Now]  [Compare Options]                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 💸 Hidden SIP Finder                                 │    │
│  │  Convert Expenses → Wealth                           │    │
│  │                                                       │    │
│  │  TOP OPPORTUNITY:                                     │    │
│  │  🍔 Dining Out: ₹8,000/month                        │    │
│  │                                                       │    │
│  │  If you reduce by just 2 meals/week...              │    │
│  │                                                       │    │
│  │  Hidden SIP:  ₹3,000/month                          │    │
│  │  ────────────────────────────────────────            │    │
│  │  In 5 years:  ₹2.4 Lakhs 💎                        │    │
│  │  In 10 years: ₹6.2 Lakhs 🚀                        │    │
│  │                                                       │    │
│  │  [Convert to SIP] [See All Opportunities]           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ⚡ Quick Wins (Do These First)                       │    │
│  │                                                       │    │
│  │  1. ✅ Start ELSS SIP               5 mins │ ₹52k↑  │    │
│  │  2. 🍽️  Cook 2 extra meals/week    Easy  │ ₹36k↑  │    │
│  │  3. 📺 Cancel unused subscriptions  2 mins│ ₹20k↑  │    │
│  │  4. 🏥 Add parents to health ins.  1 day │ ₹15k↑  │    │
│  │  5. 💳 Use credit card smartly     Ongoing│ ₹12k↑  │    │
│  │                                                       │    │
│  │  Total Impact: ₹1,35,000 in Year 1                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  [View Full Report] [Set Up Auto-Pilot] [Share with CA]     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Screen 2: Deep-Dive Expense Optimizer

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard          Hidden SIP Finder              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🎯 Convert Your Expenses into ₹8.5L Wealth                 │
│  Based on your last 3 months spending                        │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🍔 Dining Out & Ordering Food                         │  │
│  │                                                         │  │
│  │  Current: ₹8,000/month                                 │  │
│  │  Target:  ₹5,000/month  (Save ₹3,000)                 │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ 💡 How to Save ₹3,000:                          │  │  │
│  │  │                                                   │  │  │
│  │  │ • Cook breakfast at home (saves ₹1,200)         │  │  │
│  │  │ • Pack lunch 2x/week (saves ₹1,000)             │  │  │
│  │  │ • Limit restaurants to weekends only (₹800)     │  │  │
│  │  │                                                   │  │  │
│  │  │ 📱 Tip: Use meal-prep on Sundays. Your wife     │  │  │
│  │  │    can prep 4 lunches in 90 minutes!            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  💰 Hidden SIP Wealth Projection (₹3,000/month):     │  │
│  │                                                         │  │
│  │  Year 1:   ₹37,440                                     │  │
│  │  Year 3:   ₹1,24,000                                   │  │
│  │  Year 5:   ₹2,40,000  ← Your son's school fees!       │  │
│  │  Year 10:  ₹6,20,000  ← Down payment for car!         │  │
│  │                                                         │  │
│  │  [Create "Dining → Wealth" SIP]                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📺 Subscriptions (OTT, Gym, Apps)                     │  │
│  │                                                         │  │
│  │  Current: ₹2,649/month                                 │  │
│  │  Target:  ₹1,000/month  (Save ₹1,649)                 │  │
│  │                                                         │  │
│  │  📊 Your Subscriptions:                                │  │
│  │  • Netflix        ₹649   ✅ Keep                      │  │
│  │  • Gym Membership ₹2,000  ⚠️ Used only 4x last month │  │
│  │  • Prime Video   ₹1,499  ❌ Unused (10% watch rate)  │  │
│  │  • Spotify Family ₹179   ❌ Only you use it          │  │
│  │  • Hotstar       ₹1,499  ❌ Cancel (IPL season only) │  │
│  │                                                         │  │
│  │  💡 Recommendation:                                    │  │
│  │  • Cancel Prime, Hotstar, downgrade Spotify           │  │
│  │  • Gym: Try home workouts or free yoga apps           │  │
│  │                                                         │  │
│  │  💰 Hidden SIP: ₹1,649/month = ₹3.4L in 10 years     │  │
│  │                                                         │  │
│  │  [Auto-Cancel Unused] [Create SIP]                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🛍️ Shopping & Lifestyle                               │  │
│  │                                                         │  │
│  │  Current: ₹15,000/month                                │  │
│  │  Target:  ₹10,000/month  (Save ₹5,000)                │  │
│  │                                                         │  │
│  │  📊 Your Pattern:                                      │  │
│  │  • Impulse buys on e-commerce: ₹6,000                 │  │
│  │  • Branded clothes: ₹4,000                             │  │
│  │  • Gadgets & accessories: ₹5,000                       │  │
│  │                                                         │  │
│  │  💡 Smart Shopping Rules:                              │  │
│  │  • Wait 48 hours before buying (reduce impulse 70%)   │  │
│  │  • Buy during sale season only                         │  │
│  │  • Use credit card rewards (save 2-5%)                 │  │
│  │                                                         │  │
│  │  💰 Hidden SIP: ₹5,000/month = ₹10.3L in 10 years    │  │
│  │                                                         │  │
│  │  [Create Shopping Budget Alert] [Create SIP]          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📈 COMBINED HIDDEN SIP IMPACT                          │  │
│  │                                                         │  │
│  │  Total Monthly Savings: ₹9,649                         │  │
│  │                                                         │  │
│  │  Timeline    Conservative    Moderate    Aggressive    │  │
│  │  ────────    ────────────    ────────    ──────────    │  │
│  │  1 Year      ₹1.2L           ₹1.2L       ₹1.3L         │  │
│  │  5 Years     ₹6.8L           ₹7.9L       ₹9.2L         │  │
│  │  10 Years    ₹16.5L          ₹20.3L      ₹25.7L        │  │
│  │  15 Years    ₹30.2L          ₹42.8L      ₹58.9L        │  │
│  │                                                         │  │
│  │  🎯 This could fund your daughter's full 4-year       │  │
│  │     engineering degree (₹20L) + wedding (₹15L)!       │  │
│  │                                                         │  │
│  │  [Create Master SIP] [Download Full Report]           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Screen 3: 80C Gap Filler (Interactive)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                     80C Tax Saver Planner            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🎯 Fill Your ₹70,000 Gap & Save ₹21,000 in Tax            │
│                                                               │
│  Your Current 80C Status:                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ████████████░░░░░░░░░░░░  ₹80,000 / ₹1,50,000       │  │
│  │                                                         │  │
│  │  ✅ EPF:              ₹50,000/year (auto-deducted)     │  │
│  │  ✅ LIC Premium:      ₹30,000/year                     │  │
│  │  ❌ Remaining Gap:    ₹70,000                          │  │
│  │                                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  🤖 AI Recommendations (Based on your profile):              │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1️⃣ ELSS Mutual Funds (Tax-Saving Equity)             │  │
│  │                                                         │  │
│  │    Amount: ₹40,000/year (₹3,334/month)                │  │
│  │    Lock-in: 3 years only                               │  │
│  │    Expected Return: 12-15% CAGR                        │  │
│  │    Risk: Moderate                                       │  │
│  │                                                         │  │
│  │    ✅ Why this works for you:                          │  │
│  │    • You're 35 years old - equity suits your age      │  │
│  │    • Risk appetite: Moderate                           │  │
│  │    • Goal: Child's education in 12 years              │  │
│  │    • ₹40k grows to ₹58k in 3 years (vs ₹42k in PPF)  │  │
│  │                                                         │  │
│  │    💰 Value after 10 years: ₹8.2 Lakhs                │  │
│  │                                                         │  │
│  │    [Start SIP] [View Top ELSS Funds]                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 2️⃣ NPS (National Pension System)                      │  │
│  │                                                         │  │
│  │    Amount: ₹30,000/year (₹2,500/month)                │  │
│  │    Lock-in: Till age 60 (long-term)                   │  │
│  │    Expected Return: 10-12% CAGR                        │  │
│  │    Risk: Low to Moderate                               │  │
│  │                                                         │  │
│  │    ✅ Why this works:                                  │  │
│  │    • EXTRA ₹50k deduction under 80CCD(1B)             │  │
│  │    • Total tax saving: ₹9,000                          │  │
│  │    • Retirement corpus builder                         │  │
│  │    • Government co-contribution possible               │  │
│  │                                                         │  │
│  │    💰 Value at retirement (age 60): ₹38 Lakhs         │  │
│  │                                                         │  │
│  │    [Open NPS Account] [Learn More]                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 💡 OTHER OPTIONS (Choose if above don't suit)         │  │
│  │                                                         │  │
│  │ • PPF (Public Provident Fund)                          │  │
│  │   7.1% return, 15-year lock-in, ultra-safe            │  │
│  │   [Not recommended - returns too low for your goals]  │  │
│  │                                                         │  │
│  │ • Tax-Saving FD                                        │  │
│  │   7% return, 5-year lock-in, safe                     │  │
│  │   [Skip - inflation will eat returns]                 │  │
│  │                                                         │  │
│  │ • ULIP (Unit-Linked Insurance Plan)                   │  │
│  │   8-10% return, high charges                           │  │
│  │   [Avoid - better to separate insurance & investment] │  │
│  │                                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📊 COMPLETE 80C PLAN SUMMARY                           │  │
│  │                                                         │  │
│  │  Existing:                                              │  │
│  │  • EPF            ₹50,000                              │  │
│  │  • LIC Premium    ₹30,000                              │  │
│  │                                                         │  │
│  │  Recommended:                                           │  │
│  │  • ELSS SIP       ₹40,000  ← Start this                │  │
│  │  • NPS            ₹30,000  ← And this                  │  │
│  │  ───────────────────────────                           │  │
│  │  TOTAL 80C:       ₹1,50,000 ✅ MAXED OUT!            │  │
│  │                                                         │  │
│  │  Tax Saved:       ₹45,000 (30% slab)                  │  │
│  │  Net Investment:  ₹1,05,000 (after tax benefit)       │  │
│  │                                                         │  │
│  │  Projected Value (10 years): ₹28.5 Lakhs              │  │
│  │                                                         │  │
│  │  [Implement Full Plan] [Customize Mix]                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. USER ONBOARDING COPY

### A. Feature Intro Modal (First Time)
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│              ⚡ Introducing Sankalp Planner          │
│              "अपने सपनों को सच करें"                 │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │                                               │    │
│  │         [Illustration: Piggy bank + Tree]     │    │
│  │                                               │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  Did you know?                                        │
│                                                       │
│  Most Indians leave ₹50,000+ on the table           │
│  every year by:                                       │
│                                                       │
│  ❌ Not maxing out 80C tax deductions                │
│  ❌ Spending on things they forget in 2 weeks        │
│  ❌ Missing out on compound interest magic           │
│                                                       │
│  Sankalp Planner uses AI to:                         │
│                                                       │
│  ✅ Find ₹70,000+ in hidden tax savings              │
│  ✅ Convert wasted expenses into ₹6L+ wealth         │
│  ✅ Show you exactly where to invest (with proof!)   │
│                                                       │
│  Takes just 7 minutes to set up.                     │
│  One-time effort. Lifetime rewards.                  │
│                                                       │
│  [Let's Build Your Blueprint] [Maybe Later]          │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### B. Onboarding Step Progress
```
Step 1/3: Tell us about yourself
Progress: ████░░░░░░ 40%

"We'll analyze your income, family, and goals to 
create a personalized tax & wealth plan."

[Continue →]
```

### C. Success Confirmation
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│              🎉 Your Blueprint is Ready!             │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │                                               │    │
│  │  We found ₹94,000 you can save this year!   │    │
│  │                                               │    │
│  │  • ₹70,000 from unfilled 80C gap             │    │
│  │  • ₹24,000 from expense optimization          │    │
│  │                                               │    │
│  │  If you act on our Top 3 recommendations:    │    │
│  │  → You'll have ₹6.2L extra in 5 years        │    │
│  │                                               │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  Here's what happens next:                           │
│                                                       │
│  1. Review your personalized blueprint               │
│  2. Start with "Quick Wins" (5 mins each)           │
│  3. Set up auto-pilot SIPs                           │
│  4. We'll track progress every month                 │
│                                                       │
│  [View My Blueprint] [Share with Family]             │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### D. WhatsApp/Email Summary
```
Subject: Your ₹94,000 Tax & Wealth Blueprint is Ready! 🎯

Hi Suresh,

Great news! We analyzed your finances and found ₹94,000 
in savings opportunities you're missing this year.

Here's your personalized plan:

💰 TAX SAVINGS (₹70,000 gap in 80C)
• Start ELSS SIP: ₹3,334/month → Saves ₹12,000 in tax
• Enable NPS: ₹2,500/month → Saves ₹9,000 in tax

💸 HIDDEN SIP (Convert expenses to wealth)
• Reduce dining out by 2 meals/week → Save ₹3,000/month
  → Worth ₹6.2L in 10 years!
• Cancel unused subscriptions → Save ₹1,649/month
  → Worth ₹3.4L in 10 years!

🎯 QUICK WINS (Do these first):
1. Start ELSS SIP (5 mins) → Impact: ₹52,000
2. Cook 2 extra meals/week (Easy) → Impact: ₹36,000
3. Cancel Netflix/Hotstar (2 mins) → Impact: ₹20,000

Total Impact in Year 1: ₹1.35 Lakhs
Total Wealth in 10 Years: ₹28 Lakhs

View your full blueprint:
https://assetvault.com/sankalp-planner

Questions? Reply to this email.

Happy Wealth Building!
Team AssetVault
```

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create database models (TaxProfile, ExpenseProfile, TaxBlueprint, WealthGoal)
- [ ] Build questionnaire UI (7 steps, 25 questions)
- [ ] Implement data collection APIs
- [ ] Set up expense tracking (manual + auto-import future)

### Phase 2: AI Engine (Weeks 3-4)
- [ ] Integrate Emergent LLM for blueprint generation
- [ ] Build 80C gap analysis logic
- [ ] Build expense categorization & Hidden SIP calculator
- [ ] Implement wealth projection models (12% equity, 7% debt)
- [ ] Add Old vs New regime comparison

### Phase 3: UI/UX (Weeks 5-6)
- [ ] Build Blueprint Dashboard (Screen 1)
- [ ] Build Expense Optimizer (Screen 2)
- [ ] Build 80C Gap Filler (Screen 3)
- [ ] Add onboarding flow with progress indicators
- [ ] Implement interactive charts (Recharts)

### Phase 4: Integration & Actions (Week 7)
- [ ] Add "Create SIP" button → Link to mutual fund platforms
- [ ] Add "Set Expense Alert" → Budget tracking
- [ ] Add "Download PDF Report" → Shareable blueprint
- [ ] Add "Share with CA" → Export for tax filing
- [ ] WhatsApp/Email notification system

### Phase 5: Testing & Launch (Week 8)
- [ ] User testing with 20 beta users
- [ ] Fix bugs and edge cases
- [ ] Add demo mode with sample data
- [ ] Launch marketing campaign
- [ ] Monitor AI accuracy and iterate

---

## 8. SUCCESS METRICS

### User Engagement
- **Blueprint Completion Rate:** >70% (users who start questionnaire)
- **Action Taken Rate:** >40% (users who start at least 1 SIP)
- **Monthly Active Usage:** >60% (return to check progress)

### Financial Impact (Self-Reported)
- **Average Tax Saved:** ₹15,000 - ₹40,000 per user
- **Average Hidden SIP Created:** ₹4,000 - ₹8,000 per month
- **Wealth Created (1 year):** ₹50,000 - ₹1,20,000 per user

### Platform Metrics
- **New User Signups:** +40% (driven by this feature)
- **Premium Conversion:** +25% (users pay for detailed reports)
- **Referral Rate:** 30% (users share with family/friends)

---

## 9. MONETIZATION STRATEGY

### Free Tier
- Basic blueprint generation (once per quarter)
- Top 3 recommendations only
- Generic wealth projections

### Premium Tier (₹999/year or ₹99/month)
- Unlimited blueprint regeneration
- Full 15+ recommendations with detailed rationale
- Personalized CA-ready tax filing report
- Auto-refresh with linked bank accounts
- WhatsApp alerts for action items
- Priority customer support

### Affiliate Revenue
- Earn commission on:
  - ELSS mutual fund SIPs (0.5-1% AUM)
  - NPS account openings (₹200-500 per account)
  - Insurance policy upgrades (5-10% commission)
  - Tax-saving FDs (0.1-0.25% commission)

---

## 10. COMPETITIVE ADVANTAGE

| Feature | AssetVault Sankalp | ET Money | Groww | Paytm Money |
|---------|-------------------|----------|-------|-------------|
| AI-Powered Tax Analysis | ✅ | ❌ | ❌ | ❌ |
| Hidden SIP Finder | ✅ | ❌ | ❌ | ❌ |
| Expense-to-Wealth Conversion | ✅ | ❌ | ❌ | ❌ |
| Old vs New Regime Comparison | ✅ | ✅ | ❌ | ✅ |
| Personalized Instrument Reco | ✅ | Partial | Generic | Generic |
| Action-Oriented UI | ✅ | ❌ | ❌ | ❌ |
| Family Context (kids, parents) | ✅ | ❌ | ❌ | ❌ |

**Unique Positioning:** "We don't just show you where to invest. We find the money you didn't know you had."

---

## 11. TECHNICAL CONSIDERATIONS

### Performance
- Blueprint generation: <5 seconds (cached for 30 days)
- Questionnaire autosave: Real-time
- Expense import: Batch processing (weekly)

### Security
- All financial data encrypted at rest (AES-256)
- PII redacted in AI prompts (income bands, not exact amounts)
- Tax blueprint stored with user consent only
- Compliant with RBI data localization norms

### Scalability
- MongoDB indexes on user_id, financial_year
- AI calls rate-limited (10 requests/hour per user)
- Expense data aggregated monthly (not daily) to reduce DB load
- Blueprint cached and regenerated only on data change

### Compliance
- Disclaimer: "For informational purposes only. Consult a CA for tax filing."
- Registered as Financial Advisor (SEBI RIA license - future)
- No direct fund management - only recommendations

---

## 12. FUTURE ENHANCEMENTS (Post-MVP)

### V2 Features (6 months)
- Auto-import bank statements via AA framework
- Real-time expense tracking with UPI integration
- AI chatbot for tax queries ("Should I switch regime?")
- Comparative analysis with peer income group
- Automated CA consultation booking

### V3 Features (12 months)
- Stock portfolio tax loss harvesting suggestions
- Crypto income tax calculation (Schedule VDA)
- Multi-year wealth projection (20+ years)
- Estate planning (Will drafting, nomination setup)
- Integration with ITR filing platforms (ClearTax, QuickBooks)

---

## END OF SPECIFICATION

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Prepared By:** Senior Product Manager, AssetVault  
**Review Status:** Ready for Development Sprint Planning

---

**Next Steps:**
1. Technical feasibility review by Engineering team
2. AI accuracy benchmarking (test with 50 dummy profiles)
3. UI/UX prototype review with 10 target users
4. Legal compliance check with CA/Tax Advisor
5. Sprint planning for 8-week development cycle

**Questions/Feedback:** Contact product@assetvault.com
