"""API routes: budget."""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict
import uuid
from datetime import datetime, timezone

from core.auth import require_auth
from core.config import db, logger
from core.models import User

router = APIRouter()

# =======================
# Budgeting Tool (50/30/20 and 65/25/10 Rules)
# =======================

@router.get("/budget/analysis")
async def analyze_budget(month: str, rule: str = "50/30/20", target_currency: str = "USD", user: User = Depends(require_auth)):
    """Analyze budget allocation based on selected rule"""
    try:
        # Get income and expenses for the month
        incomes = await db.monthly_incomes.find({"user_id": user.id, "month": month, "demo_mode": user.demo_mode}, {"_id": 0}).to_list(1000)
        expenses = await db.monthly_expenses.find({"user_id": user.id, "month": month, "demo_mode": user.demo_mode}, {"_id": 0}).to_list(1000)
        
        # Calculate total income (after tax)
        total_income = sum([inc['amount_after_tax'] for inc in incomes])
        
        # Auto-categorize expenses into buckets
        needs_categories = ['Housing', 'Transportation', 'Food & Dining', 'Healthcare', 'Insurance', 'Utilities', 'Debt Payments']
        wants_categories = ['Entertainment', 'Personal Care', 'Shopping', 'Travel', 'Pets']
        savings_categories = ['Savings & Investments']
        
        needs_total = 0
        wants_total = 0
        savings_total = 0
        
        needs_items = []
        wants_items = []
        savings_items = []
        
        for expense in expenses:
            category = expense.get('category', 'Other')
            amount = expense.get('amount', 0)
            description = expense.get('description', category)
            
            if category in needs_categories:
                needs_total += amount
                needs_items.append({"label": description, "amount": amount, "category": category})
            elif category in wants_categories:
                wants_total += amount
                wants_items.append({"label": description, "amount": amount, "category": category})
            elif category in savings_categories:
                savings_total += amount
                savings_items.append({"label": description, "amount": amount, "category": category})
            else:
                # Default to needs for uncategorized
                needs_total += amount
                needs_items.append({"label": description, "amount": amount, "category": category})
        
        total_spent = needs_total + wants_total + savings_total
        
        # Calculate ideal allocations based on rule
        if rule == "65/25/10":
            ideal_needs = total_income * 0.65
            ideal_savings = total_income * 0.25
            ideal_wants = total_income * 0.10
        else:  # Default 50/30/20
            ideal_needs = total_income * 0.50
            ideal_wants = total_income * 0.30
            ideal_savings = total_income * 0.20
        
        # Calculate percentages
        needs_percentage = (needs_total / total_income * 100) if total_income > 0 else 0
        wants_percentage = (wants_total / total_income * 100) if total_income > 0 else 0
        savings_percentage = (savings_total / total_income * 100) if total_income > 0 else 0
        
        # Calculate variances
        needs_variance = needs_total - ideal_needs
        wants_variance = wants_total - ideal_wants
        savings_variance = savings_total - ideal_savings
        
        unallocated = total_income - total_spent
        
        return {
            "month": month,
            "rule": rule,
            "total_income": round(total_income, 2),
            "total_spent": round(total_spent, 2),
            "unallocated": round(unallocated, 2),
            "buckets": {
                "needs": {
                    "ideal_amount": round(ideal_needs, 2),
                    "ideal_percentage": 65 if rule == "65/25/10" else 50,
                    "actual_amount": round(needs_total, 2),
                    "actual_percentage": round(needs_percentage, 1),
                    "variance": round(needs_variance, 2),
                    "status": "over" if needs_variance > 0 else "under" if needs_variance < -100 else "good",
                    "items": needs_items
                },
                "savings": {
                    "ideal_amount": round(ideal_savings, 2),
                    "ideal_percentage": 25 if rule == "65/25/10" else 20,
                    "actual_amount": round(savings_total, 2),
                    "actual_percentage": round(savings_percentage, 1),
                    "variance": round(savings_variance, 2),
                    "status": "over" if savings_variance > 0 else "under" if savings_variance < -100 else "good",
                    "items": savings_items
                },
                "wants": {
                    "ideal_amount": round(ideal_wants, 2),
                    "ideal_percentage": 10 if rule == "65/25/10" else 30,
                    "actual_amount": round(wants_total, 2),
                    "actual_percentage": round(wants_percentage, 1),
                    "variance": round(wants_variance, 2),
                    "status": "over" if wants_variance > 0 else "under" if wants_variance < -100 else "good",
                    "items": wants_items
                }
            },
            "income_sources": [{"source": inc['source'], "amount": inc['amount_after_tax']} for inc in incomes]
        }
    except Exception as e:
        logger.error(f"Budget analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/budget/templates")
