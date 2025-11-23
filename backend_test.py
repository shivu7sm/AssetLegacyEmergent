#!/usr/bin/env python3
"""
Asset Management App Backend API Testing
Tests all backend endpoints for the asset management application
"""

import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import time

class AssetManagementAPITester:
    def __init__(self, base_url="https://estate-track-2.preview.emergentagent.com"):
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
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

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
        self.user_id = f"test-user-{timestamp}"
        self.session_token = f"test_session_{timestamp}"
        
        # MongoDB commands to create test user and session
        mongo_commands = f"""
use('test_database');
var userId = '{self.user_id}';
var sessionToken = '{self.session_token}';
var expiresAt = new Date(Date.now() + 7*24*60*60*1000);

// Create user
db.users.insertOne({{
  id: userId,
  email: 'test.user.{timestamp}@example.com',
  name: 'Test User {timestamp}',
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

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test /auth/me with valid token
        user_data = self.run_test(
            "Get current user (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        
        if user_data:
            print(f"   User: {user_data.get('name')} ({user_data.get('email')})")

        # Test /auth/me without token (should fail)
        old_token = self.session_token
        self.session_token = None
        self.run_test(
            "Get user without auth (should fail)",
            "GET", 
            "auth/me",
            401
        )
        self.session_token = old_token

    def test_asset_endpoints(self):
        """Test asset management endpoints"""
        print("\n💰 Testing Asset Endpoints...")
        
        # Get assets (initially empty)
        assets = self.run_test(
            "Get assets list",
            "GET",
            "assets",
            200
        )
        
        # Create a test asset
        test_asset = {
            "type": "bank",
            "name": "Test Bank Account",
            "purchase_price": 10000.50,
            "purchase_currency": "USD",
            "purchase_date": "2024-01-01",
            "details": {"account_number": "1234"}
        }
        
        created_asset = self.run_test(
            "Create new asset",
            "POST",
            "assets",
            200,
            test_asset
        )
        
        asset_id = None
        if created_asset:
            asset_id = created_asset.get('id')
            print(f"   Created asset ID: {asset_id}")
        
        # Update the asset
        if asset_id:
            updated_asset = {
                **test_asset,
                "name": "Updated Test Bank Account",
                "purchase_price": 15000.75
            }
            
            self.run_test(
                "Update asset",
                "PUT",
                f"assets/{asset_id}",
                200,
                updated_asset
            )
        
        # Get assets again (should have 1)
        self.run_test(
            "Get assets after creation",
            "GET",
            "assets",
            200
        )
        
        # Delete the asset
        if asset_id:
            self.run_test(
                "Delete asset",
                "DELETE",
                f"assets/{asset_id}",
                200
            )

    def test_nominee_endpoints(self):
        """Test nominee management endpoints"""
        print("\n👥 Testing Nominee Endpoints...")
        
        # Get nominee (initially none)
        self.run_test(
            "Get nominee (initially empty)",
            "GET",
            "nominee",
            200
        )
        
        # Create nominee
        nominee_data = {
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "phone": "+1234567890",
            "relationship": "Spouse"
        }
        
        created_nominee = self.run_test(
            "Create nominee",
            "POST",
            "nominee",
            200,
            nominee_data
        )
        
        # Update nominee
        updated_nominee = {
            **nominee_data,
            "name": "Jane Smith",
            "relationship": "Wife"
        }
        
        self.run_test(
            "Update nominee",
            "POST",
            "nominee",
            200,
            updated_nominee
        )

    def test_dms_endpoints(self):
        """Test dead man switch endpoints"""
        print("\n⏰ Testing Dead Man Switch Endpoints...")
        
        # Get DMS (initially none)
        self.run_test(
            "Get DMS config (initially empty)",
            "GET",
            "dms",
            200
        )
        
        # Create DMS configuration
        dms_config = {
            "inactivity_days": 90,
            "reminder_1_days": 60,
            "reminder_2_days": 75,
            "reminder_3_days": 85
        }
        
        created_dms = self.run_test(
            "Create DMS configuration",
            "POST",
            "dms",
            200,
            dms_config
        )
        
        # Reset DMS timer
        self.run_test(
            "Reset DMS timer",
            "POST",
            "dms/reset",
            200
        )
        
        # Update DMS configuration
        updated_dms = {
            **dms_config,
            "inactivity_days": 120,
            "reminder_1_days": 80
        }
        
        self.run_test(
            "Update DMS configuration",
            "POST",
            "dms",
            200,
            updated_dms
        )

    def test_dashboard_endpoints(self):
        """Test dashboard endpoints"""
        print("\n📊 Testing Dashboard Endpoints...")
        
        # Create a test asset first for meaningful dashboard data
        test_asset = {
            "type": "crypto",
            "name": "Bitcoin Holdings",
            "purchase_price": 50000,
            "purchase_currency": "USD",
            "details": {"symbol": "BTC"}
        }
        
        self.run_test(
            "Create asset for dashboard test",
            "POST",
            "assets",
            200,
            test_asset
        )
        
        # Get dashboard summary
        summary = self.run_test(
            "Get dashboard summary",
            "GET",
            "dashboard/summary",
            200
        )
        
        if summary:
            print(f"   Total assets: {summary.get('total_assets', 0)}")
            print(f"   Total value: ${summary.get('total_value_usd', 0)}")
            print(f"   Has nominee: {summary.get('has_nominee', False)}")
            print(f"   Has DMS: {summary.get('has_dms', False)}")

    def test_phase1_asset_liability_calculation(self):
        """Test Phase 1: Asset vs Liability Calculation"""
        print("\n🏦 Testing Phase 1: Asset vs Liability Calculation...")
        
        # Clean up any existing assets first
        existing_assets = self.run_test(
            "Get existing assets for cleanup",
            "GET",
            "assets",
            200
        )
        
        if existing_assets:
            for asset in existing_assets:
                asset_id = asset.get('id')
                if asset_id:
                    self.run_test(
                        f"Delete existing asset {asset_id}",
                        "DELETE",
                        f"assets/{asset_id}",
                        200
                    )
        
        # Create test assets (positive values)
        test_assets = [
            {
                "type": "property",
                "name": "Family Home",
                "area": 2000,
                "area_unit": "sqft",
                "price_per_area": 150,
                "current_price_per_area": 180,
                "purchase_currency": "USD",
                "location": {"address": "123 Main St", "lat": 40.7128, "lng": -74.0060}
            },
            {
                "type": "crypto",
                "name": "Bitcoin Investment",
                "quantity": 0.5,
                "unit_price": 45000,
                "current_unit_price": 52000,
                "symbol": "BTC",
                "purchase_currency": "USD"
            },
            {
                "type": "stock",
                "name": "Apple Stock",
                "quantity": 100,
                "unit_price": 150,
                "current_unit_price": 175,
                "symbol": "AAPL",
                "purchase_currency": "USD"
            },
            {
                "type": "bank",
                "name": "Savings Account",
                "total_value": 25000,
                "current_total_value": 25500,
                "purchase_currency": "USD"
            }
        ]
        
        # Create test liabilities (should be counted separately)
        test_liabilities = [
            {
                "type": "loan",
                "name": "Home Mortgage",
                "principal_amount": 200000,
                "outstanding_balance": 180000,
                "interest_rate": 3.5,
                "tenure_months": 240,
                "emi_amount": 1200,
                "purchase_currency": "USD"
            },
            {
                "type": "credit_card",
                "name": "Credit Card Debt",
                "outstanding_balance": 5000,
                "interest_rate": 18.5,
                "purchase_currency": "USD"
            }
        ]
        
        created_asset_ids = []
        created_liability_ids = []
        
        # Create assets
        for asset in test_assets:
            created_asset = self.run_test(
                f"Create {asset['type']} asset: {asset['name']}",
                "POST",
                "assets",
                200,
                asset
            )
            if created_asset:
                created_asset_ids.append(created_asset.get('id'))
        
        # Create liabilities
        for liability in test_liabilities:
            created_liability = self.run_test(
                f"Create {liability['type']} liability: {liability['name']}",
                "POST",
                "assets",
                200,
                liability
            )
            if created_liability:
                created_liability_ids.append(created_liability.get('id'))
        
        # Test dashboard summary with mixed assets and liabilities
        summary = self.run_test(
            "Get dashboard summary with assets and liabilities",
            "GET",
            "dashboard/summary",
            200
        )
        
        if summary:
            print(f"   📊 Dashboard Summary Results:")
            print(f"   Total Assets Count: {summary.get('total_assets', 0)}")
            print(f"   Total Assets Value: ${summary.get('total_assets_value', 0)}")
            print(f"   Total Liabilities Value: ${summary.get('total_liabilities_value', 0)}")
            print(f"   Net Worth: ${summary.get('net_worth', 0)}")
            
            # Verify required fields exist
            required_fields = [
                'total_assets_value', 'total_liabilities_value', 'net_worth',
                'asset_values_separate', 'liability_values_separate'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in summary:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_test(
                    "Dashboard summary has all required Phase 1 fields",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            else:
                self.log_test(
                    "Dashboard summary has all required Phase 1 fields",
                    True,
                    "All Phase 1 fields present"
                )
            
            # Verify calculations
            asset_values_separate = summary.get('asset_values_separate', {})
            liability_values_separate = summary.get('liability_values_separate', {})
            
            print(f"   Asset Values by Type: {asset_values_separate}")
            print(f"   Liability Values by Type: {liability_values_separate}")
            
            # Calculate expected values
            expected_property_value = 2000 * 180  # area * current_price_per_area
            expected_crypto_value = 0.5 * 52000   # quantity * current_unit_price
            expected_stock_value = 100 * 175      # quantity * current_unit_price
            expected_bank_value = 25500           # current_total_value
            expected_total_assets = expected_property_value + expected_crypto_value + expected_stock_value + expected_bank_value
            
            expected_loan_value = 180000          # outstanding_balance
            expected_credit_card_value = 5000     # outstanding_balance
            expected_total_liabilities = expected_loan_value + expected_credit_card_value
            
            expected_net_worth = expected_total_assets - expected_total_liabilities
            
            print(f"   Expected Total Assets: ${expected_total_assets}")
            print(f"   Expected Total Liabilities: ${expected_total_liabilities}")
            print(f"   Expected Net Worth: ${expected_net_worth}")
            
            # Verify calculations (with some tolerance for rounding)
            actual_assets = summary.get('total_assets_value', 0)
            actual_liabilities = summary.get('total_liabilities_value', 0)
            actual_net_worth = summary.get('net_worth', 0)
            
            assets_correct = abs(actual_assets - expected_total_assets) < 1
            liabilities_correct = abs(actual_liabilities - expected_total_liabilities) < 1
            net_worth_correct = abs(actual_net_worth - expected_net_worth) < 1
            
            self.log_test(
                "Asset calculation accuracy",
                assets_correct,
                f"Expected: ${expected_total_assets}, Actual: ${actual_assets}"
            )
            
            self.log_test(
                "Liability calculation accuracy", 
                liabilities_correct,
                f"Expected: ${expected_total_liabilities}, Actual: ${actual_liabilities}"
            )
            
            self.log_test(
                "Net worth calculation accuracy",
                net_worth_correct,
                f"Expected: ${expected_net_worth}, Actual: ${actual_net_worth}"
            )
        
        # Clean up created test data
        for asset_id in created_asset_ids + created_liability_ids:
            if asset_id:
                self.run_test(
                    f"Cleanup test asset/liability {asset_id}",
                    "DELETE",
                    f"assets/{asset_id}",
                    200
                )

    def test_real_estate_extended_fields(self):
        """Test Real Estate with Extended Fields"""
        print("\n🏠 Testing Real Estate Extended Fields...")
        
        # Test real estate asset with current_price_per_area
        real_estate_asset = {
            "type": "property",
            "name": "Investment Property",
            "area": 1500,
            "area_unit": "sqft",
            "price_per_area": 200,
            "current_price_per_area": 250,
            "purchase_currency": "USD",
            "location": {
                "address": "456 Investment Ave",
                "lat": 40.7589,
                "lng": -73.9851
            }
        }
        
        created_property = self.run_test(
            "Create real estate with current_price_per_area",
            "POST",
            "assets",
            200,
            real_estate_asset
        )
        
        property_id = None
        if created_property:
            property_id = created_property.get('id')
            print(f"   Created property ID: {property_id}")
            
            # Verify the property has the new fields
            if 'current_price_per_area' in created_property:
                self.log_test(
                    "Real estate has current_price_per_area field",
                    True,
                    f"Value: ${created_property['current_price_per_area']}"
                )
            else:
                self.log_test(
                    "Real estate has current_price_per_area field",
                    False,
                    "Field missing from response"
                )
        
        # Test dashboard calculation uses current_price_per_area
        summary = self.run_test(
            "Get dashboard summary for real estate calculation test",
            "GET",
            "dashboard/summary",
            200
        )
        
        if summary and property_id:
            asset_values = summary.get('asset_values_separate', {})
            property_value = asset_values.get('property', 0)
            expected_value = 1500 * 250  # area * current_price_per_area
            
            calculation_correct = abs(property_value - expected_value) < 1
            self.log_test(
                "Dashboard uses current_price_per_area for calculation",
                calculation_correct,
                f"Expected: ${expected_value}, Actual: ${property_value}"
            )
        
        # Update property to test field updates
        if property_id:
            updated_property = {
                **real_estate_asset,
                "current_price_per_area": 275,
                "name": "Updated Investment Property"
            }
            
            self.run_test(
                "Update real estate current_price_per_area",
                "PUT",
                f"assets/{property_id}",
                200,
                updated_property
            )
        
        # Clean up
        if property_id:
            self.run_test(
                "Cleanup real estate test asset",
                "DELETE",
                f"assets/{property_id}",
                200
            )

    def test_price_endpoints(self):
        """Test price API endpoints"""
        print("\n💹 Testing Price API Endpoints...")
        
        # Test crypto price (Bitcoin)
        self.run_test(
            "Get Bitcoin price",
            "GET",
            "prices/crypto/bitcoin?currency=usd",
            200
        )
        
        # Test gold price
        self.run_test(
            "Get gold price",
            "GET",
            "prices/gold?currency=USD",
            200
        )
        
        # Test currency conversion
        self.run_test(
            "Get USD to EUR conversion",
            "GET",
            "prices/currency/USD/EUR",
            200
        )

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        if not self.user_id:
            return
            
        mongo_cleanup = f"""
