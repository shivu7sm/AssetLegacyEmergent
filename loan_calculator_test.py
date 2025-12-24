#!/usr/bin/env python3
"""
Enhanced Loan Calculator API Testing
Tests all loan calculator endpoints with CA-level features
"""

import requests
import sys
import json
from datetime import datetime
import time
import subprocess

class LoanCalculatorTester:
    def __init__(self, base_url="https://wealth-tracker-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "details": details})
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def create_test_user(self):
        """Create test user and session in MongoDB"""
        print("\n🔧 Creating test user and session...")
        
        timestamp = int(time.time())
        self.user_id = f"loan-test-user-{timestamp}"
        self.session_token = f"loan_test_session_{timestamp}"
        
        mongo_commands = f"""
use('test_database');
var userId = '{self.user_id}';
var sessionToken = '{self.session_token}';
var expiresAt = new Date(Date.now() + 7*24*60*60*1000);

// Create user
db.users.insertOne({{
  id: userId,
  email: 'loan.test.{timestamp}@example.com',
  name: 'Loan Test User {timestamp}',
  picture: 'https://via.placeholder.com/150',
  last_activity: new Date(),
  created_at: new Date()
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

    def test_basic_home_loan(self):
        """Test Scenario 1: Basic Home Loan Calculation"""
        print("\n🏠 Test 1: Basic Home Loan Calculation")
        print("   Principal: ₹25,00,000 | Rate: 8.5% | Tenure: 240 months (20 years)")
        
        url = f"{self.api_url}/loan-calculator"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        
        payload = {
            "principal": 2500000,
            "annual_interest_rate": 8.5,
            "tenure_months": 240,
            "loan_type": "home"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ['monthly_payment', 'total_interest', 'total_amount', 
                                 'amortization_schedule', 'prepayment_scenarios', 
                                 'tax_benefits', 'principal_vs_interest_split']
                
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("Home Loan - Response Structure", False, 
                                f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Home Loan - Response Structure", True, 
                                "All required fields present")
                
                # Verify EMI calculation (using standard formula)
                P = 2500000
                r = 8.5 / 100 / 12
                n = 240
                expected_emi = P * r * ((1 + r) ** n) / (((1 + r) ** n) - 1)
                actual_emi = data.get('monthly_payment', 0)
                
                emi_diff = abs(expected_emi - actual_emi)
                if emi_diff < 1:  # Allow 1 rupee difference for rounding
                    self.log_test("Home Loan - EMI Calculation", True, 
                                f"EMI: ₹{actual_emi:,.2f} (Expected: ₹{expected_emi:,.2f})")
                else:
                    self.log_test("Home Loan - EMI Calculation", False, 
                                f"EMI: ₹{actual_emi:,.2f}, Expected: ₹{expected_emi:,.2f}, Diff: ₹{emi_diff:,.2f}")
                
                # Verify prepayment scenarios exist
                prepayment = data.get('prepayment_scenarios', {})
                expected_scenarios = ['extra_5k_monthly', 'extra_10k_monthly', 'annual_50k', 'onetime_100k']
                
                missing_scenarios = [s for s in expected_scenarios if s not in prepayment]
                if not missing_scenarios:
                    self.log_test("Home Loan - Prepayment Scenarios", True, 
                                f"All 4 scenarios present: {expected_scenarios}")
                    
                    # Verify each scenario has required fields
                    for scenario_name, scenario_data in prepayment.items():
                        required_scenario_fields = ['interest_saved', 'time_saved_months', 
                                                   'monthly_payment', 'total_interest']
                        missing_scenario_fields = [f for f in required_scenario_fields 
                                                  if f not in scenario_data]
                        
                        if not missing_scenario_fields:
                            self.log_test(f"Home Loan - Prepayment Scenario '{scenario_name}'", True,
                                        f"Interest saved: ₹{scenario_data.get('interest_saved', 0):,.2f}, "
                                        f"Time saved: {scenario_data.get('time_saved_months', 0)} months")
                        else:
                            self.log_test(f"Home Loan - Prepayment Scenario '{scenario_name}'", False,
                                        f"Missing fields: {missing_scenario_fields}")
                else:
                    self.log_test("Home Loan - Prepayment Scenarios", False, 
                                f"Missing scenarios: {missing_scenarios}")
                
                # Verify tax benefits for home loan
                tax_benefits = data.get('tax_benefits')
                if tax_benefits:
                    if tax_benefits.get('eligible'):
                        sections = tax_benefits.get('sections_applicable', [])
                        expected_sections = ['80C (Principal)', '24(b) (Interest)']
                        
                        if all(s in str(sections) for s in ['80C', '24']):
                            self.log_test("Home Loan - Tax Benefits (80C + 24b)", True,
                                        f"Principal deduction: ₹{tax_benefits.get('principal_deduction', 0):,.2f}, "
                                        f"Interest deduction: ₹{tax_benefits.get('interest_deduction', 0):,.2f}, "
                                        f"Total tax saved: ₹{tax_benefits.get('total_tax_saved', 0):,.2f}")
                        else:
                            self.log_test("Home Loan - Tax Benefits (80C + 24b)", False,
                                        f"Expected sections 80C and 24b, got: {sections}")
                    else:
                        self.log_test("Home Loan - Tax Benefits", False, "Not marked as eligible")
                else:
                    self.log_test("Home Loan - Tax Benefits", False, "Tax benefits not present")
                
                # Verify principal vs interest split
                split = data.get('principal_vs_interest_split')
                if split:
                    if 'first_year' in split and 'years_1_to_5' in split:
                        self.log_test("Home Loan - Principal vs Interest Split", True,
                                    f"First year - Principal: ₹{split['first_year'].get('principal', 0):,.2f}, "
                                    f"Interest: ₹{split['first_year'].get('interest', 0):,.2f}")
                    else:
                        self.log_test("Home Loan - Principal vs Interest Split", False,
                                    "Missing period breakdowns")
                else:
                    self.log_test("Home Loan - Principal vs Interest Split", False,
                                "Split data not present")
                
                print(f"\n   📊 Results Summary:")
                print(f"   Monthly EMI: ₹{data.get('monthly_payment', 0):,.2f}")
                print(f"   Total Interest: ₹{data.get('total_interest', 0):,.2f}")
                print(f"   Total Amount: ₹{data.get('total_amount', 0):,.2f}")
                
            else:
                self.log_test("Home Loan - API Call", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("Home Loan - API Call", False, f"Error: {str(e)}")

    def test_ai_tips_generation(self):
        """Test Scenario 2: AI Tips Generation"""
        print("\n🤖 Test 2: AI Tips Generation")
        print("   Testing async AI tips endpoint (may take up to 20 seconds)")
        
        url = f"{self.api_url}/loan-calculator/ai-tips"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        
        payload = {
            "principal": 2500000,
            "annual_interest_rate": 8.5,
            "tenure_months": 240,
            "loan_type": "home"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'ai_tips' in data:
                    ai_tips = data.get('ai_tips', '')
                    
                    if ai_tips and len(ai_tips) > 50:
                        # Check if it's fallback or AI-generated
                        is_fallback = "Smart Strategies" in ai_tips or "Tax Benefits" in ai_tips
                        
                        if is_fallback:
                            self.log_test("AI Tips - Generation", True,
                                        f"Fallback tips provided (length: {len(ai_tips)} chars)")
                        else:
                            self.log_test("AI Tips - Generation", True,
                                        f"AI tips generated (length: {len(ai_tips)} chars)")
                        
                        print(f"\n   💡 AI Tips Preview:")
                        print(f"   {ai_tips[:200]}...")
                    else:
                        self.log_test("AI Tips - Generation", False,
                                    f"Tips too short or empty: {ai_tips}")
                else:
                    self.log_test("AI Tips - Generation", False,
                                "ai_tips field not in response")
            else:
                self.log_test("AI Tips - API Call", False,
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("AI Tips - API Call", False, f"Error: {str(e)}")

    def test_education_loan_with_tax_benefits(self):
        """Test Scenario 3: Education Loan with Tax Benefits"""
        print("\n🎓 Test 3: Education Loan with Tax Benefits")
        print("   Principal: ₹10,00,000 | Rate: 9% | Tenure: 84 months (7 years)")
        
        url = f"{self.api_url}/loan-calculator"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        
        payload = {
            "principal": 1000000,
            "annual_interest_rate": 9,
            "tenure_months": 84,
            "loan_type": "education"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify tax benefits for education loan (Section 80E)
                tax_benefits = data.get('tax_benefits')
                if tax_benefits:
                    if tax_benefits.get('eligible'):
                        sections = tax_benefits.get('sections_applicable', [])
                        
                        if '80E' in str(sections):
                            # Education loan should have NO principal deduction, only interest
                            principal_deduction = tax_benefits.get('principal_deduction', 0)
                            interest_deduction = tax_benefits.get('interest_deduction', 0)
                            
                            if principal_deduction == 0 and interest_deduction > 0:
                                self.log_test("Education Loan - Tax Benefits (80E)", True,
                                            f"Section 80E applied correctly - "
                                            f"Interest deduction: ₹{interest_deduction:,.2f} (unlimited), "
                                            f"Principal deduction: ₹{principal_deduction:,.2f} (none), "
                                            f"Total tax saved: ₹{tax_benefits.get('total_tax_saved', 0):,.2f}")
                            else:
                                self.log_test("Education Loan - Tax Benefits (80E)", False,
                                            f"Expected no principal deduction, got: ₹{principal_deduction:,.2f}")
                        else:
                            self.log_test("Education Loan - Tax Benefits (80E)", False,
                                        f"Expected Section 80E, got: {sections}")
                    else:
                        self.log_test("Education Loan - Tax Benefits", False,
                                    "Not marked as eligible")
                else:
                    self.log_test("Education Loan - Tax Benefits", False,
                                "Tax benefits not present")
                
                print(f"\n   📊 Results Summary:")
                print(f"   Monthly EMI: ₹{data.get('monthly_payment', 0):,.2f}")
                print(f"   Total Interest: ₹{data.get('total_interest', 0):,.2f}")
                
            else:
                self.log_test("Education Loan - API Call", False,
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("Education Loan - API Call", False, f"Error: {str(e)}")

    def test_credit_card_debt_high_interest(self):
        """Test Scenario 4: Credit Card Debt (High Interest)"""
        print("\n💳 Test 4: Credit Card Debt (High Interest)")
        print("   Principal: ₹2,00,000 | Rate: 18% | Tenure: 36 months")
        
        url = f"{self.api_url}/loan-calculator"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        
        payload = {
            "principal": 200000,
            "annual_interest_rate": 18,
            "tenure_months": 36,
            "loan_type": "credit_card"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify high interest warning in prepayment scenarios
                prepayment = data.get('prepayment_scenarios', {})
                
                if prepayment:
                    # Check if prepayment shows significant savings (high interest should show high savings)
                    extra_5k = prepayment.get('extra_5k_monthly', {})
                    interest_saved = extra_5k.get('interest_saved', 0)
                    
                    if interest_saved > 10000:  # Should save significant amount with 18% interest
                        self.log_test("Credit Card - High Interest Impact", True,
                                    f"Prepayment shows significant savings: ₹{interest_saved:,.2f}")
                    else:
                        self.log_test("Credit Card - High Interest Impact", False,
                                    f"Expected high savings, got: ₹{interest_saved:,.2f}")
                
                # Verify NO tax benefits for credit card
                tax_benefits = data.get('tax_benefits')
                if tax_benefits is None:
                    self.log_test("Credit Card - No Tax Benefits", True,
                                "Correctly shows no tax benefits for credit card debt")
                else:
                    self.log_test("Credit Card - No Tax Benefits", False,
                                f"Unexpected tax benefits: {tax_benefits}")
                
                print(f"\n   📊 Results Summary:")
                print(f"   Monthly EMI: ₹{data.get('monthly_payment', 0):,.2f}")
                print(f"   Total Interest: ₹{data.get('total_interest', 0):,.2f}")
                print(f"   ⚠️ High interest rate - aggressive payoff recommended")
                
            else:
                self.log_test("Credit Card - API Call", False,
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("Credit Card - API Call", False, f"Error: {str(e)}")

    def test_refinance_calculator(self):
        """Test Scenario 6: Refinance Calculator"""
        print("\n🔄 Test 6: Refinance Calculator")
        print("   Current: ₹20,00,000 at 9% for 180 months")
        print("   New: 8% with ₹50,000 closing costs")
        
        # Use query parameters as the endpoint expects
        url = f"{self.api_url}/loan-calculator/refinance?current_principal=2000000&current_rate=9&remaining_months=180&new_rate=8&closing_costs=50000"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        
        try:
            response = requests.post(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ['current_remaining_payment', 'new_total_payment', 
                                 'closing_costs', 'net_savings', 'breakeven_months', 
                                 'should_refinance', 'monthly_savings']
                
                missing_fields = [f for f in required_fields if f not in data]
                
                if not missing_fields:
                    self.log_test("Refinance - Response Structure", True,
                                "All required fields present")
                    
                    # Verify calculations make sense
                    net_savings = data.get('net_savings', 0)
                    monthly_savings = data.get('monthly_savings', 0)
                    breakeven = data.get('breakeven_months', 0)
                    should_refinance = data.get('should_refinance', False)
                    
                    # With 1% rate reduction, should show savings
                    if monthly_savings > 0:
                        self.log_test("Refinance - Monthly Savings", True,
                                    f"Monthly savings: ₹{monthly_savings:,.2f}")
                    else:
                        self.log_test("Refinance - Monthly Savings", False,
                                    f"Expected positive savings, got: ₹{monthly_savings:,.2f}")
                    
                    # Verify breakeven calculation
                    if breakeven > 0 and breakeven < 180:
                        self.log_test("Refinance - Breakeven Analysis", True,
                                    f"Breakeven in {breakeven} months")
                    else:
                        self.log_test("Refinance - Breakeven Analysis", False,
                                    f"Breakeven seems incorrect: {breakeven} months")
                    
                    # Verify recommendation
                    if net_savings > 0 and should_refinance:
                        self.log_test("Refinance - Recommendation", True,
                                    f"Correctly recommends refinancing (net savings: ₹{net_savings:,.2f})")
                    elif net_savings <= 0 and not should_refinance:
                        self.log_test("Refinance - Recommendation", True,
                                    f"Correctly recommends against refinancing (net savings: ₹{net_savings:,.2f})")
                    else:
                        self.log_test("Refinance - Recommendation", False,
                                    f"Recommendation mismatch - savings: ₹{net_savings:,.2f}, recommend: {should_refinance}")
                    
                    print(f"\n   📊 Refinance Analysis:")
                    print(f"   Current total payment: ₹{data.get('current_remaining_payment', 0):,.2f}")
                    print(f"   New total payment: ₹{data.get('new_total_payment', 0):,.2f}")
                    print(f"   Net savings: ₹{net_savings:,.2f}")
                    print(f"   Monthly savings: ₹{monthly_savings:,.2f}")
                    print(f"   Breakeven: {breakeven} months")
                    recommendation_text = "✅ Refinance" if should_refinance else "❌ Don't refinance"
                    print(f"   Recommendation: {recommendation_text}")
                    
                else:
                    self.log_test("Refinance - Response Structure", False,
                                f"Missing fields: {missing_fields}")
                
            else:
                self.log_test("Refinance - API Call", False,
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("Refinance - API Call", False, f"Error: {str(e)}")

    def test_multi_loan_strategy(self):
        """Test Scenario 7: Multi-Loan Strategy (Optional)"""
        print("\n📊 Test 7: Multi-Loan Strategy (Avalanche vs Snowball)")
        print("   Testing with 3 loans")
        
        # Use query parameter for extra_payment and body for loans
        url = f"{self.api_url}/loan-calculator/multi-loan-strategy?extra_payment=5000"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        
        # Send loans as array in body
        payload = [
            {
                "name": "Credit Card",
                "principal": 100000,
                "annual_interest_rate": 18,
                "monthly_payment": 5000
            },
            {
                "name": "Personal Loan",
                "principal": 300000,
                "annual_interest_rate": 12,
                "monthly_payment": 10000
            },
            {
                "name": "Auto Loan",
                "principal": 500000,
                "annual_interest_rate": 9,
                "monthly_payment": 15000
            }
        ]
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                if 'avalanche' in data and 'snowball' in data:
                    self.log_test("Multi-Loan - Response Structure", True,
                                "Both strategies present")
                    
                    avalanche = data.get('avalanche', {})
                    snowball = data.get('snowball', {})
                    recommended = data.get('recommended', '')
                    
                    # Verify avalanche strategy (should prioritize credit card - highest rate)
                    avalanche_order = avalanche.get('payment_order', [])
                    if avalanche_order and avalanche_order[0].get('name') == 'Credit Card':
                        self.log_test("Multi-Loan - Avalanche Strategy", True,
                                    f"Correctly prioritizes highest interest rate first (Credit Card)")
                    else:
                        self.log_test("Multi-Loan - Avalanche Strategy", False,
                                    f"Expected Credit Card first, got: {avalanche_order[0].get('name') if avalanche_order else 'None'}")
                    
                    # Verify snowball strategy (should prioritize credit card - smallest balance)
                    snowball_order = snowball.get('payment_order', [])
                    if snowball_order and snowball_order[0].get('name') == 'Credit Card':
                        self.log_test("Multi-Loan - Snowball Strategy", True,
                                    f"Correctly prioritizes smallest balance first (Credit Card)")
                    else:
                        self.log_test("Multi-Loan - Snowball Strategy", False,
                                    f"Expected Credit Card first, got: {snowball_order[0].get('name') if snowball_order else 'None'}")
                    
                    # Verify recommendation
                    if recommended in ['avalanche', 'snowball']:
                        self.log_test("Multi-Loan - Recommendation", True,
                                    f"Recommends: {recommended}")
                    else:
                        self.log_test("Multi-Loan - Recommendation", False,
                                    f"Invalid recommendation: {recommended}")
                    
                    print(f"\n   📊 Strategy Comparison:")
                    print(f"   Avalanche - Total Interest: ₹{avalanche.get('total_interest', 0):,.2f}, "
                          f"Payoff: {avalanche.get('payoff_months', 0):.1f} months")
                    print(f"   Snowball - Total Interest: ₹{snowball.get('total_interest', 0):,.2f}, "
                          f"Payoff: {snowball.get('payoff_months', 0):.1f} months")
                    print(f"   Recommended: {recommended.upper()}")
                    
                else:
                    self.log_test("Multi-Loan - Response Structure", False,
                                "Missing avalanche or snowball strategy")
                
            else:
                self.log_test("Multi-Loan - API Call", False,
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("Multi-Loan - API Call", False, f"Error: {str(e)}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failed in self.failed_tests:
                print(f"   - {failed['test']}: {failed['details']}")
        
        print("="*80)

    def run_all_tests(self):
        """Run all loan calculator tests"""
        print("="*80)
        print("🧪 ENHANCED LOAN CALCULATOR API TESTING")
        print("="*80)
        
        # Create test user
        if not self.create_test_user():
            print("❌ Failed to create test user. Exiting.")
            return False
        
        # Run all test scenarios
        self.test_basic_home_loan()
        self.test_ai_tips_generation()
        self.test_education_loan_with_tax_benefits()
        self.test_credit_card_debt_high_interest()
        self.test_refinance_calculator()
        self.test_multi_loan_strategy()
        
        # Print summary
        self.print_summary()
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = LoanCalculatorTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
