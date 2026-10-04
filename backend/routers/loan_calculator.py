"""API routes: loan calculator."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
import os
from datetime import datetime
import asyncio
import math

from core.auth import require_auth
from core.config import logger
from core.models import LoanCalculatorRequest, User
from services.loan_math import calculate_amortization, calculate_prepayment_scenarios, calculate_principal_vs_interest_split, calculate_refinance_comparison, calculate_tax_benefits, generate_fallback_tips

router = APIRouter()

@router.post("/loan-calculator")
async def calculate_loan_repayment(request: LoanCalculatorRequest, user: User = Depends(require_auth)):
    """Enhanced loan calculator with prepayment analysis, tax benefits, and AI tips"""
    try:
        # Calculate monthly rate
        monthly_rate = (request.annual_interest_rate / 100) / 12
        
        # Generate base amortization schedule
        schedule = calculate_amortization(request.principal, monthly_rate, request.tenure_months)
        
        # Calculate totals
        total_payment = sum([entry["payment"] for entry in schedule])
        total_interest = total_payment - request.principal
        monthly_payment = schedule[0]["payment"] if schedule else 0
        
        # Calculate prepayment scenarios
        prepayment_scenarios = calculate_prepayment_scenarios(
            request.principal, 
            request.annual_interest_rate, 
            request.tenure_months,
            schedule
        )
        
        # Calculate tax benefits (home and education loans)
        tax_benefits = None
        if request.loan_type in ["home", "education"]:
            tax_benefits = calculate_tax_benefits(
                request.principal,
                request.annual_interest_rate,
                request.tenure_months,
                request.loan_type,
                tax_bracket=0.30  # Default 30% tax bracket
            )
        
        # Calculate principal vs interest split
        principal_vs_interest = calculate_principal_vs_interest_split(schedule, request.tenure_months)
        
        # Prepare base response
        response = {
            "monthly_payment": round(monthly_payment, 2),
            "total_interest": round(total_interest, 2),
            "total_amount": round(total_payment, 2),
            "amortization_schedule": schedule,
            "prepayment_scenarios": prepayment_scenarios,
            "tax_benefits": tax_benefits,
            "principal_vs_interest_split": principal_vs_interest,
            "ai_tips": None  # Will be loaded separately
        }
        
        # Return immediate response
        return response
        
    except Exception as e:
        logger.error(f"Loan calculator error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/loan-calculator/ai-tips")
async def generate_loan_ai_tips(request: LoanCalculatorRequest, user: User = Depends(require_auth)):
    """Generate AI tips separately to avoid blocking main calculation"""
    try:
        # Calculate basic metrics for AI context
        monthly_rate = (request.annual_interest_rate / 100) / 12
        schedule = calculate_amortization(request.principal, monthly_rate, request.tenure_months)
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
Principal Amount: ₹{request.principal:,.2f}
Interest Rate: {request.annual_interest_rate}%
Tenure: {request.tenure_months} months ({request.tenure_months // 12} years)
Monthly Payment: ₹{monthly_payment:,.2f}
Total Interest: ₹{total_interest:,.2f}

Focus on practical strategies like:
- Extra payment opportunities
- Refinancing considerations (if rate is high)
- Payment timing optimization
- Debt avalanche vs snowball methods
- Budget adjustments
{"- Tax benefits under Section 80C and 24(b)" if request.loan_type == "home" else ""}
{"- Tax benefits under Section 80E" if request.loan_type == "education" else ""}

Keep tips concise and numbered. Avoid generic advice. Be specific to Indian context."""
                    )
                    
                    return await chat.send_message(user_message)
                
                # Add 20 second timeout for AI generation
                ai_tips = await asyncio.wait_for(generate_tips(), timeout=20.0)
            else:
                ai_tips = "AI tips feature requires API key configuration."
        except asyncio.TimeoutError:
            logger.warning(f"AI tips generation timed out for user {user.id}")
            # Provide loan-type specific fallback tips
            ai_tips = generate_fallback_tips(request.loan_type, request.annual_interest_rate)
        except Exception as ai_error:
            logger.error(f"AI tips generation failed: {str(ai_error)}")
            ai_tips = generate_fallback_tips(request.loan_type, request.annual_interest_rate)
        
        return {"ai_tips": ai_tips}
        
    except Exception as e:
        logger.error(f"AI tips generation error: {str(e)}")
        return {"ai_tips": "Unable to generate personalized tips at this time. The calculation results are accurate."}

@router.post("/loan-calculator/refinance")
async def calculate_refinance_options(
    current_principal: float,
    current_rate: float,
    remaining_months: int,
    new_rate: float,
    closing_costs: float,
    user: User = Depends(require_auth)
):
    """Calculate if refinancing makes financial sense"""
    try:
        comparison = calculate_refinance_comparison(
            current_principal,
            current_rate,
            remaining_months,
            new_rate,
            closing_costs
        )
        return comparison
    except Exception as e:
        logger.error(f"Refinance calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/loan-calculator/multi-loan-strategy")
async def calculate_multi_loan_strategy(loans: List[Dict], extra_payment: float, user: User = Depends(require_auth)):
    """Calculate optimal repayment strategy for multiple loans"""
    try:
        # Debt Avalanche: Pay highest interest rate first
        avalanche_loans = sorted(loans, key=lambda x: x["annual_interest_rate"], reverse=True)
        
        # Debt Snowball: Pay smallest balance first
        snowball_loans = sorted(loans, key=lambda x: x["principal"])
        
        # Calculate total payoff for each strategy
        def calculate_strategy(loan_order, extra_payment):
            total_months = 0
            total_interest = 0
            monthly_payment = sum([l["monthly_payment"] for l in loan_order])
            
            payment_order = []
            for loan in loan_order:
                # Simplified calculation
                principal = loan["principal"]
                rate = loan["annual_interest_rate"] / 100 / 12
                payment = loan["monthly_payment"] + (extra_payment if loan == loan_order[0] else 0)
                
                # Estimate payoff time
                if rate > 0:
                    months = -(math.log(1 - (principal * rate) / payment) / math.log(1 + rate))
                else:
                    months = principal / payment
                    
                total_months += months
                total_interest += (payment * months) - principal
                
                payment_order.append({
                    "name": loan["name"],
                    "principal": principal,
                    "rate": loan["annual_interest_rate"],
                    "payoff_months": round(months, 1)
                })
            
            return {
                "total_interest": round(total_interest, 2),
                "payoff_months": round(total_months, 2),
                "monthly_payment": round(monthly_payment + extra_payment, 2),
                "payment_order": payment_order
            }
        
        avalanche_result = calculate_strategy(avalanche_loans, extra_payment)
        snowball_result = calculate_strategy(snowball_loans, extra_payment)
        
        return {
            "avalanche": {
                "strategy_name": "Debt Avalanche (Highest Interest First)",
                **avalanche_result
            },
            "snowball": {
                "strategy_name": "Debt Snowball (Smallest Balance First)",
                **snowball_result
            },
            "recommended": "avalanche" if avalanche_result["total_interest"] < snowball_result["total_interest"] else "snowball",
            "interest_difference": abs(avalanche_result["total_interest"] - snowball_result["total_interest"])
        }
        
    except Exception as e:
        logger.error(f"Multi-loan strategy error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
