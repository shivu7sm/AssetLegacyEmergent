"""Loan amortization, prepayment, tax-benefit and refinance maths."""
from typing import List, Optional, Dict


def calculate_amortization(principal: float, monthly_rate: float, tenure_months: int, 
                          prepayment: Optional[Dict] = None) -> List[Dict[str, float]]:
    """Calculate loan amortization schedule with optional prepayments"""
    schedule = []
    remaining_balance = principal
    
    # Calculate monthly payment using loan formula
    if monthly_rate == 0:
        monthly_payment = principal / tenure_months
    else:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate) ** tenure_months) / ((1 + monthly_rate) ** tenure_months - 1)
    
    month = 1
    while remaining_balance > 0.01:  # Allow for small rounding differences
        interest_payment = remaining_balance * monthly_rate
        principal_payment = monthly_payment - interest_payment
        
        # Add prepayment if applicable
        extra_payment = 0
        if prepayment:
            if prepayment["type"] == "monthly_extra" and month >= prepayment.get("start_month", 1):
                extra_payment = prepayment["amount"]
            elif prepayment["type"] == "one_time" and month == prepayment.get("start_month", 1):
                extra_payment = prepayment["amount"]
            elif prepayment["type"] == "annual_extra" and month >= prepayment.get("start_month", 1) and (month - prepayment.get("start_month", 1)) % 12 == 0:
                extra_payment = prepayment["amount"]
        
        principal_payment += extra_payment
        
        # Don't pay more than remaining balance
        if principal_payment > remaining_balance:
            principal_payment = remaining_balance
            
        remaining_balance = remaining_balance - principal_payment
        
        # Handle rounding issues
        if remaining_balance < 0.01:
            remaining_balance = 0
            
        schedule.append({
            "month": month,
            "payment": round(monthly_payment + extra_payment, 2),
            "principal_payment": round(principal_payment, 2),
            "interest_payment": round(interest_payment, 2),
            "remaining_balance": round(max(0, remaining_balance), 2),
            "extra_payment": round(extra_payment, 2)
        })
        
        month += 1
        if month > tenure_months * 2:  # Safety break
            break
    
    return schedule