async def get_budget_templates():
    """Get predefined budget item templates"""
    return {
        "needs": [
            "Rent / Mortgage",
            "Groceries",
            "Insurance (health, home, car)",
            "Car Payment",
            "Gas / Transportation",
            "Minimum Debt Payments",
            "Phone Bill",
            "Internet",
            "Electricity",
            "Water Bill",
            "Utilities",
            "Miscellaneous"
        ],
        "savings": [
            "Emergency Fund",
            "Investment accounts",
            "Workplace retirement (401k, EPF)",
            "Extra debt payments",
            "Down payment savings",
            "Education fund"
        ],
        "wants": [
            "Clothing",
            "Eating out",
            "Travel",
            "Personal Care",
            "Subscriptions (Netflix, Spotify, etc.)",
            "Donations",
            "Coffee & Treats",
            "Entertainment",
            "Hobbies",
            "Miscellaneous"
        ]
    }



@router.post("/budget/save")
async def save_budget(budget_data: Dict, user: User = Depends(require_auth)):
    """Save custom budget allocation"""
    try:
        budget_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "month": budget_data.get('month'),
            "rule": budget_data.get('rule', '50/30/20'),
            "buckets": budget_data.get('buckets', {}),
            "custom_items": budget_data.get('custom_items', {}),
            "total_income": budget_data.get('total_income', 0),
            "demo_mode": user.demo_mode,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if budget exists for this month
        existing = await db.budgets.find_one({
            "user_id": user.id, 
            "month": budget_data.get('month'),
            "demo_mode": user.demo_mode
        })
        
        if existing:
            await db.budgets.update_one(
                {"user_id": user.id, "month": budget_data.get('month'), "demo_mode": user.demo_mode},
                {"$set": {**budget_doc, "id": existing['id'], "created_at": existing.get('created_at')}}
            )
        else:
            await db.budgets.insert_one(budget_doc)
        
        return {"success": True, "message": "Budget saved successfully"}
    except Exception as e:
        logger.error(f"Failed to save budget: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/budget/saved")
async def get_saved_budget(month: str, user: User = Depends(require_auth)):
    """Get saved custom budget for a month"""
    try:
        budget = await db.budgets.find_one({
            "user_id": user.id,
            "month": month,
            "demo_mode": user.demo_mode
        }, {"_id": 0})
        
        if not budget:
            return None
        
        return budget
    except Exception as e:
        logger.error(f"Failed to get saved budget: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/budget/comparison")
async def get_budget_comparison(months: str, rule: str = "50/30/20", target_currency: str = "USD", user: User = Depends(require_auth)):
    """Get budget comparison across multiple months"""
    try:
        month_list = months.split(',')[:6]  # Max 6 months
        comparison_data = []
        
        for month in month_list:
            # Get income and expenses
            incomes = await db.monthly_incomes.find({
                "user_id": user.id, 
                "month": month.strip(),
                "demo_mode": user.demo_mode
            }, {"_id": 0}).to_list(1000)
            
            expenses = await db.monthly_expenses.find({
                "user_id": user.id, 
                "month": month.strip(),
                "demo_mode": user.demo_mode
            }, {"_id": 0}).to_list(1000)
            
            total_income = sum([inc['amount_after_tax'] for inc in incomes])
            total_expenses = sum([exp['amount'] for exp in expenses])
            
            # Categorize
            needs_categories = ['Housing', 'Transportation', 'Food & Dining', 'Healthcare', 'Insurance', 'Utilities', 'Debt Payments']
            wants_categories = ['Entertainment', 'Personal Care', 'Shopping', 'Travel', 'Pets']
            
            needs = sum([exp['amount'] for exp in expenses if exp.get('category') in needs_categories])
            wants = sum([exp['amount'] for exp in expenses if exp.get('category') in wants_categories])
            savings = total_income - needs - wants
            
            comparison_data.append({
                "month": month.strip(),
                "total_income": round(total_income, 2),
                "needs": round(needs, 2),
                "wants": round(wants, 2),
                "savings": round(savings, 2),
                "needs_percentage": round((needs / total_income * 100) if total_income > 0 else 0, 1),
                "wants_percentage": round((wants / total_income * 100) if total_income > 0 else 0, 1),
                "savings_percentage": round((savings / total_income * 100) if total_income > 0 else 0, 1)
            })
        
        return {
            "months": comparison_data,
            "rule": rule
        }
    except Exception as e:
        logger.error(f"Budget comparison error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
