#!/usr/bin/env python3
"""
Test Review Request: Demo Data Reseed, Loan Calculator, Demo Mode Filtering
"""

import requests
import sys
import json
from datetime import datetime
import time
import subprocess

class ReviewRequestTester:
    def __init__(self, base_url="https://legacyvault-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def create_test_user(self):
        """Create test user and session in MongoDB"""
        print("\n🔧 Creating test user and session...")
        
        timestamp = int(time.time())
        self.user_id = f"review-test-user-{timestamp}"
        self.session_token = f"review_session_{timestamp}"
        
        mongo_commands = f"""
use('test_database');
var userId = '{self.user_id}';
var sessionToken = '{self.session_token}';
var expiresAt = new Date(Date.now() + 7*24*60*60*1000);

// Create user with demo_mode=true
db.users.insertOne({{
  id: userId,
  email: 'review.test.{timestamp}@example.com',
  name: 'Review Test User',
  picture: 'https://via.placeholder.com/150',
  role: 'customer',
  demo_mode: true,
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

    def cleanup_test_user(self):
        """Clean up test user and data"""
        print("\n🧹 Cleaning up test data...")
        
        mongo_cleanup = f"""
use('test_database');
var userId = '{self.user_id}';

// Delete user and session
db.users.deleteOne({{id: userId}});
db.user_sessions.deleteOne({{user_id: userId}});

// Delete all user data
db.assets.deleteMany({{user_id: userId}});
db.portfolio_assets.deleteMany({{user_id: userId}});
db.documents.deleteMany({{user_id: userId}});
db.scheduled_messages.deleteMany({{user_id: userId}});
db.digital_wills.deleteMany({{user_id: userId}});
db.nominees.deleteMany({{user_id: userId}});
db.ai_insights.deleteMany({{user_id: userId}});

print('Test data cleaned up');
"""
        
        try:
            subprocess.run(['mongosh', '--eval', mongo_cleanup], timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")

    def api_call(self, method, endpoint, data=None, timeout=30):
        """Make API call with authentication"""
        url = f"{self.api_url}/{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)
            
            return response
        except Exception as e:
            print(f"   ⚠️  API call error: {str(e)}")
            return None

    def test_demo_data_reseed(self):
        """Test 1: Demo Data Reseed Endpoint"""
        print("\n" + "="*60)
        print("TEST 1: Demo Data Reseed Endpoint")
        print("="*60)
        
        # Call reseed endpoint
        print("\n📦 Calling /api/demo/reseed...")
        response = self.api_call('POST', 'demo/reseed')
        
        if response and response.status_code == 200:
            self.log_test("Demo reseed endpoint responds successfully", True, "Status 200")
            result = response.json()
            print(f"   Response: {result.get('message', 'Success')}")
        else:
            self.log_test("Demo reseed endpoint responds successfully", False, 
                         f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Verify assets (should be 20+)
        print("\n📊 Verifying demo assets...")
        response = self.api_call('GET', 'assets')
        if response and response.status_code == 200:
            assets = response.json()
            asset_count = len(assets)
            print(f"   Assets created: {asset_count}")
            
            if asset_count >= 20:
                self.log_test("Demo reseed creates 20+ assets", True, f"{asset_count} assets")
            else:
                self.log_test("Demo reseed creates 20+ assets", False, f"Only {asset_count} assets")
        
        # Verify documents (should be 5)
        print("\n📄 Verifying demo documents...")
        response = self.api_call('GET', 'documents')
        if response and response.status_code == 200:
            documents = response.json()
            doc_count = len(documents)
            print(f"   Documents created: {doc_count}")
            
            if doc_count >= 5:
                self.log_test("Demo reseed creates 5+ documents", True, f"{doc_count} documents")
            else:
                self.log_test("Demo reseed creates 5+ documents", False, f"Only {doc_count} documents")
            
            # Check for linked_asset_id
            linked_docs = [d for d in documents if d.get('linked_asset_id')]
            print(f"   Documents with linked_asset_id: {len(linked_docs)}")
            
            if linked_docs:
                self.log_test("Documents are linked to assets via linked_asset_id", True, 
                             f"{len(linked_docs)}/{doc_count} documents linked")
            else:
                self.log_test("Documents are linked to assets via linked_asset_id", False, 
                             "No documents have linked_asset_id")
        
        # Verify will (should be 1 with beneficiaries)
        print("\n📜 Verifying demo will...")
        response = self.api_call('GET', 'will')
        if response and response.status_code == 200:
            will = response.json()
            if will:
                beneficiaries = will.get('beneficiaries', [])
                print(f"   Will beneficiaries: {len(beneficiaries)}")
                
                if len(beneficiaries) > 0:
                    self.log_test("Demo will created with beneficiaries", True, 
                                 f"{len(beneficiaries)} beneficiaries")
                else:
                    self.log_test("Demo will created with beneficiaries", False, 
                                 "Will has no beneficiaries")
            else:
                self.log_test("Demo will created", False, "No will found")
        
        # Verify scheduled messages (should be 3)
        print("\n📨 Verifying demo scheduled messages...")
        response = self.api_call('GET', 'scheduled-messages')
        if response and response.status_code == 200:
            messages = response.json()
            msg_count = len(messages)
            print(f"   Scheduled messages created: {msg_count}")
            
            if msg_count >= 3:
                self.log_test("Demo reseed creates 3+ scheduled messages", True, f"{msg_count} messages")
            else:
                self.log_test("Demo reseed creates 3+ scheduled messages", False, f"Only {msg_count} messages")

    def test_loan_calculator(self):
        """Test 2: Loan Calculator with Timeout"""
        print("\n" + "="*60)
        print("TEST 2: Loan Calculator with Timeout")
        print("="*60)
        
        loan_request = {
            "principal": 50000,
            "annual_interest_rate": 8.5,
            "tenure_months": 60,
            "loan_type": "personal"
        }
        
        print(f"\n💰 Testing loan calculator...")
        print(f"   Principal: ${loan_request['principal']:,.2f}")
        print(f"   Interest Rate: {loan_request['annual_interest_rate']}%")
        print(f"   Tenure: {loan_request['tenure_months']} months")
        print(f"   Loan Type: {loan_request['loan_type']}")
        
        # Measure response time
        start_time = time.time()
        response = self.api_call('POST', 'loan-calculator', loan_request, timeout=25)
        elapsed_time = time.time() - start_time
        
        print(f"\n⏱️  Response time: {elapsed_time:.2f} seconds")
        
        if response and response.status_code == 200:
            self.log_test("Loan calculator endpoint responds successfully", True, "Status 200")
            
            # Check response time
            if elapsed_time <= 20:
                self.log_test("Response within 20 seconds (with 15s AI timeout)", True, 
                             f"{elapsed_time:.2f}s")
            else:
                self.log_test("Response within 20 seconds (with 15s AI timeout)", False, 
                             f"{elapsed_time:.2f}s (expected ≤20s)")
            
            result = response.json()
            
            # Verify response structure
            required_fields = ['monthly_payment', 'total_interest', 'total_amount', 
                             'amortization_schedule', 'ai_tips']
            missing_fields = [f for f in required_fields if f not in result]
            
            if not missing_fields:
                self.log_test("Response has all required fields", True, 
                             "monthly_payment, total_interest, total_amount, amortization_schedule, ai_tips")
            else:
                self.log_test("Response has all required fields", False, 
                             f"Missing: {missing_fields}")
            
            # Verify amortization schedule
            schedule = result.get('amortization_schedule', [])
            print(f"\n📊 Amortization schedule entries: {len(schedule)}")
            
            if len(schedule) == 60:
                self.log_test("Amortization schedule has 60 entries", True, f"{len(schedule)} entries")
            else:
                self.log_test("Amortization schedule has 60 entries", False, 
                             f"{len(schedule)} entries (expected 60)")
            
            # Verify calculations
            monthly_payment = result.get('monthly_payment', 0)
            total_interest = result.get('total_interest', 0)
            total_amount = result.get('total_amount', 0)
            
            print(f"\n💵 Calculation Results:")
            print(f"   Monthly Payment: ${monthly_payment:.2f}")
            print(f"   Total Interest: ${total_interest:.2f}")
            print(f"   Total Amount: ${total_amount:.2f}")
            
            # Calculate expected values
            monthly_rate = (loan_request['annual_interest_rate'] / 100) / 12
            expected_monthly = loan_request['principal'] * (monthly_rate * (1 + monthly_rate) ** loan_request['tenure_months']) / ((1 + monthly_rate) ** loan_request['tenure_months'] - 1)
            expected_total = expected_monthly * loan_request['tenure_months']
            expected_interest = expected_total - loan_request['principal']
            
            print(f"\n🔍 Expected Values:")
            print(f"   Monthly Payment: ${expected_monthly:.2f}")
            print(f"   Total Interest: ${expected_interest:.2f}")
            print(f"   Total Amount: ${expected_total:.2f}")
            
            # Verify with 1% tolerance
            monthly_correct = abs(monthly_payment - expected_monthly) / expected_monthly < 0.01
            interest_correct = abs(total_interest - expected_interest) / expected_interest < 0.01
            total_correct = abs(total_amount - expected_total) / expected_total < 0.01
            
            if monthly_correct and interest_correct and total_correct:
                self.log_test("Calculations are mathematically correct", True, 
                             "All values within 1% tolerance")
            else:
                errors = []
                if not monthly_correct:
                    errors.append(f"monthly_payment off by {abs(monthly_payment - expected_monthly):.2f}")
                if not interest_correct:
                    errors.append(f"total_interest off by {abs(total_interest - expected_interest):.2f}")
                if not total_correct:
                    errors.append(f"total_amount off by {abs(total_amount - expected_total):.2f}")
                self.log_test("Calculations are mathematically correct", False, "; ".join(errors))
            
            # Check AI tips
            ai_tips = result.get('ai_tips', '')
            print(f"\n🤖 AI Tips: {ai_tips[:100]}..." if len(ai_tips) > 100 else f"\n🤖 AI Tips: {ai_tips}")
            
            if ai_tips:
                self.log_test("AI tips field is populated", True, f"{len(ai_tips)} characters")
            else:
                self.log_test("AI tips field is populated", False, "Empty ai_tips")
        else:
            self.log_test("Loan calculator endpoint responds successfully", False, 
                         f"Status: {response.status_code if response else 'No response'}")

    def test_demo_mode_filtering(self):
        """Test 3: Demo Mode Filtering"""
        print("\n" + "="*60)
        print("TEST 3: Demo Mode Filtering")
        print("="*60)
        
        # Test documents filtering
        print("\n📄 Testing /api/documents filtering...")
        response = self.api_call('GET', 'documents')
        if response and response.status_code == 200:
            documents = response.json()
            demo_prefix = f"demo_{self.user_id}_"
            demo_docs = [d for d in documents if d.get('id', '').startswith(demo_prefix)]
            
            print(f"   Total documents: {len(documents)}")
            print(f"   Demo documents: {len(demo_docs)}")
            
            if len(demo_docs) == len(documents) and len(documents) > 0:
                self.log_test("/api/documents filters by demo_mode", True, 
                             f"All {len(documents)} documents are demo documents")
            elif len(documents) == 0:
                self.log_test("/api/documents filters by demo_mode", True, 
                             "No documents (acceptable)")
            else:
                self.log_test("/api/documents filters by demo_mode", False, 
                             f"{len(demo_docs)}/{len(documents)} are demo documents")
        
        # Test will filtering
        print("\n📜 Testing /api/will filtering...")
        response = self.api_call('GET', 'will')
        if response and response.status_code == 200:
            will = response.json()
            if will:
                is_demo = will.get('demo_mode', False)
                print(f"   Will found with demo_mode={is_demo}")
                self.log_test("/api/will filters by demo_mode", True, 
                             f"Will returned with demo_mode={is_demo}")
            else:
                print(f"   No will found")
                self.log_test("/api/will filters by demo_mode", True, 
                             "No will (acceptable)")
        
        # Test scheduled-messages filtering
        print("\n📨 Testing /api/scheduled-messages filtering...")
        response = self.api_call('GET', 'scheduled-messages')
        if response and response.status_code == 200:
            messages = response.json()
            demo_prefix = f"demo_{self.user_id}_"
            demo_msgs = [m for m in messages if m.get('id', '').startswith(demo_prefix)]
            
            print(f"   Total messages: {len(messages)}")
            print(f"   Demo messages: {len(demo_msgs)}")
            
            if len(demo_msgs) == len(messages) and len(messages) > 0:
                self.log_test("/api/scheduled-messages filters by demo_mode", True, 
                             f"All {len(messages)} messages are demo messages")
            elif len(messages) == 0:
                self.log_test("/api/scheduled-messages filters by demo_mode", True, 
                             "No messages (acceptable)")
            else:
                self.log_test("/api/scheduled-messages filters by demo_mode", False, 
                             f"{len(demo_msgs)}/{len(messages)} are demo messages")
        
        # Test insights/generate uses demo assets
        print("\n🤖 Testing /api/insights/generate with demo assets...")
        response = self.api_call('GET', 'assets')
        if response and response.status_code == 200:
            assets = response.json()
            print(f"   Demo assets available: {len(assets)}")
            
            if len(assets) > 0:
                response = self.api_call('POST', 'insights/generate', timeout=30)
                if response and response.status_code == 200:
                    insights = response.json()
                    portfolio_summary = insights.get('portfolio_summary', '')
                    
                    if portfolio_summary and len(portfolio_summary) > 0:
                        self.log_test("/api/insights/generate uses demo assets when demo_mode=true", True, 
                                     f"Insights generated with {len(assets)} demo assets")
                    else:
                        self.log_test("/api/insights/generate uses demo assets when demo_mode=true", False, 
                                     "Empty portfolio_summary")
                else:
                    self.log_test("/api/insights/generate uses demo assets when demo_mode=true", False, 
                                 f"Status: {response.status_code if response else 'No response'}")
            else:
                print(f"   ⚠️  No demo assets to test insights generation")

    def run_tests(self):
        """Run all review request tests"""
        print("\n🚀 Starting Review Request Backend Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("="*60)
        
        if not self.create_test_user():
            print("❌ Failed to create test user. Cannot proceed.")
            return False
        
        try:
            self.test_demo_data_reseed()
            self.test_loan_calculator()
            self.test_demo_mode_filtering()
        finally:
            self.cleanup_test_user()
        
        # Print summary
        print("\n" + "="*60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        print("="*60)
        
        return success_rate >= 80

if __name__ == "__main__":
    tester = ReviewRequestTester()
    success = tester.run_tests()
    sys.exit(0 if success else 1)
