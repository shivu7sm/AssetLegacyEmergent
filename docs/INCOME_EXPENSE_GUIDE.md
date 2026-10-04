# Income & Expense Tracking - Complete Guide

## Overview

The Income & Expense tracking feature helps you monitor your monthly cash flow, calculate savings rate, and understand where your money comes from and goes. This is a **separate feature** from Asset Tracking, focusing on monthly transactions rather than long-term wealth accumulation.

---

## Summary Section Explained

### What the Summary Tab Shows

The **Summary Tab** provides a high-level overview of your financial health for the selected month:

#### 1. Income Breakdown by Source
Displays all your income grouped by source (Salary, Freelance, Investment Returns, etc.) showing:
- Source name
- Total amount received (after tax)
- Visual representation

**Example:**
```
Salary                    $6,800
Freelance/Consulting      $1,700
Investment Returns        $382.50
─────────────────────────────────
Total Income (After Tax)  $8,882.50
```

#### 2. Expenses Breakdown by Category
Shows your spending grouped by category (Housing, Food, Transportation, etc.):
- Category name
- Total amount spent
- Sorted from highest to lowest (shows top 8)

**Example:**
```
Housing                   $1,800
Healthcare                $350
Food & Dining             $770 (Groceries + Restaurants)
Transportation            $180
Shopping                  $150
Entertainment             $65
─────────────────────────────────
Total Expenses            $3,565
```

---

## Summary Cards - Real-Time Calculations

The four cards at the top display **real-time calculations** based on your actual income and expense entries:

### Card 1: Total Income (Green)
```
Formula: Sum of all income.amount_after_tax for selected month
Example: $6,800 (Salary) + $1,700 (Freelance) + $382.50 (Dividends) = $8,882.50
```
- Shows income **after tax deductions**
- Converts all currencies to your selected currency
- Updates instantly when you add/edit/delete income

### Card 2: Total Expenses (Red)
```
Formula: Sum of all expense.amount for selected month
Example: $1,800 (Rent) + $450 (Groceries) + $180 (Gas) + ... = $3,565
```
- Shows total spending for the month
- Includes both essential and discretionary expenses
- Converts all currencies to your selected currency
- Updates instantly when you add/edit/delete expenses

### Card 3: Net Savings (Blue/Green/Red)
```
Formula: Total Income (After Tax) - Total Expenses
Example: $8,882.50 - $3,565 = $5,317.50

Color Logic:
- Green if positive (surplus/savings)
- Red if negative (deficit/overspending)
```
- Shows how much you saved (or overspent)
- Label changes: "Surplus" or "Deficit"
- This is your actual monthly savings

### Card 4: Savings Rate (Purple)
```
Formula: (Net Savings / Total Income After Tax) × 100
Example: ($5,317.50 / $8,882.50) × 100 = 59.8%

Benchmarks:
- Below 10%: Low savings rate
- 10-20%: Average
- 20-30%: Good
- 30-50%: Excellent
- 50%+: Outstanding
```
- Percentage of your income that you're saving
- Financial health indicator
- Higher is generally better (but context matters)

---

## Demo Data Included

When you enable Demo Mode or reseed demo data, the system automatically creates:

### Demo Income Entries (3 sources):
1. **Salary**: $8,500 before tax → $6,800 after tax (20% tax rate)
2. **Freelance**: $2,000 before tax → $1,700 after tax
3. **Investment Returns**: $450 before tax → $382.50 after tax

**Total Demo Income**: $8,882.50 (after tax)

### Demo Expense Entries (10 categories):
1. Housing (Rent): $1,800
2. Food & Dining (Groceries): $450
3. Food & Dining (Restaurants): $320
4. Healthcare (Insurance): $350
5. Transportation (Fuel): $180
6. Utilities (Electricity): $120
7. Technology (Internet): $85
8. Entertainment: $65
9. Personal Care (Gym): $45
10. Shopping (Clothing): $150

**Total Demo Expenses**: $3,565

**Demo Net Savings**: $5,317.50 (59.8% savings rate)