def calculate_prepayment_scenarios(principal: float, annual_rate: float, tenure_months: int, 
                                   base_schedule: List[Dict]) -> Dict:
    """Calculate different prepayment scenarios"""
    monthly_rate = (annual_rate / 100) / 12
    base_total_interest = sum([e["interest_payment"] for e in base_schedule])
    base_total_payment = sum([e["payment"] for e in base_schedule])
    
    scenarios = {}
    
    # Scenario 1: Extra 5000 monthly
    prepayment_5k = {"type": "monthly_extra", "amount": 5000, "start_month": 1}
    schedule_5k = calculate_amortization(principal, monthly_rate, tenure_months, prepayment_5k)
    total_interest_5k = sum([e["interest_payment"] for e in schedule_5k])
    scenarios["extra_5k_monthly"] = {
        "name": "Extra ₹5,000/month",
        "monthly_payment": schedule_5k[0]["payment"],
        "total_interest": round(total_interest_5k, 2),
        "total_amount": round(sum([e["payment"] for e in schedule_5k]), 2),
        "tenure_months": len(schedule_5k),
        "interest_saved": round(base_total_interest - total_interest_5k, 2),
        "time_saved_months": tenure_months - len(schedule_5k),
        "amortization_schedule": schedule_5k[:12]  # First year only
    }
    
    # Scenario 2: Extra 10000 monthly
    prepayment_10k = {"type": "monthly_extra", "amount": 10000, "start_month": 1}
    schedule_10k = calculate_amortization(principal, monthly_rate, tenure_months, prepayment_10k)
    total_interest_10k = sum([e["interest_payment"] for e in schedule_10k])
    scenarios["extra_10k_monthly"] = {
        "name": "Extra ₹10,000/month",
        "monthly_payment": schedule_10k[0]["payment"],
        "total_interest": round(total_interest_10k, 2),
        "total_amount": round(sum([e["payment"] for e in schedule_10k]), 2),
        "tenure_months": len(schedule_10k),
        "interest_saved": round(base_total_interest - total_interest_10k, 2),
        "time_saved_months": tenure_months - len(schedule_10k),
        "amortization_schedule": schedule_10k[:12]
    }
    
    # Scenario 3: Annual lump sum (50k)
    prepayment_annual = {"type": "annual_extra", "amount": 50000, "start_month": 12}
    schedule_annual = calculate_amortization(principal, monthly_rate, tenure_months, prepayment_annual)
    total_interest_annual = sum([e["interest_payment"] for e in schedule_annual])
    scenarios["annual_50k"] = {
        "name": "₹50,000 annual bonus",
        "monthly_payment": schedule_annual[0]["payment"],
        "total_interest": round(total_interest_annual, 2),
        "total_amount": round(sum([e["payment"] for e in schedule_annual]), 2),
        "tenure_months": len(schedule_annual),
        "interest_saved": round(base_total_interest - total_interest_annual, 2),
        "time_saved_months": tenure_months - len(schedule_annual),
        "amortization_schedule": schedule_annual[:12]
    }
    
    # Scenario 4: One-time prepayment (100k in month 1)
    prepayment_onetime = {"type": "one_time", "amount": 100000, "start_month": 1}
    schedule_onetime = calculate_amortization(principal, monthly_rate, tenure_months, prepayment_onetime)
    total_interest_onetime = sum([e["interest_payment"] for e in schedule_onetime])
    scenarios["onetime_100k"] = {
        "name": "₹1,00,000 one-time",
        "monthly_payment": schedule_onetime[0]["payment"] - 100000,  # Regular payment without the one-time
        "total_interest": round(total_interest_onetime, 2),
        "total_amount": round(sum([e["payment"] for e in schedule_onetime]), 2),
        "tenure_months": len(schedule_onetime),
        "interest_saved": round(base_total_interest - total_interest_onetime, 2),
        "time_saved_months": tenure_months - len(schedule_onetime),
        "amortization_schedule": schedule_onetime[:12]
    }
    
    return scenarios

def calculate_tax_benefits(principal: float, annual_rate: float, tenure_months: int, 
                          loan_type: str, tax_bracket: float = 0.30) -> Dict:
    """Calculate tax benefits for home and education loans"""
    monthly_rate = (annual_rate / 100) / 12
    schedule = calculate_amortization(principal, monthly_rate, min(12, tenure_months))
    
    # Calculate first year interest
    first_year_interest = sum([e["interest_payment"] for e in schedule])
    first_year_principal = sum([e["principal_payment"] for e in schedule])
    
    benefits = {
        "loan_type": loan_type,
        "principal_deduction": 0,
        "interest_deduction": 0,
        "total_tax_saved": 0,
        "effective_interest_rate": annual_rate,
        "tax_bracket": tax_bracket,
        "eligible": False,
        "sections_applicable": []
    }
    
    if loan_type == "home":
        # Section 80C: Principal up to 1.5L
        principal_deduction = min(first_year_principal, 150000)
        # Section 24(b): Interest up to 2L for self-occupied
        interest_deduction = min(first_year_interest, 200000)
        
        benefits.update({
            "principal_deduction": round(principal_deduction, 2),
            "interest_deduction": round(interest_deduction, 2),
            "total_tax_saved": round((principal_deduction + interest_deduction) * tax_bracket, 2),
            "eligible": True,
            "sections_applicable": ["80C (Principal)", "24(b) (Interest)"]
        })
        
        # Calculate effective interest rate
        tax_saved_on_interest = interest_deduction * tax_bracket
        effective_interest = first_year_interest - tax_saved_on_interest
        effective_rate = (effective_interest / principal) * 12 * 100 / tenure_months * 12
        benefits["effective_interest_rate"] = round(effective_rate, 2)
        
    elif loan_type == "education":
        # Section 80E: Full interest deduction, no upper limit (for 8 years)
        benefits.update({
            "principal_deduction": 0,
            "interest_deduction": round(first_year_interest, 2),
            "total_tax_saved": round(first_year_interest * tax_bracket, 2),
            "eligible": True,
            "sections_applicable": ["80E (Interest - No Limit)"]
        })
        
        # Calculate effective interest rate
        tax_saved_on_interest = first_year_interest * tax_bracket
        effective_interest = first_year_interest - tax_saved_on_interest
        effective_rate = (effective_interest / principal) * 12 * 100 / tenure_months * 12
        benefits["effective_interest_rate"] = round(effective_rate, 2)
    
    return benefits

