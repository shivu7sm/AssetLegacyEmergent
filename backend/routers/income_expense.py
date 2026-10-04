"""API routes: income expense."""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone

from core.auth import require_auth
from core.config import db
from core.models import MonthlyExpense, MonthlyExpenseCreate, MonthlyExpenseUpdate, MonthlyIncome, MonthlyIncomeCreate, MonthlyIncomeUpdate, MonthlySummary, User
from routers.prices import get_currency_conversion

router = APIRouter()

# Income & Expense Tracking Routes
@router.post("/income")
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
        recurring=income_data.recurring if income_data.recurring is not None else True,
        demo_mode=user.demo_mode  # Track demo/live
    )
    
    income_dict = income.model_dump()
    income_dict['created_at'] = income_dict['created_at'].isoformat()
    income_dict['updated_at'] = income_dict['updated_at'].isoformat()
    
    await db.monthly_incomes.insert_one(income_dict)
    
    return {"success": True, "income_id": income.id, "income": income}

@router.get("/income")
async def get_incomes(month: Optional[str] = None, user: User = Depends(require_auth)):
    """Get all income entries, optionally filtered by month"""
    query = {"user_id": user.id, "demo_mode": user.demo_mode}  # Filter by demo/live mode
    if month:
        query["month"] = month
    
    incomes = await db.monthly_incomes.find(query, {"_id": 0}).sort("month", -1).to_list(1000)
    return {"incomes": incomes}

@router.get("/income/{income_id}")
async def get_income(income_id: str, user: User = Depends(require_auth)):
    """Get a specific income entry"""
    income = await db.monthly_incomes.find_one({"id": income_id, "user_id": user.id}, {"_id": 0})
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    return income

@router.put("/income/{income_id}")
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

@router.delete("/income/{income_id}")
async def delete_income(income_id: str, user: User = Depends(require_auth)):
    """Delete an income entry"""
    result = await db.monthly_incomes.delete_one({"id": income_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Income not found")
    return {"success": True, "message": "Income deleted"}

@router.post("/expenses")
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
        notes=expense_data.notes,
        demo_mode=user.demo_mode  # Track demo/live
    )
    
    expense_dict = expense.model_dump()
    expense_dict['created_at'] = expense_dict['created_at'].isoformat()
    expense_dict['updated_at'] = expense_dict['updated_at'].isoformat()
    
    await db.monthly_expenses.insert_one(expense_dict)
    
    return {"success": True, "expense_id": expense.id, "expense": expense}

@router.get("/expenses")
async def get_expenses(month: Optional[str] = None, category: Optional[str] = None, user: User = Depends(require_auth)):
    """Get all expense entries, optionally filtered by month and/or category"""
    query = {"user_id": user.id, "demo_mode": user.demo_mode}  # Filter by demo/live mode
    if month:
        query["month"] = month
    if category:
        query["category"] = category
    
    expenses = await db.monthly_expenses.find(query, {"_id": 0}).sort("month", -1).to_list(1000)
    return {"expenses": expenses}

@router.get("/expenses/{expense_id}")
async def get_expense(expense_id: str, user: User = Depends(require_auth)):
    """Get a specific expense entry"""
    expense = await db.monthly_expenses.find_one({"id": expense_id, "user_id": user.id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.put("/expenses/{expense_id}")
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

@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user: User = Depends(require_auth)):
    """Delete an expense entry"""
    result = await db.monthly_expenses.delete_one({"id": expense_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"success": True, "message": "Expense deleted"}

@router.get("/income-expense/summary")
async def get_monthly_summary(month: str, target_currency: str = "USD", user: User = Depends(require_auth)):
    """Get monthly income and expense summary"""
    # Fetch incomes for the month - filter by demo/live mode
    incomes = await db.monthly_incomes.find({"user_id": user.id, "month": month, "demo_mode": user.demo_mode}, {"_id": 0}).to_list(1000)
    
    # Fetch expenses for the month - filter by demo/live mode
    expenses = await db.monthly_expenses.find({"user_id": user.id, "month": month, "demo_mode": user.demo_mode}, {"_id": 0}).to_list(1000)
    
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

@router.get("/income-expense/categories")
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
        "Net Banking"
    ]

    return {
        "expense_categories": categories,
        "income_sources": income_sources,
        "payment_methods": payment_methods
    }