---

## Summary Data Generation

### How Summary Works (NOT AI-Generated)

The summary section uses **real-time aggregation**, not AI:

1. **Data Fetching**:
   - Fetches all income entries for selected month
   - Fetches all expense entries for selected month

2. **Currency Conversion**:
   - Each entry's amount is converted to your target currency
   - Uses live exchange rates via `/api/currency/convert` endpoint
   - Same-currency entries skip conversion (instant)

3. **Aggregation**:
   - Groups income by `source` field
   - Groups expenses by `category` field
   - Sums amounts for each group

4. **Calculation**:
   - Totals are calculated in real-time
   - No caching (always fresh data)
   - Updates instantly when data changes

### No Refresh Button Needed

Because the summary is **calculated from your data** (not AI-generated):
- ✅ It automatically updates when you:
  - Add new income/expense
  - Edit existing entries
  - Delete entries
  - Change months
- ✅ No "Generate" or "Refresh" button required
- ✅ Always shows current state
- ✅ No API limits or generation costs

### If You See Empty Summary

If the summary section shows "No income recorded" or "No expenses recorded":
1. Make sure you've added entries for the selected month
2. Check the month dropdown - you might be viewing a different month
3. Enable Demo Mode to see how it works with sample data

---

## Key Differences: Summary vs AI Insights

| Feature | Summary (Income/Expense) | AI Insights (Assets) |
|---------|-------------------------|---------------------|
| Data Source | Your income/expense entries | Your assets portfolio |
| Type | Real-time aggregation | AI-generated analysis |
| Update | Instant (automatic) | Manual refresh needed |
| Refresh Button | Not needed | "Generate" button |
| API Calls | None (database query) | OpenAI/LLM API call |
| Cost | Free (always) | Uses AI credits |
| Content | Numbers, breakdowns | Advice, recommendations |

---

## Monthly View Navigation

### Month Selector
- Dropdown at top-right of page
- Shows last 12 months
- Format: "January 2025", "December 2024", etc.
- Default: Current month

### What Changes When You Switch Months
1. ✅ Summary cards recalculate for new month
2. ✅ Income table shows entries for new month
3. ✅ Expense table shows entries for new month
4. ✅ Summary breakdown updates
5. ✅ All amounts converted to your selected currency

---

## Best Practices

### For Accurate Summary

1. **Consistent Currency**:
   - Use same currency for most entries (reduces conversion errors)
   - Or ensure your primary currency is set correctly

