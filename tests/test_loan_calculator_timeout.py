#!/usr/bin/env python3
"""
Focused test for Loan Calculator API with Timeout Fix
Tests the 3 priority scenarios requested
"""

import requests
import time
import subprocess
from datetime import datetime

class LoanCalculatorTester:
    def __init__(self):
        self.base_url = "https://wealth-tracker-fix.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_passed = 0
        self.tests_failed = 0
        
    def create_test_user(self):
        """Create test user and session in MongoDB"""
        print("🔧 Creating test user and session...")
        
        timestamp = int(time.time())
        self.user_id = f"loan-test-user-{timestamp}"
        self.session_token = f"loan_test_session_{timestamp}"
        
        mongo_commands = f"""
use('test_database');
var userId = '{self.user_id}';
var sessionToken = '{self.session_token}';
var expiresAt = new Date(Date.now() + 7*24*60*60*1000);

db.users.insertOne({{
  id: userId,
  email: 'loan.test.{timestamp}@example.com',
  name: 'Loan Test User',
  last_activity: new Date(),
  created_at: new Date()
}});

db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: expiresAt,
  created_at: new Date()
}});

print('Test user created');
"""
        
        try:
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Test user created: {self.user_id}")
                return True
            else:
                print(f"❌ Failed to create test user: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error creating test user: {str(e)}")
            return False
    
    def test_loan_calculator(self, test_name, loan_data, expected_checks):
        """Test loan calculator endpoint with specific data"""
        print(f"\n📊 {test_name}")
        print(f"   Principal: ${loan_data['principal']:,.2f}")
        print(f"   Interest Rate: {loan_data['annual_interest_rate']}%")
        print(f"   Tenure: {loan_data['tenure_months']} months")
        
        url = f"{self.api_url}/loan-calculator"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        
        start_time = time.time()
        
        try:
            response = requests.post(
                url,
                json=loan_data,
                headers=headers,
                timeout=25  # 25 second timeout (should be well within 20 seconds now)
            )
            
            elapsed_time = time.time() - start_time
            
            print(f"   ⏱️  Response time: {elapsed_time:.2f} seconds")
            
            # Check 1: Response time < 20 seconds
            if elapsed_time < 20:
                print(f"   ✅ Response within 20 seconds ({elapsed_time:.2f}s)")
                self.tests_passed += 1
            else:
                print(f"   ❌ Response took too long ({elapsed_time:.2f}s)")
                self.tests_failed += 1
            
            # Check 2: Status code 200
            if response.status_code == 200:
                print(f"   ✅ Status code: 200")
                self.tests_passed += 1
            else:
                print(f"   ❌ Status code: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.tests_failed += 1
                return False
            
            result = response.json()
            
            # Check 3: Response structure
            required_fields = ['monthly_payment', 'total_interest', 'total_amount', 'amortization_schedule', 'ai_tips']
            missing_fields = [f for f in required_fields if f not in result]
            
            if not missing_fields:
                print(f"   ✅ All required fields present")
                self.tests_passed += 1
            else:
                print(f"   ❌ Missing fields: {missing_fields}")
                self.tests_failed += 1
                return False
            
            # Check 4: Amortization schedule count
            schedule = result.get('amortization_schedule', [])
            expected_count = loan_data['tenure_months']
            
            if len(schedule) == expected_count:
                print(f"   ✅ Amortization schedule has {expected_count} entries")
                self.tests_passed += 1
            else:
                print(f"   ❌ Expected {expected_count} entries, got {len(schedule)}")
                self.tests_failed += 1
            
            # Check 5: AI tips field exists (content doesn't matter)
            ai_tips = result.get('ai_tips', '')
            if ai_tips:
                if 'timeout' in ai_tips.lower() or 'unavailable' in ai_tips.lower():
                    print(f"   ⚠️  AI tips: Fallback message (timeout/unavailable)")
                else:
                    print(f"   ✅ AI tips: Generated successfully ({len(ai_tips)} chars)")
                self.tests_passed += 1
            else:
                print(f"   ❌ AI tips field is empty")
                self.tests_failed += 1
            
            # Check 6: Mathematical calculations
            monthly_payment = result.get('monthly_payment', 0)
            total_interest = result.get('total_interest', 0)
            total_amount = result.get('total_amount', 0)
            
            print(f"   💰 Monthly Payment: ${monthly_payment:,.2f}")
            print(f"   💰 Total Interest: ${total_interest:,.2f}")
            print(f"   💰 Total Amount: ${total_amount:,.2f}")
            
            # Verify: total_amount = principal + total_interest
            expected_total = loan_data['principal'] + total_interest
            if abs(total_amount - expected_total) < 0.01:
                print(f"   ✅ Total amount calculation correct")
                self.tests_passed += 1
            else:
                print(f"   ❌ Total amount mismatch: expected ${expected_total:.2f}, got ${total_amount:.2f}")
                self.tests_failed += 1
            
            # Check specific expected values if provided
            if 'expected_monthly_payment' in expected_checks:
                expected_mp = expected_checks['expected_monthly_payment']
                if abs(monthly_payment - expected_mp) < 1:  # Allow $1 tolerance
                    print(f"   ✅ Monthly payment matches expected: ${expected_mp:.2f}")
                    self.tests_passed += 1
                else:
                    print(f"   ❌ Monthly payment mismatch: expected ${expected_mp:.2f}, got ${monthly_payment:.2f}")
                    self.tests_failed += 1
            
            if 'expected_total_interest' in expected_checks:
                expected_ti = expected_checks['expected_total_interest']
                if abs(total_interest - expected_ti) < 1:  # Allow $1 tolerance
                    print(f"   ✅ Total interest matches expected: ${expected_ti:.2f}")
                    self.tests_passed += 1
                else:
                    print(f"   ❌ Total interest mismatch: expected ${expected_ti:.2f}, got ${total_interest:.2f}")
                    self.tests_failed += 1
            
            # Verify final balance is 0
            if schedule:
                final_balance = schedule[-1].get('remaining_balance', -1)
                if final_balance == 0:
                    print(f"   ✅ Final balance is 0")
                    self.tests_passed += 1
                else:
                    print(f"   ❌ Final balance is ${final_balance:.2f}, expected 0")
                    self.tests_failed += 1
            
            return True
            
        except requests.exceptions.Timeout:
            elapsed_time = time.time() - start_time
            print(f"   ❌ Request timed out after {elapsed_time:.2f} seconds")
            self.tests_failed += 1
            return False
        except Exception as e:
            elapsed_time = time.time() - start_time
            print(f"   ❌ Error after {elapsed_time:.2f}s: {str(e)}")
            self.tests_failed += 1
            return False
    
    def run_tests(self):
        """Run all 3 priority test scenarios"""
        print("\n" + "="*70)
        print("LOAN CALCULATOR API - TIMEOUT FIX TESTING")
        print("="*70)
        
        if not self.create_test_user():
            print("\n❌ Failed to create test user. Exiting.")
            return False
        
        # Test 1: Basic loan calculation (Most Important)
        test1_data = {
            "principal": 50000,
            "annual_interest_rate": 8.5,
            "tenure_months": 60,
            "loan_type": "personal"
        }
        test1_checks = {}  # We'll verify calculations are correct
        
        self.test_loan_calculator(
            "Test 1: Basic Loan Calculation (50k, 8.5%, 60 months)",
            test1_data,
            test1_checks
        )
        
        # Test 2: Zero interest test
        test2_data = {
            "principal": 12000,
            "annual_interest_rate": 0,
            "tenure_months": 12,
            "loan_type": "personal"
        }
        test2_checks = {
            "expected_monthly_payment": 1000,  # 12000/12
            "expected_total_interest": 0
        }
        
        self.test_loan_calculator(
            "Test 2: Zero Interest Loan (12k, 0%, 12 months)",
            test2_data,
            test2_checks
        )
        
        # Test 3: Quick validation test
        test3_data = {
            "principal": 10000,
            "annual_interest_rate": 10,
            "tenure_months": 24,
            "loan_type": "personal"
        }
        test3_checks = {}
        
        self.test_loan_calculator(
            "Test 3: Quick Validation (10k, 10%, 24 months)",
            test3_data,
            test3_checks
        )
        
        # Print summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        total_tests = self.tests_passed + self.tests_failed
        success_rate = (self.tests_passed / total_tests * 100) if total_tests > 0 else 0
        
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_failed}")
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if self.tests_failed == 0:
            print("\n🎉 ALL TESTS PASSED! Timeout fix is working correctly.")
            return True
        else:
            print(f"\n⚠️  {self.tests_failed} test(s) failed. Review the output above.")
            return False

if __name__ == "__main__":
    tester = LoanCalculatorTester()
    success = tester.run_tests()
    exit(0 if success else 1)