def calculate_refinance_comparison(current_principal: float, current_rate: float, 
                                  remaining_months: int, new_rate: float, 
                                  closing_costs: float) -> Dict:
    """Compare current loan vs refinanced loan"""
    current_monthly_rate = (current_rate / 100) / 12
    new_monthly_rate = (new_rate / 100) / 12
    
    # Current loan remaining payments
    current_schedule = calculate_amortization(current_principal, current_monthly_rate, remaining_months)
    current_total = sum([e["payment"] for e in current_schedule])
    current_monthly = current_schedule[0]["payment"]
    
    # New refinanced loan
    new_schedule = calculate_amortization(current_principal, new_monthly_rate, remaining_months)
    new_total = sum([e["payment"] for e in new_schedule]) + closing_costs
    new_monthly = new_schedule[0]["payment"]
    
    net_savings = current_total - new_total
    monthly_savings = current_monthly - new_monthly
    
    # Calculate breakeven
    breakeven_months = 0
    if monthly_savings > 0:
        breakeven_months = round(closing_costs / monthly_savings)
    
    return {
        "current_remaining_payment": round(current_total, 2),
        "new_total_payment": round(new_total, 2),
        "closing_costs": round(closing_costs, 2),
        "net_savings": round(net_savings, 2),
        "breakeven_months": breakeven_months,
        "should_refinance": net_savings > 0,
        "monthly_savings": round(monthly_savings, 2),
        "current_monthly_payment": round(current_monthly, 2),
        "new_monthly_payment": round(new_monthly, 2)
    }

def calculate_principal_vs_interest_split(schedule: List[Dict], tenure_months: int) -> Dict:
    """Calculate how payments are split between principal and interest over time"""
    splits = {
        "first_year": {"principal": 0, "interest": 0},
        "years_1_to_5": {"principal": 0, "interest": 0},
        "years_5_to_10": {"principal": 0, "interest": 0},
        "remaining": {"principal": 0, "interest": 0}
    }
    
    for entry in schedule:
        month = entry["month"]
        if month <= 12:
            splits["first_year"]["principal"] += entry["principal_payment"]
            splits["first_year"]["interest"] += entry["interest_payment"]
        
        if month <= 60:
            splits["years_1_to_5"]["principal"] += entry["principal_payment"]
            splits["years_1_to_5"]["interest"] += entry["interest_payment"]
        elif month <= 120:
            splits["years_5_to_10"]["principal"] += entry["principal_payment"]
            splits["years_5_to_10"]["interest"] += entry["interest_payment"]
        else:
            splits["remaining"]["principal"] += entry["principal_payment"]
            splits["remaining"]["interest"] += entry["interest_payment"]
    
    # Calculate percentages
    for period in splits:
        total = splits[period]["principal"] + splits[period]["interest"]
        if total > 0:
            splits[period]["principal_percentage"] = round(splits[period]["principal"] / total * 100, 1)
            splits[period]["interest_percentage"] = round(splits[period]["interest"] / total * 100, 1)
            splits[period]["principal"] = round(splits[period]["principal"], 2)
            splits[period]["interest"] = round(splits[period]["interest"], 2)
    
    return splits