2. **Complete Data Entry**:
   - Add all income sources (don't forget small amounts)
   - Record all expenses (track everything)
   - Missing data = inaccurate savings rate

3. **Categorize Properly**:
   - Use correct categories for expenses
   - Use subcategories for better breakdown
   - Mark essential vs discretionary accurately

4. **Monthly Discipline**:
   - Add entries as they happen (don't wait till month-end)
   - Review summary weekly to stay on track
   - Compare months to see trends

### Understanding Your Numbers

**If Savings Rate is Low (<10%)**:
- Review discretionary expenses (Entertainment, Shopping, Dining Out)
- Look for recurring charges you don't use (subscriptions)
- Compare essential vs non-essential spending ratio

**If Savings Rate is High (>50%)**:
- Great job! Consider if you're living comfortably
- Ensure emergency fund is adequate
- Think about investment opportunities for excess savings

**If Net Savings is Negative (Deficit)**:
- ⚠️ You're overspending - review expenses immediately
- Identify categories where you can cut back
- Look for ways to increase income

---

## Technical Details

### Summary API Endpoint
```
GET /api/income-expense/summary?month=YYYY-MM&target_currency=USD
```

**Returns:**
```json
{
  "month": "2025-01",
  "total_income_before_tax": 10950.00,
  "total_tax_deducted": 2067.50,
  "total_income_after_tax": 8882.50,
  "total_expenses": 3565.00,
  "net_savings": 5317.50,
  "savings_rate": 59.86,
  "currency": "USD",
  "income_by_source": {
    "Salary": 6800.00,
    "Freelance/Consulting": 1700.00,
    "Investment Returns": 382.50
  },
  "expenses_by_category": {
    "Housing": 1800.00,
    "Food & Dining": 770.00,
    "Healthcare": 350.00,
    "Transportation": 180.00,
    "Utilities": 120.00,
    "Technology": 85.00,
    "Shopping": 150.00,
    "Entertainment": 65.00,
    "Personal Care": 45.00
  }
}
```

### Data Flow
```
1. User selects month → Frontend calls summary API
2. Backend fetches income entries (month filter)
3. Backend fetches expense entries (month filter)
4. Each entry converted to target currency
5. Income grouped by source, expenses by category
6. Totals calculated, savings rate computed
7. JSON response sent to frontend
8. Cards and breakdown rendered
```

---

## FAQ

### Q: Why is my summary empty?
**A:** You haven't added income or expenses for the selected month yet. Switch to current month and add entries, or enable Demo Mode to see sample data.

### Q: Do I need to click "Generate" or "Refresh"?
**A:** No! Summary is calculated from your data in real-time. It updates automatically when you add/edit/delete entries.

### Q: Can I see multiple months at once?
**A:** Currently, you view one month at a time. Use the month dropdown to switch between months and compare.

### Q: What if my income comes in multiple currencies?
**A:** The system automatically converts all amounts to your selected currency using live exchange rates.

### Q: Is the savings rate calculation accurate?
**A:** Yes, it's a simple formula: (Income - Expenses) / Income × 100. Make sure all entries are recorded for accuracy.

### Q: Can I export my summary?
**A:** Not yet, but you can screenshot the summary cards or breakdown. Export feature may be added in future updates.

### Q: How is this different from AI Insights?
**A:** AI Insights analyzes your **assets** and gives recommendations. Income/Expense tracks your monthly **cash flow** and calculates savings. Two different purposes.

---

## Summary Cards Quick Reference

```
┌─────────────────────────────────────────────────────┐
│ 💰 Total Income (After Tax)        [GREEN]         │
│ $8,882.50                                           │
│ Sum of all income (tax deducted)                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 💸 Total Expenses                  [RED]            │
│ $3,565.00                                           │
│ Sum of all spending this month                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 💵 Net Savings                     [BLUE/GREEN/RED] │
│ $5,317.50                                           │
│ Income - Expenses (Surplus/Deficit)                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📊 Savings Rate                    [PURPLE]         │
│ 59.8%                                               │
│ (Savings / Income) × 100                            │
└─────────────────────────────────────────────────────┘
```

---

## Demo Data Access

### Enable Demo Mode
1. Go to Settings → Demo Data
2. Click "Load Dummy Data"
3. System creates:
   - 18 assets
   - 5 documents
   - 3 income entries
   - 10 expense entries
   - Will with beneficiaries
   - Scheduled messages
   - AI insights

### View Demo Income/Expenses
1. Navigate to Income & Expenses page
2. You'll see populated data for current month
3. Summary cards show calculated values
4. Breakdown shows income by source and expenses by category

### Reset Demo Data
1. Go to Settings → Demo Data
2. Click "Reseed Demo Data"
3. All demo entries refreshed with new data

---

## Troubleshooting

### Issue: Summary shows $0 for everything
**Solution:** Add income/expense entries for the selected month, or enable Demo Mode.

### Issue: Savings rate shows NaN or weird number
**Solution:** This happens if total income is $0. Add income entries first.

### Issue: Currency conversion seems wrong
**Solution:** Exchange rates update daily. The system uses live rates from the currency API. Wait a day or check your target currency setting.

### Issue: Can't see my entries in summary
**Solution:** Check that you're viewing the correct month. Entries are month-specific.

---

## Related Features

- **Assets**: Track long-term wealth (real estate, stocks, crypto)
- **AI Insights**: Get AI-powered financial advice based on assets
- **Documents**: Store receipts, invoices, tax documents
- **Settings → Preferences**: Change default currency

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Feature Status:** ✅ Production Ready
