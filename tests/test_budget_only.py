#!/usr/bin/env python3
"""
Budget Planner Feature Testing Only
"""

import requests
import sys
import json
from datetime import datetime
import time

class BudgetPlannerTester:
    def __init__(self, base_url="https://wealth-tracker-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=10):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=timeout)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"success": True}
            return None

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return None

    def create_test_user(self):
        """Create test user and session in MongoDB"""
        print("\n🔧 Creating test user and session...")
        
        timestamp = int(time.time())
        self.user_id = f"budget-test-user-{timestamp}"
        self.session_token = f"budget_test_session_{timestamp}"
        
        mongo_commands = f"""
use('test_database');
var userId = '{self.user_id}';
var sessionToken = '{self.session_token}';
var expiresAt = new Date(Date.now() + 7*24*60*60*1000);

// Create user
db.users.insertOne({{
  id: userId,
  email: 'budget.test.{timestamp}@example.com',
  name: 'Budget Test User {timestamp}',
  picture: 'https://via.placeholder.com/150',
  last_activity: new Date(),
  created_at: new Date(),
  demo_mode: false
}});

// Create session
db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: expiresAt,
  created_at: new Date()
}});

print('Test user and session created successfully');
"""
        
        try:
            import subprocess
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Test user created: {self.user_id}")
                print(f"✅ Session token: {self.session_token}")
                return True
            else:
                print(f"❌ Failed to create test user: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating test user: {str(e)}")
            return False

    def test_budget_planner(self):
        """Test Budget Planner Feature"""
        print("\n💰 Testing Budget Planner Feature (Phase 1 & 2)...")
        print("=" * 60)
        
        # Create test income and expense data for December 2025
        print("\n📝 Setting up test data for December 2025...")
        
        # Create income entries
        test_incomes = [
            {
                "month": "2025-12",
                "source": "salary",
                "description": "Monthly Salary",
                "amount_before_tax": 120000,
                "tax_deducted": 20000,
                "currency": "INR"
            },
            {
                "month": "2025-12",
                "source": "freelance",
                "description": "Freelance Project",
                "amount_before_tax": 30000,
                "tax_deducted": 3000,
                "currency": "INR"
            }
        ]
        
        for income in test_incomes:
            self.run_test(
                f"Create income: {income['description']}",
                "POST",
                "income",
                200,
                income
            )
        
        # Create expense entries with proper categorization
        test_expenses = [
            # Needs
            {"month": "2025-12", "category": "Housing", "description": "Rent", "amount": 30000, "currency": "INR"},
            {"month": "2025-12", "category": "Food & Dining", "description": "Groceries", "amount": 8000, "currency": "INR"},
            {"month": "2025-12", "category": "Transportation", "description": "Fuel", "amount": 5000, "currency": "INR"},
            {"month": "2025-12", "category": "Utilities", "description": "Electricity", "amount": 2000, "currency": "INR"},
            {"month": "2025-12", "category": "Healthcare", "description": "Medical", "amount": 3000, "currency": "INR"},
            # Wants
            {"month": "2025-12", "category": "Entertainment", "description": "Netflix", "amount": 500, "currency": "INR"},
            {"month": "2025-12", "category": "Shopping", "description": "Clothing", "amount": 4000, "currency": "INR"},
            {"month": "2025-12", "category": "Travel", "description": "Weekend Trip", "amount": 8000, "currency": "INR"},
            # Savings
            {"month": "2025-12", "category": "Savings & Investments", "description": "SIP", "amount": 10000, "currency": "INR"}
        ]
        
        for expense in test_expenses:
            self.run_test(
                f"Create expense: {expense['description']}",
                "POST",
                "expenses",
                200,
                expense
            )
        
        print("\n" + "=" * 60)
        print("🧪 Test 1: Budget Templates Endpoint")
        print("=" * 60)
        templates = self.run_test(
            "GET /api/budget/templates",
            "GET",
            "budget/templates",
            200
        )
        
        if templates:
            print(f"   Needs categories: {len(templates.get('needs', []))}")
            print(f"   Savings categories: {len(templates.get('savings', []))}")
            print(f"   Wants categories: {len(templates.get('wants', []))}")
        
        print("\n" + "=" * 60)
        print("🧪 Test 2: Budget Analysis with 50/30/20 Rule")
        print("=" * 60)
        analysis_50_30_20 = self.run_test(
            "GET /api/budget/analysis (50/30/20 rule)",
            "GET",
            "budget/analysis?month=2025-12&rule=50/30/20&target_currency=USD",
            200
        )
        
        if analysis_50_30_20:
            print(f"   Total Income: {analysis_50_30_20.get('total_income')}")
            print(f"   Total Spent: {analysis_50_30_20.get('total_spent')}")
            print(f"   Unallocated: {analysis_50_30_20.get('unallocated')}")
            
            buckets = analysis_50_30_20.get('buckets', {})
            for bucket_name in ['needs', 'wants', 'savings']:
                bucket = buckets.get(bucket_name, {})
                print(f"   {bucket_name.capitalize()}:")
                print(f"     - Ideal: {bucket.get('ideal_amount')} ({bucket.get('ideal_percentage')}%)")
                print(f"     - Actual: {bucket.get('actual_amount')} ({bucket.get('actual_percentage')}%)")
                print(f"     - Status: {bucket.get('status')}")
                print(f"     - Items: {len(bucket.get('items', []))}")
        
        print("\n" + "=" * 60)
        print("🧪 Test 3: Budget Analysis with 65/25/10 Rule")
        print("=" * 60)
        analysis_65_25_10 = self.run_test(
            "GET /api/budget/analysis (65/25/10 rule)",
            "GET",
            "budget/analysis?month=2025-12&rule=65/25/10&target_currency=USD",
            200
        )
        
        if analysis_65_25_10:
            buckets = analysis_65_25_10.get('buckets', {})
            for bucket_name in ['needs', 'savings', 'wants']:
                bucket = buckets.get(bucket_name, {})
                print(f"   {bucket_name.capitalize()}: {bucket.get('ideal_percentage')}% (Ideal: {bucket.get('ideal_amount')})")
        
        print("\n" + "=" * 60)
        print("🧪 Test 4: Save Custom Budget")
        print("=" * 60)
        custom_budget = {
            "month": "2025-12",
            "rule": "65/25/10",
            "total_income": 100000,
            "buckets": {},
            "custom_items": {
                "needs": [{"label": "Custom Rent", "amount": 30000}],
                "savings": [{"label": "SIP", "amount": 10000}],
                "wants": [{"label": "Netflix", "amount": 500}]
            }
        }
        
        save_response = self.run_test(
            "POST /api/budget/save",
            "POST",
            "budget/save",
            200,
            custom_budget
        )
        
        print("\n" + "=" * 60)
        print("🧪 Test 5: Retrieve Saved Budget")
        print("=" * 60)
        saved_budget = self.run_test(
            "GET /api/budget/saved",
            "GET",
            "budget/saved?month=2025-12",
            200
        )
        
        if saved_budget:
            print(f"   Month: {saved_budget.get('month')}")
            print(f"   Rule: {saved_budget.get('rule')}")
            print(f"   Total Income: {saved_budget.get('total_income')}")
            custom_items = saved_budget.get('custom_items', {})
            print(f"   Custom Items: Needs={len(custom_items.get('needs', []))}, Savings={len(custom_items.get('savings', []))}, Wants={len(custom_items.get('wants', []))}")
        
        print("\n" + "=" * 60)
        print("🧪 Test 6: Budget Comparison (6 months)")
        print("=" * 60)
        
        # Create data for additional months
        additional_months = ["2025-07", "2025-08", "2025-09", "2025-10", "2025-11"]
        
        for month in additional_months:
            self.run_test(
                f"Create income for {month}",
                "POST",
                "income",
                200,
                {
                    "month": month,
                    "source": "salary",
                    "description": "Monthly Salary",
                    "amount_before_tax": 100000,
                    "tax_deducted": 15000,
                    "currency": "INR"
                }
            )
            
            self.run_test(
                f"Create expense for {month}",
                "POST",
                "expenses",
                200,
                {
                    "month": month,
                    "category": "Housing",
                    "description": "Rent",
                    "amount": 25000,
                    "currency": "INR"
                }
            )
        
        comparison = self.run_test(
            "GET /api/budget/comparison (6 months)",
            "GET",
            "budget/comparison?months=2025-07,2025-08,2025-09,2025-10,2025-11,2025-12&rule=65/25/10",
            200
        )
        
        if comparison:
            months_data = comparison.get('months', [])
            print(f"   Months returned: {len(months_data)}")
            for month_data in months_data:
                print(f"   {month_data.get('month')}: Income={month_data.get('total_income')}, Needs={month_data.get('needs_percentage')}%, Wants={month_data.get('wants_percentage')}%, Savings={month_data.get('savings_percentage')}%")
        
        print("\n" + "=" * 60)
        print("🧪 Test 7: Edge Case - Month with No Data")
        print("=" * 60)
        empty_month_analysis = self.run_test(
            "GET /api/budget/analysis (empty month)",
            "GET",
            "budget/analysis?month=2025-01&rule=50/30/20&target_currency=USD",
            200
        )
        
        if empty_month_analysis:
            print(f"   Total Income: {empty_month_analysis.get('total_income')}")
            print(f"   Total Spent: {empty_month_analysis.get('total_spent')}")

    def cleanup(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        if not self.user_id:
            return
            
        mongo_cleanup = f"""
use('test_database');
db.users.deleteOne({{id: '{self.user_id}'}});
db.user_sessions.deleteOne({{user_id: '{self.user_id}'}});
db.monthly_incomes.deleteMany({{user_id: '{self.user_id}'}});
db.monthly_expenses.deleteMany({{user_id: '{self.user_id}'}});
db.budgets.deleteMany({{user_id: '{self.user_id}'}});
print('Test data cleaned up');
"""
        
        try:
            import subprocess
            subprocess.run(['mongosh', '--eval', mongo_cleanup], timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")

    def run(self):
        """Run all tests"""
        print("\n🚀 Starting Budget Planner Feature Tests")
        print("🌐 Testing against: " + self.base_url)
        print("=" * 60)
        
        if not self.create_test_user():
            print("❌ Failed to create test user")
            return False
        
        try:
            self.test_budget_planner()
        finally:
            self.cleanup()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        print("=" * 60)
        
        return success_rate >= 80

def main():
    tester = BudgetPlannerTester()
    success = tester.run()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