use('test_database');
db.users.deleteOne({{id: '{self.user_id}'}});
db.user_sessions.deleteOne({{user_id: '{self.user_id}'}});
db.assets.deleteMany({{user_id: '{self.user_id}'}});
db.nominees.deleteMany({{user_id: '{self.user_id}'}});
db.dead_man_switches.deleteMany({{user_id: '{self.user_id}'}});
print('Test data cleaned up');
"""
        
        try:
            import subprocess
            subprocess.run(['mongosh', '--eval', mongo_cleanup], timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Asset Management Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Create test user and session
        if not self.create_test_user():
            print("❌ Failed to create test user. Cannot proceed with tests.")
            return False
        
        try:
            # Run all test suites
            self.test_auth_endpoints()
            self.test_asset_endpoints()
            self.test_nominee_endpoints()
            self.test_dms_endpoints()
            self.test_dashboard_endpoints()
            
            # Phase 1 specific tests
            self.test_phase1_asset_liability_calculation()
            self.test_real_estate_extended_fields()
            
            self.test_price_endpoints()
            
        finally:
            # Always cleanup
            self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate < 80:
            print("⚠️  Warning: Low success rate detected")
        
        return success_rate >= 80

def main():
    """Main test execution"""
    tester = AssetManagementAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save test results
        results = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "test_details": tester.test_results
        }
        
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())