def generate_fallback_tips(loan_type: str, interest_rate: float) -> str:
    """Generate loan-type specific tips when AI is unavailable"""
    tips = f"**Smart Strategies for Your {loan_type.title()} Loan:**\n\n"
    
    if loan_type == "home":
        tips += """1. **Tax Benefits**: Claim up to ₹1.5L under Section 80C (principal) and ₹2L under Section 24(b) (interest). This can save you significant taxes annually.

2. **Prepayment Strategy**: Even small prepayments of ₹5,000-10,000/month can reduce your tenure by several years and save lakhs in interest.

3. **Refinancing Check**: If your current rate is above 8.5%, consider refinancing with another bank offering lower rates - could save you ₹2-3L over the loan tenure.

4. **Balance Transfer**: Banks often offer lower rates to new customers. Check if balance transfer makes sense after 2-3 years.

5. **Avoid Part-Payment Penalties**: Most banks allow 25% prepayment per year without charges. Use your bonus/increment for prepayments."""
    
    elif loan_type == "education":
        tips += """1. **Tax Deduction**: Section 80E allows full interest deduction with no upper limit for 8 years. This significantly reduces your effective interest rate.

2. **Grace Period**: Use the 6-12 month grace period after course completion to build an emergency fund before EMIs start.

3. **Aggressive Prepayment**: Education loans have lower rates but prepaying aggressively in first 5 years saves maximum interest.

4. **Income-Based Repayment**: If struggling, talk to your bank about extending tenure temporarily during job transitions.

5. **Career ROI**: Focus on career growth - a 20% salary hike can help you prepay 30-40% faster than planned."""
    
    elif loan_type == "personal":
        tips += """1. **High Priority Repayment**: Personal loans have highest interest rates (10-18%). Pay these off before home/auto loans using debt avalanche method.

2. **Balance Transfer**: Look for balance transfer offers from other banks at 0% for 6-12 months - can save thousands in interest.

3. **Debt Consolidation**: If you have multiple personal loans, consolidate into one at a lower rate to simplify payments.

4. **Extra Payments**: Every ₹10,000 prepayment can save ₹2,000-3,000 in interest. Use bonuses/windfalls for prepayment.

5. **Avoid New Debt**: Don't take new loans until this is cleared. Focus on increasing income and reducing expenses."""
    
    elif loan_type == "auto":
        tips += """1. **Asset Depreciation**: Your car depreciates while loan interest accumulates. Prepay aggressively to minimize total cost.

2. **Trade-In Strategy**: If possible, trade in your old car to reduce principal amount before taking new loan.

3. **Shorter Tenure**: Auto loans should ideally be 3-4 years max. Longer tenure means paying interest on a depreciating asset.

4. **Insurance Bundling**: Get better insurance rates by bundling with lender, but compare with standalone policies.

5. **Refinancing**: After 1-2 years, if your credit score improved, refinance at a lower rate."""
    
    elif loan_type == "credit_card":
        tips += f"""1. **URGENT PRIORITY**: Credit card debt at {interest_rate}% is extremely expensive. This should be your #1 repayment priority.

2. **Balance Transfer**: Transfer to a card offering 0% for 6-12 months. Many banks offer this - can save ₹10,000s in interest.

3. **Debt Avalanche**: Pay minimum on all cards, then put ALL extra money toward highest interest card first.

4. **Stop Using Cards**: Freeze or cut cards until debt is cleared. Use debit card or cash only.

5. **Negotiate**: Call your bank - they may reduce interest rate if you commit to a repayment plan. Many customers get 2-4% reduction."""
    
    else:  # business or other
        tips += """1. **Cash Flow Management**: Align EMI dates with your income cycle to avoid cash crunches.

2. **Business Growth**: Focus on growing revenue - every 10% revenue increase can help you prepay 15-20% faster.

3. **Tax Planning**: Consult CA about business loan interest deductibility as business expense under IT Act.

4. **Refinancing**: Review your rate annually - business loan rates fluctuate. Refinance if you can save 1-2%.

5. **Emergency Buffer**: Keep 3-6 months of EMIs as buffer in business account before aggressive prepayment."""
    
    if interest_rate > 12:
        tips += f"\n\n⚠️ **High Interest Alert**: Your rate of {interest_rate}% is quite high. Strongly consider refinancing or balance transfer options."
    
    return tips
