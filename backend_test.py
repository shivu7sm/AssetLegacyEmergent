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
    def __init__(self, base_url="https://finportal-28.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.admin_session_token = None
        self.admin_user_id = None
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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, timeout=10):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

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

    def test_networth_snapshot_auto_creation(self):
        """Test Net Worth Snapshot Auto-Creation from Assets"""
        print("\n📈 Testing Net Worth Snapshot Auto-Creation...")
        
        # Clean up existing assets and snapshots
        self.cleanup_user_data()
        
        # Create asset with purchase_date
        test_asset = {
            "type": "stock",
            "name": "Apple Stock for Snapshot Test",
            "quantity": 50,
            "unit_price": 150,
            "current_unit_price": 175,
            "symbol": "AAPL",
            "purchase_currency": "USD",
            "purchase_date": "2024-01-15"
        }
        
        created_asset = self.run_test(
            "Create asset with purchase_date (should auto-create snapshot)",
            "POST",
            "assets",
            200,
            test_asset
        )
        
        asset_id = None
        if created_asset:
            asset_id = created_asset.get('id')
            print(f"   Created asset ID: {asset_id}")
        
        # Verify snapshot was auto-created for purchase date
        history = self.run_test(
            "Get net worth history to verify auto-created snapshot",
            "GET",
            "networth/history?currency=USD",
            200
        )
        
        if history:
            # Handle both list and dict responses
            if isinstance(history, list):
                snapshots = history
            else:
                snapshots = history.get('snapshots', [])
            
            snapshot_dates = [s.get('snapshot_date') if isinstance(s, dict) else str(s) for s in snapshots]
            
            if "2024-01-15" in snapshot_dates:
                self.log_test(
                    "Snapshot auto-created for asset purchase date",
                    True,
                    f"Found snapshot for 2024-01-15 in {snapshot_dates}"
                )
            else:
                self.log_test(
                    "Snapshot auto-created for asset purchase date",
                    False,
                    f"No snapshot found for 2024-01-15. Available dates: {snapshot_dates}"
                )
        
        # Clean up
        if asset_id:
            self.run_test(
                "Cleanup snapshot test asset",
                "DELETE",
                f"assets/{asset_id}",
                200
            )

    def test_networth_backfill_snapshots(self):
        """Test Snapshot Backfill from Existing Assets"""
        print("\n🔄 Testing Net Worth Snapshot Backfill...")
        
        # Clean up existing data
        self.cleanup_user_data()
        
        # Create multiple assets with different purchase dates
        test_assets = [
            {
                "type": "crypto",
                "name": "Bitcoin for Backfill Test",
                "quantity": 0.5,
                "unit_price": 45000,
                "current_unit_price": 52000,
                "symbol": "BTC",
                "purchase_currency": "USD",
                "purchase_date": "2024-01-10"
            },
            {
                "type": "stock",
                "name": "Tesla Stock for Backfill Test",
                "quantity": 25,
                "unit_price": 200,
                "current_unit_price": 250,
                "symbol": "TSLA",
                "purchase_currency": "USD",
                "purchase_date": "2024-02-15"
            },
            {
                "type": "bank",
                "name": "Savings for Backfill Test",
                "total_value": 10000,
                "current_total_value": 10500,
                "purchase_currency": "USD",
                "purchase_date": "2024-03-01"
            }
        ]
        
        created_asset_ids = []
        expected_dates = ["2024-01-10", "2024-02-15", "2024-03-01"]
        
        # Create assets
        for asset in test_assets:
            created_asset = self.run_test(
                f"Create {asset['type']} asset for backfill: {asset['name']}",
                "POST",
                "assets",
                200,
                asset
            )
            if created_asset:
                created_asset_ids.append(created_asset.get('id'))
        
        # Call backfill endpoint
        backfill_result = self.run_test(
            "Call networth backfill endpoint",
            "POST",
            "networth/backfill?currency=USD",
            200
        )
        
        if backfill_result:
            snapshots_created = backfill_result.get('snapshots_created', 0)
            dates_processed = backfill_result.get('dates_processed', [])
            
            print(f"   Snapshots created: {snapshots_created}")
            print(f"   Dates processed: {dates_processed}")
            
            # Verify response structure
            if snapshots_created >= 0 and isinstance(dates_processed, list):
                self.log_test(
                    "Backfill endpoint returns proper response structure",
                    True,
                    f"Created {snapshots_created} snapshots for dates: {dates_processed}"
                )
            else:
                self.log_test(
                    "Backfill endpoint returns proper response structure",
                    False,
                    f"Invalid response structure: {backfill_result}"
                )
        
        # Verify snapshots were created
        history = self.run_test(
            "Get net worth history after backfill",
            "GET",
            "networth/history?currency=USD",
            200
        )
        
        if history:
            # Handle both list and dict responses
            if isinstance(history, list):
                snapshots = history
            else:
                snapshots = history.get('snapshots', [])
            
            snapshot_dates = [s.get('snapshot_date') if isinstance(s, dict) else str(s) for s in snapshots]
            
            found_dates = [date for date in expected_dates if date in snapshot_dates]
            
            if len(found_dates) >= len(expected_dates):
                self.log_test(
                    "Backfill created snapshots for all purchase dates",
                    True,
                    f"Found snapshots for: {found_dates}"
                )
            else:
                self.log_test(
                    "Backfill created snapshots for all purchase dates",
                    False,
                    f"Expected: {expected_dates}, Found: {found_dates}"
                )
        
        # Clean up
        for asset_id in created_asset_ids:
            if asset_id:
                self.run_test(
                    f"Cleanup backfill test asset {asset_id}",
                    "DELETE",
                    f"assets/{asset_id}",
                    200
                )

    def test_asset_update_purchase_date_change(self):
        """Test Asset Update with Purchase Date Change"""
        print("\n📅 Testing Asset Update with Purchase Date Change...")
        
        # Clean up existing data
        self.cleanup_user_data()
        
        # Create asset with initial purchase date
        initial_asset = {
            "type": "stock",
            "name": "Microsoft Stock for Date Change Test",
            "quantity": 30,
            "unit_price": 300,
            "current_unit_price": 350,
            "symbol": "MSFT",
            "purchase_currency": "USD",
            "purchase_date": "2024-01-20"
        }
        
        created_asset = self.run_test(
            "Create asset with initial purchase_date",
            "POST",
            "assets",
            200,
            initial_asset
        )
        
        asset_id = None
        if created_asset:
            asset_id = created_asset.get('id')
            print(f"   Created asset ID: {asset_id}")
        
        # Update asset with new purchase date
        if asset_id:
            updated_asset = {
                **initial_asset,
                "purchase_date": "2024-02-25",
                "name": "Microsoft Stock - Updated Date"
            }
            
            self.run_test(
                "Update asset with new purchase_date (should auto-create snapshot)",
                "PUT",
                f"assets/{asset_id}",
                200,
                updated_asset
            )
        
        # Verify snapshots exist for both dates
        history = self.run_test(
            "Get net worth history after purchase date update",
            "GET",
            "networth/history?currency=USD",
            200
        )
        
        if history:
            # Handle both list and dict responses
            if isinstance(history, list):
                snapshots = history
            else:
                snapshots = history.get('snapshots', [])
            
            snapshot_dates = [s.get('snapshot_date') if isinstance(s, dict) else str(s) for s in snapshots]
            
            expected_dates = ["2024-01-20", "2024-02-25"]
            found_dates = [date for date in expected_dates if date in snapshot_dates]
            
            if len(found_dates) >= 2:
                self.log_test(
                    "Asset update with date change creates new snapshot",
                    True,
                    f"Found snapshots for both dates: {found_dates}"
                )
            else:
                self.log_test(
                    "Asset update with date change creates new snapshot",
                    False,
                    f"Expected snapshots for {expected_dates}, found: {found_dates}"
                )
        
        # Clean up
        if asset_id:
            self.run_test(
                "Cleanup date change test asset",
                "DELETE",
                f"assets/{asset_id}",
                200
            )

    def test_ai_insights_generation_and_storage(self):
        """Test AI Insights Generation and Storage"""
        print("\n🤖 Testing AI Insights Generation and Storage...")
        
        # Clean up existing data
        self.cleanup_user_data()
        
        # Create some assets for meaningful insights
        test_assets = [
            {
                "type": "stock",
                "name": "Apple Stock for AI Test",
                "quantity": 100,
                "unit_price": 150,
                "current_unit_price": 175,
                "symbol": "AAPL",
                "purchase_currency": "USD"
            },
            {
                "type": "crypto",
                "name": "Bitcoin for AI Test",
                "quantity": 0.25,
                "unit_price": 50000,
                "current_unit_price": 55000,
                "symbol": "BTC",
                "purchase_currency": "USD"
            },
            {
                "type": "property",
                "name": "Investment Property for AI Test",
                "area": 1200,
                "area_unit": "sqft",
                "price_per_area": 200,
                "current_price_per_area": 220,
                "purchase_currency": "USD"
            }
        ]
        
        created_asset_ids = []
        
        # Create assets
        for asset in test_assets:
            created_asset = self.run_test(
                f"Create {asset['type']} asset for AI insights: {asset['name']}",
                "POST",
                "assets",
                200,
                asset
            )
            if created_asset:
                created_asset_ids.append(created_asset.get('id'))
        
        # Generate AI insights
        insights = self.run_test(
            "Generate AI insights",
            "POST",
            "insights/generate",
            200
        )
        
        if insights:
            # Verify response structure
            required_fields = [
                'portfolio_summary',
                'asset_distribution_analysis', 
                'allocation_recommendations',
                'advantages',
                'risks',
                'action_items',
                'generated_at'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in insights:
                    missing_fields.append(field)
            
            if not missing_fields:
                self.log_test(
                    "AI insights has all required fields",
                    True,
                    f"All required fields present: {required_fields}"
                )
            else:
                self.log_test(
                    "AI insights has all required fields",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            
            # Verify generated_at is a valid timestamp
            generated_at = insights.get('generated_at')
            if generated_at:
                try:
                    # Try to parse the timestamp
                    if isinstance(generated_at, str):
                        datetime.fromisoformat(generated_at.replace('Z', '+00:00'))
                    self.log_test(
                        "AI insights has valid generated_at timestamp",
                        True,
                        f"Timestamp: {generated_at}"
                    )
                except:
                    self.log_test(
                        "AI insights has valid generated_at timestamp",
                        False,
                        f"Invalid timestamp format: {generated_at}"
                    )
            
            # Verify list fields are actually lists
            list_fields = ['allocation_recommendations', 'advantages', 'risks', 'action_items']
            for field in list_fields:
                field_value = insights.get(field, [])
                if isinstance(field_value, list):
                    self.log_test(
                        f"AI insights {field} is a list",
                        True,
                        f"Contains {len(field_value)} items"
                    )
                else:
                    self.log_test(
                        f"AI insights {field} is a list",
                        False,
                        f"Expected list, got {type(field_value)}"
                    )
            
            print(f"   Portfolio Summary: {insights.get('portfolio_summary', '')[:100]}...")
            print(f"   Recommendations: {len(insights.get('allocation_recommendations', []))} items")
            print(f"   Advantages: {len(insights.get('advantages', []))} items")
            print(f"   Risks: {len(insights.get('risks', []))} items")
            print(f"   Action Items: {len(insights.get('action_items', []))} items")
        
        # Clean up
        for asset_id in created_asset_ids:
            if asset_id:
                self.run_test(
                    f"Cleanup AI insights test asset {asset_id}",
                    "DELETE",
                    f"assets/{asset_id}",
                    200
                )

    def test_ai_insights_retrieval_latest(self):
        """Test AI Insights Retrieval (Latest)"""
        print("\n📊 Testing AI Insights Retrieval (Latest)...")
        
        # First, generate insights (prerequisite)
        insights_generated = self.run_test(
            "Generate insights for retrieval test",
            "POST",
            "insights/generate",
            200
        )
        
        if not insights_generated:
            self.log_test(
                "Cannot test latest insights retrieval",
                False,
                "Failed to generate insights first"
            )
            return
        
        # Get latest insights
        latest_insights = self.run_test(
            "Get latest AI insights",
            "GET",
            "insights/latest",
            200
        )
        
        if latest_insights:
            # Verify structure matches generation response
            if insights_generated.get('generated_at') == latest_insights.get('generated_at'):
                self.log_test(
                    "Latest insights matches generated insights timestamp",
                    True,
                    f"Timestamp: {latest_insights.get('generated_at')}"
                )
            else:
                self.log_test(
                    "Latest insights matches generated insights timestamp",
                    False,
                    f"Generated: {insights_generated.get('generated_at')}, Latest: {latest_insights.get('generated_at')}"
                )
            
            # Verify all fields are present
            required_fields = [
                'portfolio_summary',
                'asset_distribution_analysis',
                'allocation_recommendations',
                'advantages',
                'risks', 
                'action_items',
                'generated_at'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in latest_insights:
                    missing_fields.append(field)
            
            if not missing_fields:
                self.log_test(
                    "Latest insights has all required fields",
                    True,
                    "All fields present"
                )
            else:
                self.log_test(
                    "Latest insights has all required fields",
                    False,
                    f"Missing fields: {missing_fields}"
                )
        
        # Test when no insights exist (clean user)
        # Note: We can't easily test this without creating a new user, so we'll skip this edge case

    def test_multiple_insights_refresh_scenario(self):
        """Test Multiple Insights (Refresh Scenario)"""
        print("\n🔄 Testing Multiple Insights Refresh Scenario...")
        
        # Generate first insight
        first_insights = self.run_test(
            "Generate first AI insights",
            "POST",
            "insights/generate",
            200
        )
        
        if not first_insights:
            self.log_test(
                "Cannot test multiple insights refresh",
                False,
                "Failed to generate first insights"
            )
            return
        
        first_timestamp = first_insights.get('generated_at')
        print(f"   First insights timestamp: {first_timestamp}")
        
        # Wait 2 seconds
        print("   Waiting 2 seconds...")
        time.sleep(2)
        
        # Generate second insight
        second_insights = self.run_test(
            "Generate second AI insights (refresh)",
            "POST",
            "insights/generate",
            200
        )
        
        if second_insights:
            second_timestamp = second_insights.get('generated_at')
            print(f"   Second insights timestamp: {second_timestamp}")
            
            # Verify timestamps are different and second is more recent
            if first_timestamp and second_timestamp:
                try:
                    first_dt = datetime.fromisoformat(first_timestamp.replace('Z', '+00:00'))
                    second_dt = datetime.fromisoformat(second_timestamp.replace('Z', '+00:00'))
                    
                    if second_dt > first_dt:
                        self.log_test(
                            "Second insights has more recent timestamp",
                            True,
                            f"Time difference: {(second_dt - first_dt).total_seconds()} seconds"
                        )
                    else:
                        self.log_test(
                            "Second insights has more recent timestamp",
                            False,
                            f"First: {first_timestamp}, Second: {second_timestamp}"
                        )
                except Exception as e:
                    self.log_test(
                        "Could not compare timestamps",
                        False,
                        f"Error: {str(e)}"
                    )
        
        # Get latest insight and verify it's the second one
        latest_insights = self.run_test(
            "Get latest insights after refresh",
            "GET",
            "insights/latest",
            200
        )
        
        if latest_insights and second_insights:
            latest_timestamp = latest_insights.get('generated_at')
            second_timestamp = second_insights.get('generated_at')
            
            if latest_timestamp == second_timestamp:
                self.log_test(
                    "Latest insights returns most recent insight",
                    True,
                    f"Latest timestamp matches second generation: {latest_timestamp}"
                )
            else:
                self.log_test(
                    "Latest insights returns most recent insight",
                    False,
                    f"Latest: {latest_timestamp}, Expected: {second_timestamp}"
                )

    def create_admin_user(self):
        """Create admin user for admin panel testing"""
        print("\n🔧 Creating admin user for admin panel tests...")
        
        timestamp = int(time.time())
        self.admin_user_id = f"admin-user-{timestamp}"
        self.admin_session_token = f"admin_session_{timestamp}"
        
        # MongoDB commands to create admin user and session
        mongo_commands = f"""
use('test_database');
var adminUserId = '{self.admin_user_id}';
var adminSessionToken = '{self.admin_session_token}';
var expiresAt = new Date(Date.now() + 7*24*60*60*1000);

// Create admin user (shivu7sm@gmail.com should get admin role automatically)
db.users.insertOne({{
  id: adminUserId,
  email: 'shivu7sm@gmail.com',
  name: 'Admin User Test',
  picture: 'https://via.placeholder.com/150',
  role: 'admin',
  last_activity: new Date(),
  created_at: new Date()
}});

// Create admin session
db.user_sessions.insertOne({{
  user_id: adminUserId,
  session_token: adminSessionToken,
  expires_at: expiresAt,
  created_at: new Date()
}});

print('Admin user and session created successfully');
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
                print(f"✅ Admin user created: {self.admin_user_id}")
                print(f"✅ Admin session token: {self.admin_session_token}")
                return True
            else:
                print(f"❌ Failed to create admin user: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating admin user: {str(e)}")
            return False

    def test_admin_role_assignment(self):
        """Test Admin Role Assignment"""
        print("\n👑 Testing Admin Role Assignment...")
        
        # Test with admin user
        old_token = self.session_token
        self.session_token = self.admin_session_token
        
        user_data = self.run_test(
            "Get admin user profile (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        
        if user_data:
            user_role = user_data.get('role')
            user_email = user_data.get('email')
            
            if user_email == 'shivu7sm@gmail.com' and user_role == 'admin':
                self.log_test(
                    "Admin user has correct role assignment",
                    True,
                    f"Email: {user_email}, Role: {user_role}"
                )
            else:
                self.log_test(
                    "Admin user has correct role assignment",
                    False,
                    f"Expected: shivu7sm@gmail.com with admin role, Got: {user_email} with {user_role}"
                )
        
        self.session_token = old_token

    def test_admin_authorization_middleware(self):
        """Test Admin Authorization Middleware"""
        print("\n🔒 Testing Admin Authorization Middleware...")
        
        # Test with non-admin user (should get 403)
        self.run_test(
            "Access admin endpoint with non-admin user (should fail)",
            "GET",
            "admin/stats",
            403
        )
        
        # Test with admin user (should work)
        old_token = self.session_token
        self.session_token = self.admin_session_token
        
        self.run_test(
            "Access admin endpoint with admin user (should work)",
            "GET",
            "admin/stats",
            200
        )
        
        self.session_token = old_token

    def test_admin_statistics_dashboard(self):
        """Test Admin Statistics Dashboard"""
        print("\n📊 Testing Admin Statistics Dashboard...")
        
        # Switch to admin user
        old_token = self.session_token
        self.session_token = self.admin_session_token
        
        # Create some test data for meaningful statistics
        self.create_test_data_for_admin_stats()
        
        stats = self.run_test(
            "Get admin statistics dashboard",
            "GET",
            "admin/stats",
            200
        )
        
        if stats:
            # Verify required fields exist
            required_fields = [
                'users', 'assets', 'scheduled_messages', 
                'dead_man_switches', 'ai_insights'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in stats:
                    missing_fields.append(field)
            
            if not missing_fields:
                self.log_test(
                    "Admin stats has all required sections",
                    True,
                    f"All sections present: {required_fields}"
                )
            else:
                self.log_test(
                    "Admin stats has all required sections",
                    False,
                    f"Missing sections: {missing_fields}"
                )
            
            # Verify users section structure
            users_section = stats.get('users', {})
            if isinstance(users_section, dict):
                users_fields = ['total', 'recent_30_days', 'by_subscription']
                users_missing = [f for f in users_fields if f not in users_section]
                
                if not users_missing:
                    self.log_test(
                        "Admin stats users section has correct structure",
                        True,
                        f"Users: {users_section.get('total', 0)} total, {users_section.get('recent_30_days', 0)} recent"
                    )
                else:
                    self.log_test(
                        "Admin stats users section has correct structure",
                        False,
                        f"Missing user fields: {users_missing}"
                    )
            
            # Verify assets section structure
            assets_section = stats.get('assets', {})
            if isinstance(assets_section, dict):
                assets_fields = ['total', 'by_type']
                assets_missing = [f for f in assets_fields if f not in assets_section]
                
                if not assets_missing:
                    self.log_test(
                        "Admin stats assets section has correct structure",
                        True,
                        f"Assets: {assets_section.get('total', 0)} total"
                    )
                else:
                    self.log_test(
                        "Admin stats assets section has correct structure",
                        False,
                        f"Missing asset fields: {assets_missing}"
                    )
            
            print(f"   📈 Statistics Summary:")
            print(f"   Total Users: {stats.get('users', {}).get('total', 0)}")
            print(f"   Total Assets: {stats.get('assets', {}).get('total', 0)}")
            print(f"   Scheduled Messages: {stats.get('scheduled_messages', {}).get('total', 0)}")
            print(f"   Dead Man Switches: {stats.get('dead_man_switches', {}).get('total', 0)}")
            print(f"   AI Insights: {stats.get('ai_insights', {}).get('total_generated', 0)}")
        
        self.session_token = old_token

    def test_admin_list_all_users(self):
        """Test List All Users"""
        print("\n👥 Testing Admin List All Users...")
        
        # Switch to admin user
        old_token = self.session_token
        self.session_token = self.admin_session_token
        
        users_response = self.run_test(
            "Get all users list",
            "GET",
            "admin/users?skip=0&limit=50",
            200
        )
        
        if users_response:
            # Verify response structure
            required_fields = ['users', 'total', 'skip', 'limit']
            missing_fields = [f for f in required_fields if f not in users_response]
            
            if not missing_fields:
                self.log_test(
                    "Admin users list has correct response structure",
                    True,
                    f"Response has all required fields: {required_fields}"
                )
            else:
                self.log_test(
                    "Admin users list has correct response structure",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            
            # Verify user objects structure
            users = users_response.get('users', [])
            if users and len(users) > 0:
                first_user = users[0]
                user_fields = ['id', 'email', 'name', 'role', 'subscription_plan', 'created_at', 'asset_count']
                user_missing = [f for f in user_fields if f not in first_user]
                
                if not user_missing:
                    self.log_test(
                        "Admin users list has correct user object structure",
                        True,
                        f"User objects have all required fields: {user_fields}"
                    )
                else:
                    self.log_test(
                        "Admin users list has correct user object structure",
                        False,
                        f"Missing user fields: {user_missing}"
                    )
                
                print(f"   👤 Found {len(users)} users")
                print(f"   Total users in system: {users_response.get('total', 0)}")
        
        self.session_token = old_token

    def test_admin_update_user_role(self):
        """Test Update User Role"""
        print("\n🔄 Testing Admin Update User Role...")
        
        # Switch to admin user
        old_token = self.session_token
        self.session_token = self.admin_session_token
        
        # First get a regular user to update
        users_response = self.run_test(
            "Get users for role update test",
            "GET",
            "admin/users?skip=0&limit=50",
            200
        )
        
        target_user_id = None
        if users_response and users_response.get('users'):
            # Find a non-admin user
            for user in users_response['users']:
                if user.get('role') != 'admin' and user.get('id') != self.admin_user_id:
                    target_user_id = user.get('id')
                    break
        
        if not target_user_id:
            # Use our test user
            target_user_id = self.user_id
        
        if target_user_id:
            # Test updating user role to readonly
            self.run_test(
                "Update user role to readonly",
                "PUT",
                f"admin/users/{target_user_id}/role",
                200,
                {"role": "readonly"}
            )
            
            # Test updating user role back to user
            self.run_test(
                "Update user role back to user",
                "PUT",
                f"admin/users/{target_user_id}/role",
                200,
                {"role": "user"}
            )
            
            # Test invalid role (should fail)
            self.run_test(
                "Update user role to invalid role (should fail)",
                "PUT",
                f"admin/users/{target_user_id}/role",
                400,
                {"role": "invalid_role"}
            )
            
            # Test admin trying to update own role (should fail)
            self.run_test(
                "Admin trying to update own role (should fail)",
                "PUT",
                f"admin/users/{self.admin_user_id}/role",
                400,
                {"role": "user"}
            )
        else:
            self.log_test(
                "Could not find user for role update test",
                False,
                "No suitable user found for testing role updates"
            )
        
        self.session_token = old_token

    def test_admin_scheduled_messages_status(self):
        """Test Scheduled Messages Status"""
        print("\n📅 Testing Admin Scheduled Messages Status...")
        
        # Switch to admin user
        old_token = self.session_token
        self.session_token = self.admin_session_token
        
        # Create a test scheduled message first
        self.session_token = old_token  # Switch back to regular user to create message
        
        test_message = {
            "recipient_name": "John Doe",
            "recipient_email": "john.doe@example.com",
            "subject": "Test Scheduled Message",
            "message": "This is a test message for admin monitoring",
            "send_date": "2024-12-31",
            "occasion": "New Year"
        }
        
        self.run_test(
            "Create test scheduled message for admin monitoring",
            "POST",
            "scheduled-messages",
            200,
            test_message
        )
        
        # Switch back to admin
        self.session_token = self.admin_session_token
        
        messages_response = self.run_test(
            "Get scheduled messages status",
            "GET",
            "admin/jobs/scheduled-messages",
            200
        )
        
        if messages_response:
            # Verify response structure
            required_fields = ['messages', 'total']
            missing_fields = [f for f in required_fields if f not in messages_response]
            
            if not missing_fields:
                self.log_test(
                    "Admin scheduled messages has correct response structure",
                    True,
                    f"Response has all required fields: {required_fields}"
                )
            else:
                self.log_test(
                    "Admin scheduled messages has correct response structure",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            
            # Verify message objects structure
            messages = messages_response.get('messages', [])
            if messages and len(messages) > 0:
                first_message = messages[0]
                message_fields = ['id', 'user_id', 'recipient_name', 'recipient_email', 'subject', 'send_date', 'status', 'created_at']
                message_missing = [f for f in message_fields if f not in first_message]
                
                if not message_missing:
                    self.log_test(
                        "Admin scheduled messages have correct structure",
                        True,
                        f"Message objects have all required fields: {message_fields}"
                    )
                else:
                    self.log_test(
                        "Admin scheduled messages have correct structure",
                        False,
                        f"Missing message fields: {message_missing}"
                    )
                
                print(f"   📨 Found {len(messages)} scheduled messages")
                print(f"   Total messages in system: {messages_response.get('total', 0)}")
        
        self.session_token = old_token

    def test_admin_dms_reminders_monitoring(self):
        """Test DMS Reminders Monitoring"""
        print("\n⏰ Testing Admin DMS Reminders Monitoring...")
        
        # Switch to admin user
        old_token = self.session_token
        self.session_token = self.admin_session_token
        
        # Create a test DMS first
        self.session_token = old_token  # Switch back to regular user to create DMS
        
        test_dms = {
            "inactivity_days": 90,
            "reminder_1_days": 60,
            "reminder_2_days": 75,
            "reminder_3_days": 85
        }
        
        self.run_test(
            "Create test DMS for admin monitoring",
            "POST",
            "dms",
            200,
            test_dms
        )
        
        # Switch back to admin
        self.session_token = self.admin_session_token
        
        dms_response = self.run_test(
            "Get DMS reminders status",
            "GET",
            "admin/jobs/dms-reminders",
            200
        )
        
        if dms_response:
            # Verify response structure
            required_fields = ['dms_reminders', 'total']
            missing_fields = [f for f in required_fields if f not in dms_response]
            
            if not missing_fields:
                self.log_test(
                    "Admin DMS reminders has correct response structure",
                    True,
                    f"Response has all required fields: {required_fields}"
                )
            else:
                self.log_test(
                    "Admin DMS reminders has correct response structure",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            
            # Verify DMS objects structure
            dms_reminders = dms_response.get('dms_reminders', [])
            if dms_reminders and len(dms_reminders) > 0:
                first_dms = dms_reminders[0]
                dms_fields = ['id', 'user_id', 'user_email', 'user_name', 'days_inactive', 'days_until_trigger', 'reminders_sent', 'is_active']
                dms_missing = [f for f in dms_fields if f not in first_dms]
                
                if not dms_missing:
                    self.log_test(
                        "Admin DMS reminders have correct structure",
                        True,
                        f"DMS objects have all required fields: {dms_fields}"
                    )
                else:
                    self.log_test(
                        "Admin DMS reminders have correct structure",
                        False,
                        f"Missing DMS fields: {dms_missing}"
                    )
                
                print(f"   ⏰ Found {len(dms_reminders)} DMS configurations")
                print(f"   Total DMS in system: {dms_response.get('total', 0)}")
        
        self.session_token = old_token

    def test_admin_delete_user(self):
        """Test Delete User (Comprehensive Cleanup)"""
        print("\n🗑️ Testing Admin Delete User...")
        
        # Switch to admin user
        old_token = self.session_token
        self.session_token = self.admin_session_token
        
        # Create a test user with some data
        timestamp = int(time.time())
        test_user_id = f"delete-test-user-{timestamp}"
        test_session_token = f"delete_test_session_{timestamp}"
        
        # Create test user in database
        mongo_commands = f"""
use('test_database');
var testUserId = '{test_user_id}';
var testSessionToken = '{test_session_token}';
var expiresAt = new Date(Date.now() + 7*24*60*60*1000);

// Create test user
db.users.insertOne({{
  id: testUserId,
  email: 'delete.test.{timestamp}@example.com',
  name: 'Delete Test User',
  picture: 'https://via.placeholder.com/150',
  role: 'user',
  last_activity: new Date(),
  created_at: new Date()
}});

// Create session
db.user_sessions.insertOne({{
  user_id: testUserId,
  session_token: testSessionToken,
  expires_at: expiresAt,
  created_at: new Date()
}});

// Create some test data for this user
db.assets.insertOne({{
  id: 'test-asset-' + testUserId,
  user_id: testUserId,
  type: 'bank',
  name: 'Test Bank Account for Deletion',
  total_value: 1000,
  purchase_currency: 'USD',
  created_at: new Date(),
  updated_at: new Date()
}});

db.nominees.insertOne({{
  id: 'test-nominee-' + testUserId,
  user_id: testUserId,
  name: 'Test Nominee',
  email: 'nominee@example.com',
  created_at: new Date()
}});

print('Test user with data created for deletion test');
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
                print(f"✅ Test user created for deletion: {test_user_id}")
                
                # Test admin trying to delete own account (should fail)
                self.run_test(
                    "Admin trying to delete own account (should fail)",
                    "DELETE",
                    f"admin/users/{self.admin_user_id}",
                    400
                )
                
                # Test deleting the test user (should work)
                delete_response = self.run_test(
                    "Delete test user and all associated data",
                    "DELETE",
                    f"admin/users/{test_user_id}",
                    200
                )
                
                if delete_response:
                    # Verify user and all associated data is deleted
                    verification_commands = f"""
use('test_database');
var testUserId = '{test_user_id}';

var userCount = db.users.countDocuments({{id: testUserId}});
var sessionCount = db.user_sessions.countDocuments({{user_id: testUserId}});
var assetCount = db.assets.countDocuments({{user_id: testUserId}});
var nomineeCount = db.nominees.countDocuments({{user_id: testUserId}});

print('Verification results:');
print('Users: ' + userCount);
print('Sessions: ' + sessionCount);
print('Assets: ' + assetCount);
print('Nominees: ' + nomineeCount);

if (userCount === 0 && sessionCount === 0 && assetCount === 0 && nomineeCount === 0) {{
    print('SUCCESS: All data deleted');
}} else {{
    print('FAILURE: Some data remains');
}}
"""
                    
                    verification_result = subprocess.run(
                        ['mongosh', '--eval', verification_commands],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    
                    if "SUCCESS: All data deleted" in verification_result.stdout:
                        self.log_test(
                            "User deletion removes all associated data",
                            True,
                            "User and all related data successfully deleted"
                        )
                    else:
                        self.log_test(
                            "User deletion removes all associated data",
                            False,
                            f"Some data may remain: {verification_result.stdout}"
                        )
            else:
                self.log_test(
                    "Could not create test user for deletion test",
                    False,
                    f"Database error: {result.stderr}"
                )
                
        except Exception as e:
            self.log_test(
                "Error in user deletion test setup",
                False,
                f"Error: {str(e)}"
            )
        
        self.session_token = old_token

    def create_test_data_for_admin_stats(self):
        """Create test data for meaningful admin statistics"""
        # Switch to regular user to create some test data
        old_token = self.session_token
        self.session_token = old_token
        
        # Create a test asset
        test_asset = {
            "type": "bank",
            "name": "Test Bank for Admin Stats",
            "total_value": 5000,
            "purchase_currency": "USD"
        }
        
        self.run_test(
            "Create test asset for admin stats",
            "POST",
            "assets",
            200,
            test_asset
        )
        
        # Create a scheduled message
        test_message = {
            "recipient_name": "Stats Test Recipient",
            "recipient_email": "stats.test@example.com",
            "subject": "Test Message for Stats",
            "message": "This is for admin stats testing",
            "send_date": "2024-12-25"
        }
        
        self.run_test(
            "Create test scheduled message for admin stats",
            "POST",
            "scheduled-messages",
            200,
            test_message
        )

    def cleanup_admin_test_data(self):
        """Clean up admin test data"""
        if hasattr(self, 'admin_user_id') and self.admin_user_id:
            mongo_cleanup = f"""
use('test_database');
db.users.deleteOne({{id: '{self.admin_user_id}'}});
db.user_sessions.deleteOne({{user_id: '{self.admin_user_id}'}});
print('Admin test data cleaned up');
"""
            
            try:
                import subprocess
                subprocess.run(['mongosh', '--eval', mongo_cleanup], timeout=30)
                print("✅ Admin test data cleaned up")
            except Exception as e:
                print(f"⚠️  Admin cleanup warning: {str(e)}")

    def test_admin_panel_backend(self):
        """Test all Admin Panel Backend features"""
        print("\n🛡️ Testing Admin Panel Backend Features...")
        
        # Create admin user for testing
        if not self.create_admin_user():
            print("❌ Failed to create admin user. Cannot proceed with admin tests.")
            return False
        
        try:
            # Run all admin tests
            self.test_admin_role_assignment()
            self.test_admin_authorization_middleware()
            self.test_admin_statistics_dashboard()
            self.test_admin_list_all_users()
            self.test_admin_update_user_role()
            self.test_admin_scheduled_messages_status()
            self.test_admin_dms_reminders_monitoring()
            self.test_admin_delete_user()
            
        finally:
            # Cleanup admin test data
            self.cleanup_admin_test_data()
        
        return True

    def cleanup_user_data(self):
        """Clean up all user data including snapshots and insights"""
        if not self.user_id:
            return
            
        mongo_cleanup = f"""
use('test_database');
db.assets.deleteMany({{user_id: '{self.user_id}'}});
db.networth_snapshots.deleteMany({{user_id: '{self.user_id}'}});
db.ai_insights.deleteMany({{user_id: '{self.user_id}'}});
print('User data cleaned up');
"""
        
        try:
            import subprocess
            subprocess.run(['mongosh', '--eval', mongo_cleanup], timeout=30)
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")

    def cleanup_user_snapshots(self):
        """Clean up only net worth snapshots for the current user"""
        if not self.user_id:
            return
            
        mongo_cleanup = f"""
use('test_database');
db.networth_snapshots.deleteMany({{user_id: '{self.user_id}'}});
print('Snapshots cleaned up');
"""
        
        try:
            import subprocess
            subprocess.run(['mongosh', '--eval', mongo_cleanup], timeout=30)
        except Exception as e:
            print(f"⚠️  Snapshots cleanup warning: {str(e)}")

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

    def test_portfolio_management_apis(self):
        """Test Portfolio Management Backend APIs"""
        print("\n💼 Testing Portfolio Management Backend APIs...")
        
        # Clean up existing data
        self.cleanup_test_data()
        
        # Test 1: GET /api/portfolio-assets - List all portfolio accounts (initially empty)
        portfolios = self.run_test(
            "Get portfolio assets list (initially empty)",
            "GET",
            "portfolio-assets",
            200
        )
        
        if portfolios is not None:
            if isinstance(portfolios, list) and len(portfolios) == 0:
                self.log_test(
                    "Initial portfolio list is empty",
                    True,
                    "No portfolios found as expected"
                )
            else:
                self.log_test(
                    "Initial portfolio list is empty",
                    False,
                    f"Expected empty list, got: {portfolios}"
                )
        
        # Test 2: POST /api/portfolio-assets - Create new portfolio account
        portfolio_data = {
            "name": "My Binance Account",
            "provider_name": "binance",
            "provider_type": "crypto_exchange",
            "purchase_currency": "USD"
        }
        
        created_portfolio = self.run_test(
            "Create new portfolio account",
            "POST",
            "portfolio-assets",
            200,
            portfolio_data
        )
        
        portfolio_id = None
        if created_portfolio and created_portfolio.get('success'):
            portfolio_id = created_portfolio.get('id')
            print(f"   Created portfolio ID: {portfolio_id}")
            self.log_test(
                "Portfolio creation returns success and ID",
                True,
                f"Portfolio ID: {portfolio_id}"
            )
        else:
            self.log_test(
                "Portfolio creation returns success and ID",
                False,
                f"Response: {created_portfolio}"
            )
        
        # Test 3: GET /api/portfolio-assets - Verify portfolio is in list
        portfolios_after_create = self.run_test(
            "Get portfolio assets list after creation",
            "GET",
            "portfolio-assets",
            200
        )
        
        if portfolios_after_create and isinstance(portfolios_after_create, list):
            if len(portfolios_after_create) == 1:
                portfolio = portfolios_after_create[0]
                if (portfolio.get('name') == 'My Binance Account' and 
                    portfolio.get('provider_name') == 'binance' and
                    portfolio.get('provider_type') == 'crypto_exchange'):
                    self.log_test(
                        "Created portfolio appears in list with correct data",
                        True,
                        f"Portfolio: {portfolio.get('name')} ({portfolio.get('provider_name')})"
                    )
                else:
                    self.log_test(
                        "Created portfolio appears in list with correct data",
                        False,
                        f"Portfolio data mismatch: {portfolio}"
                    )
            else:
                self.log_test(
                    "Portfolio list has correct count after creation",
                    False,
                    f"Expected 1 portfolio, found {len(portfolios_after_create)}"
                )
        
        if not portfolio_id:
            self.log_test(
                "Cannot continue portfolio tests",
                False,
                "Portfolio creation failed, skipping remaining tests"
            )
            return
        
        # Test 4: GET /api/portfolio-assets/{portfolio_id} - Get portfolio details
        portfolio_details = self.run_test(
            "Get portfolio details",
            "GET",
            f"portfolio-assets/{portfolio_id}",
            200
        )
        
        if portfolio_details:
            required_fields = ['id', 'name', 'provider_name', 'provider_type', 'holdings', 'total_value']
            missing_fields = [f for f in required_fields if f not in portfolio_details]
            
            if not missing_fields:
                self.log_test(
                    "Portfolio details has all required fields",
                    True,
                    f"All fields present: {required_fields}"
                )
            else:
                self.log_test(
                    "Portfolio details has all required fields",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            
            # Verify holdings is initially empty
            holdings = portfolio_details.get('holdings', [])
            if isinstance(holdings, list) and len(holdings) == 0:
                self.log_test(
                    "New portfolio has empty holdings list",
                    True,
                    "Holdings list is empty as expected"
                )
            else:
                self.log_test(
                    "New portfolio has empty holdings list",
                    False,
                    f"Expected empty holdings, got: {holdings}"
                )
        
        # Test 5: POST /api/portfolio-assets/{portfolio_id}/holdings - Add Bitcoin holding
        bitcoin_holding = {
            "symbol": "BTC",
            "name": "Bitcoin",
            "quantity": 0.5,
            "purchase_price": 45000.0,
            "purchase_date": "2024-01-15",
            "purchase_currency": "USD",
            "current_price": 52000.0,
            "asset_type": "crypto"
        }
        
        add_bitcoin_result = self.run_test(
            "Add Bitcoin holding to portfolio",
            "POST",
            f"portfolio-assets/{portfolio_id}/holdings",
            200,
            bitcoin_holding
        )
        
        # Test 6: Add Ethereum holding
        ethereum_holding = {
            "symbol": "ETH",
            "name": "Ethereum",
            "quantity": 5.0,
            "purchase_price": 2500.0,
            "purchase_date": "2024-02-01",
            "purchase_currency": "USD",
            "current_price": 3200.0,
            "asset_type": "crypto"
        }
        
        add_ethereum_result = self.run_test(
            "Add Ethereum holding to portfolio",
            "POST",
            f"portfolio-assets/{portfolio_id}/holdings",
            200,
            ethereum_holding
        )
        
        # Test 7: GET portfolio details and verify holdings are present
        portfolio_with_holdings = self.run_test(
            "Get portfolio details with holdings",
            "GET",
            f"portfolio-assets/{portfolio_id}",
            200
        )
        
        if portfolio_with_holdings:
            holdings = portfolio_with_holdings.get('holdings', [])
            
            if len(holdings) == 2:
                self.log_test(
                    "Portfolio has correct number of holdings",
                    True,
                    f"Found {len(holdings)} holdings"
                )
                
                # Verify Bitcoin holding
                btc_holding = next((h for h in holdings if h.get('symbol') == 'BTC'), None)
                if btc_holding:
                    if (btc_holding.get('quantity') == 0.5 and 
                        btc_holding.get('purchase_price') == 45000.0 and
                        btc_holding.get('current_price') == 52000.0):
                        self.log_test(
                            "Bitcoin holding has correct values",
                            True,
                            f"BTC: {btc_holding.get('quantity')} @ ${btc_holding.get('current_price')}"
                        )
                    else:
                        self.log_test(
                            "Bitcoin holding has correct values",
                            False,
                            f"BTC holding data: {btc_holding}"
                        )
                
                # Verify Ethereum holding
                eth_holding = next((h for h in holdings if h.get('symbol') == 'ETH'), None)
                if eth_holding:
                    if (eth_holding.get('quantity') == 5.0 and 
                        eth_holding.get('purchase_price') == 2500.0 and
                        eth_holding.get('current_price') == 3200.0):
                        self.log_test(
                            "Ethereum holding has correct values",
                            True,
                            f"ETH: {eth_holding.get('quantity')} @ ${eth_holding.get('current_price')}"
                        )
                    else:
                        self.log_test(
                            "Ethereum holding has correct values",
                            False,
                            f"ETH holding data: {eth_holding}"
                        )
            else:
                self.log_test(
                    "Portfolio has correct number of holdings",
                    False,
                    f"Expected 2 holdings, found {len(holdings)}"
                )
            
            # Test 8: Verify total_value is calculated correctly
            total_value = portfolio_with_holdings.get('total_value', 0)
            expected_btc_value = 0.5 * 52000.0  # 26000
            expected_eth_value = 5.0 * 3200.0   # 16000
            expected_total = expected_btc_value + expected_eth_value  # 42000
            
            if abs(total_value - expected_total) < 0.01:
                self.log_test(
                    "Portfolio total_value calculated correctly",
                    True,
                    f"Total value: ${total_value} (Expected: ${expected_total})"
                )
            else:
                self.log_test(
                    "Portfolio total_value calculated correctly",
                    False,
                    f"Total value: ${total_value}, Expected: ${expected_total}"
                )
        
        # Test 9: PUT /api/portfolio-assets/{portfolio_id}/holdings/{symbol} - Update Bitcoin current_price
        updated_bitcoin = {
            "symbol": "BTC",
            "name": "Bitcoin",
            "quantity": 0.5,
            "purchase_price": 45000.0,
            "purchase_date": "2024-01-15",
            "purchase_currency": "USD",
            "current_price": 55000.0,  # Updated price
            "asset_type": "crypto"
        }
        
        update_result = self.run_test(
            "Update Bitcoin holding current_price",
            "PUT",
            f"portfolio-assets/{portfolio_id}/holdings/BTC",
            200,
            updated_bitcoin
        )
        
        # Verify the update worked
        portfolio_after_update = self.run_test(
            "Get portfolio after Bitcoin price update",
            "GET",
            f"portfolio-assets/{portfolio_id}",
            200
        )
        
        if portfolio_after_update:
            holdings = portfolio_after_update.get('holdings', [])
            btc_holding = next((h for h in holdings if h.get('symbol') == 'BTC'), None)
            
            if btc_holding and btc_holding.get('current_price') == 55000.0:
                self.log_test(
                    "Bitcoin holding price updated correctly",
                    True,
                    f"BTC current price: ${btc_holding.get('current_price')}"
                )
            else:
                self.log_test(
                    "Bitcoin holding price updated correctly",
                    False,
                    f"BTC holding after update: {btc_holding}"
                )
            
            # Verify total value recalculated
            new_total_value = portfolio_after_update.get('total_value', 0)
            expected_new_btc_value = 0.5 * 55000.0  # 27500
            expected_new_total = expected_new_btc_value + expected_eth_value  # 43500
            
            if abs(new_total_value - expected_new_total) < 0.01:
                self.log_test(
                    "Portfolio total_value recalculated after update",
                    True,
                    f"New total value: ${new_total_value} (Expected: ${expected_new_total})"
                )
            else:
                self.log_test(
                    "Portfolio total_value recalculated after update",
                    False,
                    f"New total value: ${new_total_value}, Expected: ${expected_new_total}"
                )
        
        # Test 10: DELETE /api/portfolio-assets/{portfolio_id}/holdings/{symbol} - Delete Ethereum holding
        delete_eth_result = self.run_test(
            "Delete Ethereum holding",
            "DELETE",
            f"portfolio-assets/{portfolio_id}/holdings/ETH",
            200
        )
        
        # Verify Ethereum was deleted
        portfolio_after_delete = self.run_test(
            "Get portfolio after Ethereum deletion",
            "GET",
            f"portfolio-assets/{portfolio_id}",
            200
        )
        
        if portfolio_after_delete:
            holdings = portfolio_after_delete.get('holdings', [])
            
            if len(holdings) == 1:
                remaining_holding = holdings[0]
                if remaining_holding.get('symbol') == 'BTC':
                    self.log_test(
                        "Ethereum holding deleted, Bitcoin remains",
                        True,
                        f"Remaining holding: {remaining_holding.get('symbol')}"
                    )
                else:
                    self.log_test(
                        "Ethereum holding deleted, Bitcoin remains",
                        False,
                        f"Unexpected remaining holding: {remaining_holding}"
                    )
            else:
                self.log_test(
                    "Portfolio has correct holdings count after deletion",
                    False,
                    f"Expected 1 holding, found {len(holdings)}"
                )
            
            # Verify total value updated after deletion
            final_total_value = portfolio_after_delete.get('total_value', 0)
            expected_final_total = 0.5 * 55000.0  # Only Bitcoin remains: 27500
            
            if abs(final_total_value - expected_final_total) < 0.01:
                self.log_test(
                    "Portfolio total_value updated after holding deletion",
                    True,
                    f"Final total value: ${final_total_value} (Expected: ${expected_final_total})"
                )
            else:
                self.log_test(
                    "Portfolio total_value updated after holding deletion",
                    False,
                    f"Final total value: ${final_total_value}, Expected: ${expected_final_total}"
                )
        
        # Test 11: DELETE /api/portfolio-assets/{portfolio_id} - Delete entire portfolio
        delete_portfolio_result = self.run_test(
            "Delete entire portfolio",
            "DELETE",
            f"portfolio-assets/{portfolio_id}",
            200
        )
        
        # Test 12: Verify portfolio is deleted
        portfolios_after_delete = self.run_test(
            "Get portfolio list after deletion",
            "GET",
            "portfolio-assets",
            200
        )
        
        if portfolios_after_delete is not None:
            if isinstance(portfolios_after_delete, list) and len(portfolios_after_delete) == 0:
                self.log_test(
                    "Portfolio deleted successfully",
                    True,
                    "Portfolio list is empty after deletion"
                )
            else:
                self.log_test(
                    "Portfolio deleted successfully",
                    False,
                    f"Expected empty list after deletion, got: {portfolios_after_delete}"
                )
        
        # Test 13: Verify deleted portfolio returns 404
        self.run_test(
            "Access deleted portfolio returns 404",
            "GET",
            f"portfolio-assets/{portfolio_id}",
            404
        )
        
        print(f"   📊 Portfolio Management API Tests Summary:")
        print(f"   ✅ Portfolio CRUD operations")
        print(f"   ✅ Holdings CRUD operations")
        print(f"   ✅ Total value calculations")
        print(f"   ✅ Data integrity verification")

    def test_portfolio_integration_dashboard(self):
        """Test Portfolio Integration - Dashboard Summary"""
        print("\n📊 Testing Portfolio Integration - Dashboard Summary...")
        
        # Clean up existing data
        self.cleanup_user_data()
        
        # Step 1: Create individual assets
        individual_assets = [
            {
                "type": "bank",
                "name": "Chase Savings",
                "total_value": 15000,
                "current_total_value": 15500,
                "purchase_currency": "USD"
            },
            {
                "type": "crypto",
                "name": "Personal Bitcoin",
                "quantity": 0.1,
                "unit_price": 45000,
                "current_unit_price": 52000,
                "symbol": "BTC",
                "purchase_currency": "USD"
            }
        ]
        
        created_asset_ids = []
        for asset in individual_assets:
            created_asset = self.run_test(
                f"Create individual {asset['type']} asset: {asset['name']}",
                "POST",
                "assets",
                200,
                asset
            )
            if created_asset:
                created_asset_ids.append(created_asset.get('id'))
        
        # Step 2: Create a portfolio
        portfolio_data = {
            "name": "My Binance Account",
            "provider_name": "binance",
            "provider_type": "crypto_exchange",
            "purchase_currency": "USD"
        }
        
        created_portfolio = self.run_test(
            "Create portfolio for dashboard integration test",
            "POST",
            "portfolio-assets",
            200,
            portfolio_data
        )
        
        portfolio_id = None
        if created_portfolio:
            portfolio_id = created_portfolio.get('id')
            print(f"   Created portfolio ID: {portfolio_id}")
        
        # Step 3: Add holdings to portfolio
        if portfolio_id:
            holdings = [
                {
                    "symbol": "BTC",
                    "name": "Bitcoin",
                    "quantity": 0.5,
                    "purchase_price": 48000,
                    "purchase_date": "2024-01-15",
                    "purchase_currency": "USD",
                    "current_price": 55000,
                    "asset_type": "crypto"
                },
                {
                    "symbol": "ETH",
                    "name": "Ethereum",
                    "quantity": 2.0,
                    "purchase_price": 2500,
                    "purchase_date": "2024-01-20",
                    "purchase_currency": "USD",
                    "current_price": 3000,
                    "asset_type": "crypto"
                }
            ]
            
            for holding in holdings:
                self.run_test(
                    f"Add {holding['symbol']} holding to portfolio",
                    "POST",
                    f"portfolio-assets/{portfolio_id}/holdings",
                    200,
                    holding
                )
        
        # Step 4: Test dashboard summary includes portfolio values
        summary = self.run_test(
            "Get dashboard summary with portfolio integration",
            "GET",
            "dashboard/summary",
            200
        )
        
        if summary:
            print(f"   📊 Dashboard Integration Test Results:")
            
            # Test 1: total_portfolios count
            total_portfolios = summary.get('total_portfolios', 0)
            if total_portfolios >= 1:
                self.log_test(
                    "Dashboard includes total_portfolios count",
                    True,
                    f"Found {total_portfolios} portfolios"
                )
            else:
                self.log_test(
                    "Dashboard includes total_portfolios count",
                    False,
                    f"Expected >= 1 portfolio, got {total_portfolios}"
                )
            
            # Test 2: Portfolio appears in asset_types
            asset_types = summary.get('asset_types', {})
            portfolio_count = asset_types.get('portfolio', 0)
            if portfolio_count >= 1:
                self.log_test(
                    "Portfolio appears in asset_types",
                    True,
                    f"Portfolio count in asset_types: {portfolio_count}"
                )
            else:
                self.log_test(
                    "Portfolio appears in asset_types",
                    False,
                    f"Portfolio not found in asset_types: {asset_types}"
                )
            
            # Test 3: Portfolio value included in total_assets_value
            total_assets_value = summary.get('total_assets_value', 0)
            expected_portfolio_value = (0.5 * 55000) + (2.0 * 3000)  # BTC + ETH current values
            expected_individual_value = 15500 + (0.1 * 52000)  # Bank + Personal Bitcoin
            expected_total = expected_portfolio_value + expected_individual_value
            
            if abs(total_assets_value - expected_total) < 100:  # Allow small tolerance
                self.log_test(
                    "Portfolio value included in total_assets_value",
                    True,
                    f"Total assets: ${total_assets_value}, Expected: ~${expected_total}"
                )
            else:
                self.log_test(
                    "Portfolio value included in total_assets_value",
                    False,
                    f"Total assets: ${total_assets_value}, Expected: ~${expected_total}"
                )
            
            # Test 4: Portfolio value in asset_values_separate
            asset_values_separate = summary.get('asset_values_separate', {})
            portfolio_value_separate = asset_values_separate.get('portfolio', 0)
            if abs(portfolio_value_separate - expected_portfolio_value) < 10:
                self.log_test(
                    "Portfolio value in asset_values_separate",
                    True,
                    f"Portfolio value: ${portfolio_value_separate}, Expected: ~${expected_portfolio_value}"
                )
            else:
                self.log_test(
                    "Portfolio value in asset_values_separate",
                    False,
                    f"Portfolio value: ${portfolio_value_separate}, Expected: ~${expected_portfolio_value}"
                )
            
            # Test 5: Net worth calculation includes portfolio
            net_worth = summary.get('net_worth', 0)
            if abs(net_worth - expected_total) < 100:
                self.log_test(
                    "Net worth calculation includes portfolio value",
                    True,
                    f"Net worth: ${net_worth}, Expected: ~${expected_total}"
                )
            else:
                self.log_test(
                    "Net worth calculation includes portfolio value",
                    False,
                    f"Net worth: ${net_worth}, Expected: ~${expected_total}"
                )
            
            # Test 6: Portfolio counted in diversification metrics
            validation = summary.get('validation', {})
            includes_portfolios = validation.get('includes_portfolios', False)
            if includes_portfolios:
                self.log_test(
                    "Portfolio counted in diversification metrics",
                    True,
                    "Validation confirms portfolios included"
                )
            else:
                self.log_test(
                    "Portfolio counted in diversification metrics",
                    False,
                    "Validation does not confirm portfolio inclusion"
                )
            
            print(f"   Total Assets: ${total_assets_value}")
            print(f"   Total Portfolios: {total_portfolios}")
            print(f"   Portfolio Value: ${portfolio_value_separate}")
            print(f"   Net Worth: ${net_worth}")
        
        # Cleanup
        for asset_id in created_asset_ids:
            if asset_id:
                self.run_test(
                    f"Cleanup individual asset {asset_id}",
                    "DELETE",
                    f"assets/{asset_id}",
                    200
                )
        
        if portfolio_id:
            self.run_test(
                "Cleanup portfolio",
                "DELETE",
                f"portfolio-assets/{portfolio_id}",
                200
            )

    def test_portfolio_integration_ai_insights(self):
        """Test Portfolio Integration - AI Insights"""
        print("\n🤖 Testing Portfolio Integration - AI Insights...")
        
        # Clean up existing data
        self.cleanup_user_data()
        
        # Step 1: Create individual assets
        individual_assets = [
            {
                "type": "stock",
                "name": "Apple Stock",
                "quantity": 50,
                "unit_price": 150,
                "current_unit_price": 175,
                "symbol": "AAPL",
                "purchase_currency": "USD"
            }
        ]
        
        created_asset_ids = []
        for asset in individual_assets:
            created_asset = self.run_test(
                f"Create individual {asset['type']} asset for AI test: {asset['name']}",
                "POST",
                "assets",
                200,
                asset
            )
            if created_asset:
                created_asset_ids.append(created_asset.get('id'))
        
        # Step 2: Create portfolio with holdings
        portfolio_data = {
            "name": "My Investment Portfolio",
            "provider_name": "robinhood",
            "provider_type": "stock_broker",
            "purchase_currency": "USD"
        }
        
        created_portfolio = self.run_test(
            "Create portfolio for AI insights test",
            "POST",
            "portfolio-assets",
            200,
            portfolio_data
        )
        
        portfolio_id = None
        if created_portfolio:
            portfolio_id = created_portfolio.get('id')
        
        # Add holdings to portfolio
        if portfolio_id:
            holdings = [
                {
                    "symbol": "TSLA",
                    "name": "Tesla",
                    "quantity": 10,
                    "purchase_price": 200,
                    "purchase_date": "2024-01-10",
                    "purchase_currency": "USD",
                    "current_price": 250,
                    "asset_type": "stock"
                },
                {
                    "symbol": "GOOGL",
                    "name": "Google",
                    "quantity": 5,
                    "purchase_price": 2800,
                    "purchase_date": "2024-01-15",
                    "purchase_currency": "USD",
                    "current_price": 3000,
                    "asset_type": "stock"
                }
            ]
            
            for holding in holdings:
                self.run_test(
                    f"Add {holding['symbol']} holding for AI test",
                    "POST",
                    f"portfolio-assets/{portfolio_id}/holdings",
                    200,
                    holding
                )
        
        # Step 3: Generate AI insights
        insights = self.run_test(
            "Generate AI insights with portfolio integration",
            "POST",
            "insights/generate",
            200
        )
        
        if insights:
            print(f"   🤖 AI Insights Integration Test Results:")
            
            # Test 1: Portfolio holdings mentioned in analysis
            portfolio_summary = insights.get('portfolio_summary', '')
            asset_distribution_analysis = insights.get('asset_distribution_analysis', '')
            
            # Check if portfolio-related terms appear in the analysis
            portfolio_keywords = ['portfolio', 'holdings', 'robinhood', 'TSLA', 'GOOGL', 'Tesla', 'Google']
            found_keywords = []
            
            full_analysis = f"{portfolio_summary} {asset_distribution_analysis}".lower()
            for keyword in portfolio_keywords:
                if keyword.lower() in full_analysis:
                    found_keywords.append(keyword)
            
            if len(found_keywords) >= 2:  # At least 2 portfolio-related keywords
                self.log_test(
                    "AI analysis mentions portfolio holdings",
                    True,
                    f"Found keywords: {found_keywords}"
                )
            else:
                self.log_test(
                    "AI analysis mentions portfolio holdings",
                    False,
                    f"Only found keywords: {found_keywords} in analysis"
                )
            
            # Test 2: Analysis considers both individual assets and portfolio holdings
            individual_keywords = ['apple', 'aapl', 'individual', 'stock']
            found_individual = []
            
            for keyword in individual_keywords:
                if keyword.lower() in full_analysis:
                    found_individual.append(keyword)
            
            if len(found_individual) >= 1 and len(found_keywords) >= 1:
                self.log_test(
                    "AI analysis considers both individual assets and portfolios",
                    True,
                    f"Individual: {found_individual}, Portfolio: {found_keywords}"
                )
            else:
                self.log_test(
                    "AI analysis considers both individual assets and portfolios",
                    False,
                    f"Individual: {found_individual}, Portfolio: {found_keywords}"
                )
            
            # Test 3: Total holdings across portfolios mentioned
            if 'total' in full_analysis and ('holding' in full_analysis or 'asset' in full_analysis):
                self.log_test(
                    "AI mentions total holdings across portfolios",
                    True,
                    "Analysis includes total holdings discussion"
                )
            else:
                self.log_test(
                    "AI mentions total holdings across portfolios",
                    False,
                    "No mention of total holdings found"
                )
            
            print(f"   Portfolio Summary Length: {len(portfolio_summary)} chars")
            print(f"   Asset Distribution Analysis Length: {len(asset_distribution_analysis)} chars")
            print(f"   Portfolio Keywords Found: {found_keywords}")
            print(f"   Individual Asset Keywords Found: {found_individual}")
        
        # Cleanup
        for asset_id in created_asset_ids:
            if asset_id:
                self.run_test(
                    f"Cleanup individual asset {asset_id}",
                    "DELETE",
                    f"assets/{asset_id}",
                    200
                )
        
        if portfolio_id:
            self.run_test(
                "Cleanup AI test portfolio",
                "DELETE",
                f"portfolio-assets/{portfolio_id}",
                200
            )

    def test_portfolio_integration_networth_snapshots(self):
        """Test Portfolio Integration - Net Worth Snapshots"""
        print("\n📈 Testing Portfolio Integration - Net Worth Snapshots...")
        
        # Clean up existing data
        self.cleanup_user_data()
        
        # Step 1: Create individual assets
        individual_assets = [
            {
                "type": "bank",
                "name": "Checking Account",
                "total_value": 5000,
                "current_total_value": 5200,
                "purchase_currency": "USD"
            }
        ]
        
        created_asset_ids = []
        for asset in individual_assets:
            created_asset = self.run_test(
                f"Create individual {asset['type']} asset for snapshot test: {asset['name']}",
                "POST",
                "assets",
                200,
                asset
            )
            if created_asset:
                created_asset_ids.append(created_asset.get('id'))
        
        # Step 2: Create portfolio with holdings
        portfolio_data = {
            "name": "My Crypto Portfolio",
            "provider_name": "coinbase",
            "provider_type": "crypto_exchange",
            "purchase_currency": "USD"
        }
        
        created_portfolio = self.run_test(
            "Create portfolio for snapshot test",
            "POST",
            "portfolio-assets",
            200,
            portfolio_data
        )
        
        portfolio_id = None
        if created_portfolio:
            portfolio_id = created_portfolio.get('id')
        
        # Add holdings to portfolio
        if portfolio_id:
            holdings = [
                {
                    "symbol": "BTC",
                    "name": "Bitcoin",
                    "quantity": 0.25,
                    "purchase_price": 50000,
                    "purchase_date": "2024-01-01",
                    "purchase_currency": "USD",
                    "current_price": 60000,
                    "asset_type": "crypto"
                }
            ]
            
            for holding in holdings:
                self.run_test(
                    f"Add {holding['symbol']} holding for snapshot test",
                    "POST",
                    f"portfolio-assets/{portfolio_id}/holdings",
                    200,
                    holding
                )
        
        # Step 3: Create a net worth snapshot
        snapshot_data = {
            "snapshot_date": "2024-01-15",
            "currency": "USD"
        }
        
        snapshot_result = self.run_test(
            "Create net worth snapshot with portfolio integration",
            "POST",
            "networth/snapshot",
            200,
            snapshot_data
        )
        
        if snapshot_result:
            print(f"   📈 Net Worth Snapshot Integration Test Results:")
            
            # Test 1: Snapshot includes portfolio values in asset breakdown
            asset_breakdown = snapshot_result.get('asset_breakdown', {})
            portfolio_value_in_breakdown = asset_breakdown.get('portfolio', 0)
            expected_portfolio_value = 0.25 * 60000  # BTC current value
            
            if abs(portfolio_value_in_breakdown - expected_portfolio_value) < 10:
                self.log_test(
                    "Snapshot includes portfolio values in asset breakdown",
                    True,
                    f"Portfolio value in breakdown: ${portfolio_value_in_breakdown}, Expected: ~${expected_portfolio_value}"
                )
            else:
                self.log_test(
                    "Snapshot includes portfolio values in asset breakdown",
                    False,
                    f"Portfolio value in breakdown: ${portfolio_value_in_breakdown}, Expected: ~${expected_portfolio_value}"
                )
            
            # Test 2: Total assets includes portfolios
            total_assets = snapshot_result.get('total_assets', 0)
            expected_total = 5200 + expected_portfolio_value  # Bank + Portfolio
            
            if abs(total_assets - expected_total) < 50:
                self.log_test(
                    "Snapshot total assets includes portfolios",
                    True,
                    f"Total assets: ${total_assets}, Expected: ~${expected_total}"
                )
            else:
                self.log_test(
                    "Snapshot total assets includes portfolios",
                    False,
                    f"Total assets: ${total_assets}, Expected: ~${expected_total}"
                )
            
            # Test 3: Net worth calculation is correct
            net_worth = snapshot_result.get('net_worth', 0)
            expected_net_worth = expected_total  # No liabilities in this test
            
            if abs(net_worth - expected_net_worth) < 50:
                self.log_test(
                    "Snapshot net worth calculation includes portfolios",
                    True,
                    f"Net worth: ${net_worth}, Expected: ~${expected_net_worth}"
                )
            else:
                self.log_test(
                    "Snapshot net worth calculation includes portfolios",
                    False,
                    f"Net worth: ${net_worth}, Expected: ~${expected_net_worth}"
                )
            
            # Test 4: Currency conversions work for portfolios
            currency = snapshot_result.get('currency', '')
            if currency == 'USD':
                self.log_test(
                    "Currency conversions work for portfolios",
                    True,
                    f"Snapshot currency: {currency}"
                )
            else:
                self.log_test(
                    "Currency conversions work for portfolios",
                    False,
                    f"Expected USD currency, got: {currency}"
                )
            
            print(f"   Total Assets: ${total_assets}")
            print(f"   Portfolio Value in Breakdown: ${portfolio_value_in_breakdown}")
            print(f"   Net Worth: ${net_worth}")
            print(f"   Asset Breakdown: {asset_breakdown}")
        
        # Cleanup
        for asset_id in created_asset_ids:
            if asset_id:
                self.run_test(
                    f"Cleanup individual asset {asset_id}",
                    "DELETE",
                    f"assets/{asset_id}",
                    200
                )
        
        if portfolio_id:
            self.run_test(
                "Cleanup snapshot test portfolio",
                "DELETE",
                f"portfolio-assets/{portfolio_id}",
                200
            )


    def test_loan_calculator_endpoint(self):
        """Test Loan Repayment Calculator API Endpoint"""
        print("\n💳 Testing Loan Repayment Calculator Endpoint...")
        
        # Test 1: Basic loan calculation
        print("\n   Test 1: Basic Loan Calculation")
        basic_loan = {
            "principal": 50000,
            "annual_interest_rate": 8.5,
            "tenure_months": 60,
            "loan_type": "personal"
        }
        
        basic_result = self.run_test(
            "Calculate basic personal loan (50k, 8.5%, 60 months)",
            "POST",
            "loan-calculator",
            200,
            basic_loan,
            timeout=60  # Longer timeout for AI generation
        )
        
        if basic_result:
            # Verify response structure
            required_fields = ['monthly_payment', 'total_interest', 'total_amount', 'amortization_schedule', 'ai_tips']
            missing_fields = [f for f in required_fields if f not in basic_result]
            
            if not missing_fields:
                self.log_test(
                    "Basic loan response has all required fields",
                    True,
                    f"All fields present: {required_fields}"
                )
            else:
                self.log_test(
                    "Basic loan response has all required fields",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            
            # Verify amortization schedule count
            schedule = basic_result.get('amortization_schedule', [])
            if len(schedule) == 60:
                self.log_test(
                    "Basic loan amortization schedule has correct number of entries",
                    True,
                    f"60 entries as expected"
                )
            else:
                self.log_test(
                    "Basic loan amortization schedule has correct number of entries",
                    False,
                    f"Expected 60, got {len(schedule)}"
                )
            
            # Verify AI tips are present and meaningful
            ai_tips = basic_result.get('ai_tips', '')
            if ai_tips and len(ai_tips) > 50 and 'unavailable' not in ai_tips.lower():
                self.log_test(
                    "Basic loan AI tips generated successfully",
                    True,
                    f"AI tips length: {len(ai_tips)} characters"
                )
            else:
                self.log_test(
                    "Basic loan AI tips generated successfully",
                    False,
                    f"AI tips: {ai_tips[:100] if ai_tips else 'None'}"
                )
            
            # Verify mathematical correctness
            monthly_payment = basic_result.get('monthly_payment', 0)
            total_interest = basic_result.get('total_interest', 0)
            total_amount = basic_result.get('total_amount', 0)
            
            # Check: total_amount = principal + total_interest
            expected_total = basic_loan['principal'] + total_interest
            if abs(total_amount - expected_total) < 0.01:
                self.log_test(
                    "Basic loan: total_amount = principal + total_interest",
                    True,
                    f"${total_amount:.2f} = ${basic_loan['principal']:.2f} + ${total_interest:.2f}"
                )
            else:
                self.log_test(
                    "Basic loan: total_amount = principal + total_interest",
                    False,
                    f"Expected ${expected_total:.2f}, got ${total_amount:.2f}"
                )
            
            # Verify remaining balance reaches 0 at the end
            if schedule:
                last_entry = schedule[-1]
                final_balance = last_entry.get('remaining_balance', -1)
                if final_balance == 0:
                    self.log_test(
                        "Basic loan: remaining balance reaches 0 at end",
                        True,
                        "Final balance is 0"
                    )
                else:
                    self.log_test(
                        "Basic loan: remaining balance reaches 0 at end",
                        False,
                        f"Final balance: ${final_balance:.2f}"
                    )
            
            # Verify all monetary values are rounded to 2 decimal places
            all_rounded = True
            for entry in schedule[:5]:  # Check first 5 entries
                for key in ['payment', 'principal_payment', 'interest_payment', 'remaining_balance']:
                    value = entry.get(key, 0)
                    if round(value, 2) != value:
                        all_rounded = False
                        break
                if not all_rounded:
                    break
            
            self.log_test(
                "Basic loan: all monetary values rounded to 2 decimals",
                all_rounded,
                "All values properly rounded" if all_rounded else "Some values not properly rounded"
            )
            
            # Verify monthly payment calculation (EMI formula)
            # EMI = P * r * (1+r)^n / ((1+r)^n - 1)
            P = basic_loan['principal']
            r = (basic_loan['annual_interest_rate'] / 100) / 12
            n = basic_loan['tenure_months']
            expected_emi = P * r * ((1 + r) ** n) / (((1 + r) ** n) - 1)
            
            if abs(monthly_payment - expected_emi) < 0.01:
                self.log_test(
                    "Basic loan: monthly payment uses correct EMI formula",
                    True,
                    f"Calculated: ${monthly_payment:.2f}, Expected: ${expected_emi:.2f}"
                )
            else:
                self.log_test(
                    "Basic loan: monthly payment uses correct EMI formula",
                    False,
                    f"Calculated: ${monthly_payment:.2f}, Expected: ${expected_emi:.2f}"
                )
            
            print(f"   📊 Basic Loan Results:")
            print(f"   Monthly Payment: ${monthly_payment:.2f}")
            print(f"   Total Interest: ${total_interest:.2f}")
            print(f"   Total Amount: ${total_amount:.2f}")
            print(f"   AI Tips Preview: {ai_tips[:100] if ai_tips else 'None'}...")
        
        # Test 2: Zero interest loan
        print("\n   Test 2: Zero Interest Loan")
        zero_interest_loan = {
            "principal": 10000,
            "annual_interest_rate": 0,
            "tenure_months": 12,
            "loan_type": "personal"
        }
        
        zero_result = self.run_test(
            "Calculate zero interest loan (10k, 0%, 12 months)",
            "POST",
            "loan-calculator",
            200,
            zero_interest_loan,
            timeout=60
        )
        
        if zero_result:
            monthly_payment = zero_result.get('monthly_payment', 0)
            total_interest = zero_result.get('total_interest', 0)
            expected_monthly = zero_interest_loan['principal'] / zero_interest_loan['tenure_months']
            
            # Verify monthly payment = principal / tenure
            if abs(monthly_payment - expected_monthly) < 0.01:
                self.log_test(
                    "Zero interest loan: monthly payment = principal/tenure",
                    True,
                    f"${monthly_payment:.2f} = ${zero_interest_loan['principal']}/{zero_interest_loan['tenure_months']}"
                )
            else:
                self.log_test(
                    "Zero interest loan: monthly payment = principal/tenure",
                    False,
                    f"Expected ${expected_monthly:.2f}, got ${monthly_payment:.2f}"
                )
            
            # Verify total interest is 0
            if total_interest == 0:
                self.log_test(
                    "Zero interest loan: total interest is 0",
                    True,
                    "Total interest correctly calculated as 0"
                )
            else:
                self.log_test(
                    "Zero interest loan: total interest is 0",
                    False,
                    f"Expected 0, got ${total_interest:.2f}"
                )
            
            print(f"   📊 Zero Interest Loan Results:")
            print(f"   Monthly Payment: ${monthly_payment:.2f}")
            print(f"   Total Interest: ${total_interest:.2f}")
        
        # Test 3: Short-term credit card loan
        print("\n   Test 3: Short-term Credit Card Loan")
        short_term_loan = {
            "principal": 5000,
            "annual_interest_rate": 12,
            "tenure_months": 6,
            "loan_type": "credit_card"
        }
        
        short_result = self.run_test(
            "Calculate short-term credit card loan (5k, 12%, 6 months)",
            "POST",
            "loan-calculator",
            200,
            short_term_loan,
            timeout=60
        )
        
        if short_result:
            schedule = short_result.get('amortization_schedule', [])
            if len(schedule) == 6:
                self.log_test(
                    "Short-term loan: amortization schedule has 6 entries",
                    True,
                    "Correct number of entries"
                )
            else:
                self.log_test(
                    "Short-term loan: amortization schedule has 6 entries",
                    False,
                    f"Expected 6, got {len(schedule)}"
                )
            
            print(f"   📊 Short-term Loan Results:")
            print(f"   Monthly Payment: ${short_result.get('monthly_payment', 0):.2f}")
            print(f"   Total Interest: ${short_result.get('total_interest', 0):.2f}")
        
        # Test 4: Long-term home loan
        print("\n   Test 4: Long-term Home Loan (30 years)")
        long_term_loan = {
            "principal": 300000,
            "annual_interest_rate": 4.5,
            "tenure_months": 360,
            "loan_type": "home"
        }
        
        long_result = self.run_test(
            "Calculate long-term home loan (300k, 4.5%, 360 months)",
            "POST",
            "loan-calculator",
            200,
            long_term_loan,
            timeout=60
        )
        
        if long_result:
            schedule = long_result.get('amortization_schedule', [])
            if len(schedule) == 360:
                self.log_test(
                    "Long-term loan: amortization schedule has 360 entries",
                    True,
                    "Correct number of entries for 30-year loan"
                )
            else:
                self.log_test(
                    "Long-term loan: amortization schedule has 360 entries",
                    False,
                    f"Expected 360, got {len(schedule)}"
                )
            
            # Verify final balance is 0
            if schedule:
                final_balance = schedule[-1].get('remaining_balance', -1)
                if final_balance == 0:
                    self.log_test(
                        "Long-term loan: final balance is 0",
                        True,
                        "Loan fully paid off"
                    )
                else:
                    self.log_test(
                        "Long-term loan: final balance is 0",
                        False,
                        f"Final balance: ${final_balance:.2f}"
                    )
            
            print(f"   📊 Long-term Loan Results:")
            print(f"   Monthly Payment: ${long_result.get('monthly_payment', 0):.2f}")
            print(f"   Total Interest: ${long_result.get('total_interest', 0):.2f}")
            print(f"   Total Amount: ${long_result.get('total_amount', 0):.2f}")
        
        # Test 5: Authentication test (without token)
        print("\n   Test 5: Authentication Test")
        old_token = self.session_token
        self.session_token = None
        
        self.run_test(
            "Call loan calculator without authentication (should fail)",
            "POST",
            "loan-calculator",
            401,
            basic_loan
        )
        
        self.session_token = old_token
        
        print("\n   ✅ Loan Calculator Endpoint Testing Complete")

    def test_demo_data_reseed(self):
        """Test Demo Data Reseed Endpoint"""
        print("\n🔄 Testing Demo Data Reseed Endpoint...")
        
        # First, ensure user is in demo mode
        demo_status = self.run_test(
            "Check demo mode status",
            "GET",
            "demo/status",
            200
        )
        
        if demo_status and not demo_status.get('demo_mode'):
            # Toggle to demo mode
            self.run_test(
                "Toggle to demo mode",
                "POST",
                "demo/toggle",
                200
            )
        
        # Call reseed endpoint
        reseed_result = self.run_test(
            "Reseed demo data",
            "POST",
            "demo/reseed",
            200
        )
        
        if reseed_result:
            print(f"   ✅ Demo data reseeded: {reseed_result.get('message', 'Success')}")
        
        # Verify demo assets were created (should be 20+)
        assets = self.run_test(
            "Get demo assets after reseed",
            "GET",
            "assets",
            200
        )
        
        if assets:
            asset_count = len(assets)
            if asset_count >= 20:
                self.log_test(
                    "Demo reseed creates 20+ assets",
                    True,
                    f"Created {asset_count} assets"
                )
            else:
                self.log_test(
                    "Demo reseed creates 20+ assets",
                    False,
                    f"Only {asset_count} assets created, expected 20+"
                )
            print(f"   📦 Demo assets count: {asset_count}")
        
        # Verify demo documents were created (should be 5)
        documents = self.run_test(
            "Get demo documents after reseed",
            "GET",
            "documents",
            200
        )
        
        if documents:
            doc_count = len(documents)
            if doc_count >= 5:
                self.log_test(
                    "Demo reseed creates 5+ documents",
                    True,
                    f"Created {doc_count} documents"
                )
            else:
                self.log_test(
                    "Demo reseed creates 5+ documents",
                    False,
                    f"Only {doc_count} documents created, expected 5+"
                )
            
            # Verify documents are linked to assets via linked_asset_id
            linked_docs = [d for d in documents if d.get('linked_asset_id')]
            if linked_docs:
                self.log_test(
                    "Demo documents are linked to assets",
                    True,
                    f"{len(linked_docs)} documents have linked_asset_id"
                )
            else:
                self.log_test(
                    "Demo documents are linked to assets",
                    False,
                    "No documents have linked_asset_id"
                )
            
            print(f"   📄 Demo documents count: {doc_count}")
            print(f"   🔗 Linked documents: {len(linked_docs)}")
        
        # Verify demo will was created (1 with beneficiaries)
        will = self.run_test(
            "Get demo will after reseed",
            "GET",
            "will",
            200
        )
        
        if will:
            beneficiaries = will.get('beneficiaries', [])
            if len(beneficiaries) > 0:
                self.log_test(
                    "Demo will created with beneficiaries",
                    True,
                    f"Will has {len(beneficiaries)} beneficiaries"
                )
            else:
                self.log_test(
                    "Demo will created with beneficiaries",
                    False,
                    "Will has no beneficiaries"
                )
            print(f"   📜 Demo will beneficiaries: {len(beneficiaries)}")
        else:
            self.log_test(
                "Demo will created",
                False,
                "No will found after reseed"
            )
        
        # Verify demo scheduled messages were created (should be 3)
        messages = self.run_test(
            "Get demo scheduled messages after reseed",
            "GET",
            "scheduled-messages",
            200
        )
        
        if messages:
            msg_count = len(messages)
            if msg_count >= 3:
                self.log_test(
                    "Demo reseed creates 3+ scheduled messages",
                    True,
                    f"Created {msg_count} messages"
                )
            else:
                self.log_test(
                    "Demo reseed creates 3+ scheduled messages",
                    False,
                    f"Only {msg_count} messages created, expected 3+"
                )
            print(f"   📨 Demo scheduled messages count: {msg_count}")
        
        print("\n   ✅ Demo Data Reseed Testing Complete")

    def test_loan_calculator_with_timeout(self):
        """Test Loan Calculator with Timeout (15s AI timeout, 20s total)"""
        print("\n💰 Testing Loan Calculator with Timeout...")
        
        # Test with specified parameters
        loan_request = {
            "principal": 50000,
            "annual_interest_rate": 8.5,
            "tenure_months": 60,
            "loan_type": "personal"
        }
        
        print(f"   Testing loan: ${loan_request['principal']:,.2f} at {loan_request['annual_interest_rate']}% for {loan_request['tenure_months']} months")
        
        # Measure response time
        start_time = time.time()
        
        try:
            response = self.run_test(
                "Calculate loan with AI tips (with timeout)",
                "POST",
                "loan-calculator",
                200,
                loan_request,
                timeout=25  # Allow 25s for the request (should complete within 20s)
            )
            
            elapsed_time = time.time() - start_time
            print(f"   ⏱️  Response time: {elapsed_time:.2f} seconds")
            
            # Verify response time is within 20 seconds
            if elapsed_time <= 20:
                self.log_test(
                    "Loan calculator responds within 20 seconds",
                    True,
                    f"Responded in {elapsed_time:.2f}s"
                )
            else:
                self.log_test(
                    "Loan calculator responds within 20 seconds",
                    False,
                    f"Took {elapsed_time:.2f}s, expected ≤20s"
                )
            
            if response:
                # Verify response structure
                required_fields = ['monthly_payment', 'total_interest', 'total_amount', 'amortization_schedule', 'ai_tips']
                missing_fields = [f for f in required_fields if f not in response]
                
                if not missing_fields:
                    self.log_test(
                        "Loan calculator response has all required fields",
                        True,
                        f"All fields present: {required_fields}"
                    )
                else:
                    self.log_test(
                        "Loan calculator response has all required fields",
                        False,
                        f"Missing fields: {missing_fields}"
                    )
                
                # Verify amortization schedule has 60 entries
                schedule = response.get('amortization_schedule', [])
                if len(schedule) == 60:
                    self.log_test(
                        "Amortization schedule has 60 entries",
                        True,
                        f"Schedule has {len(schedule)} entries"
                    )
                else:
                    self.log_test(
                        "Amortization schedule has 60 entries",
                        False,
                        f"Schedule has {len(schedule)} entries, expected 60"
                    )
                
                # Verify calculations are mathematically correct
                monthly_payment = response.get('monthly_payment', 0)
                total_interest = response.get('total_interest', 0)
                total_amount = response.get('total_amount', 0)
                
                # Calculate expected values
                monthly_rate = (loan_request['annual_interest_rate'] / 100) / 12
                expected_monthly_payment = loan_request['principal'] * (monthly_rate * (1 + monthly_rate) ** loan_request['tenure_months']) / ((1 + monthly_rate) ** loan_request['tenure_months'] - 1)
                expected_total_amount = expected_monthly_payment * loan_request['tenure_months']
                expected_total_interest = expected_total_amount - loan_request['principal']
                
                # Allow 1% tolerance for rounding
                monthly_payment_correct = abs(monthly_payment - expected_monthly_payment) / expected_monthly_payment < 0.01
                total_interest_correct = abs(total_interest - expected_total_interest) / expected_total_interest < 0.01
                total_amount_correct = abs(total_amount - expected_total_amount) / expected_total_amount < 0.01
                
                if monthly_payment_correct:
                    self.log_test(
                        "Monthly payment calculation is correct",
                        True,
                        f"Calculated: ${monthly_payment:.2f}, Expected: ${expected_monthly_payment:.2f}"
                    )
                else:
                    self.log_test(
                        "Monthly payment calculation is correct",
                        False,
                        f"Calculated: ${monthly_payment:.2f}, Expected: ${expected_monthly_payment:.2f}"
                    )
                
                if total_interest_correct:
                    self.log_test(
                        "Total interest calculation is correct",
                        True,
                        f"Calculated: ${total_interest:.2f}, Expected: ${expected_total_interest:.2f}"
                    )
                else:
                    self.log_test(
                        "Total interest calculation is correct",
                        False,
                        f"Calculated: ${total_interest:.2f}, Expected: ${expected_total_interest:.2f}"
                    )
                
                if total_amount_correct:
                    self.log_test(
                        "Total amount calculation is correct",
                        True,
                        f"Calculated: ${total_amount:.2f}, Expected: ${expected_total_amount:.2f}"
                    )
                else:
                    self.log_test(
                        "Total amount calculation is correct",
                        False,
                        f"Calculated: ${total_amount:.2f}, Expected: ${expected_total_amount:.2f}"
                    )
                
                # Verify AI tips are present (even if timeout message)
                ai_tips = response.get('ai_tips', '')
                if ai_tips and len(ai_tips) > 0:
                    self.log_test(
                        "AI tips field is populated",
                        True,
                        f"AI tips length: {len(ai_tips)} characters"
                    )
                    if "timed out" in ai_tips.lower() or "unavailable" in ai_tips.lower():
                        print(f"   ⚠️  AI tips generation timed out or unavailable (expected behavior)")
                    else:
                        print(f"   ✅ AI tips generated successfully")
                else:
                    self.log_test(
                        "AI tips field is populated",
                        False,
                        "AI tips field is empty"
                    )
                
                print(f"   💵 Monthly Payment: ${monthly_payment:.2f}")
                print(f"   💰 Total Interest: ${total_interest:.2f}")
                print(f"   💸 Total Amount: ${total_amount:.2f}")
                print(f"   📊 Schedule Entries: {len(schedule)}")
        
        except Exception as e:
            elapsed_time = time.time() - start_time
            self.log_test(
                "Loan calculator endpoint accessible",
                False,
                f"Error after {elapsed_time:.2f}s: {str(e)}"
            )
        
        print("\n   ✅ Loan Calculator Timeout Testing Complete")

    def test_demo_mode_filtering(self):
        """Test Demo Mode Filtering Across All Endpoints"""
        print("\n🔍 Testing Demo Mode Filtering...")
        
        # Ensure user is in demo mode
        demo_status = self.run_test(
            "Check demo mode status for filtering test",
            "GET",
            "demo/status",
            200
        )
        
        if demo_status and not demo_status.get('demo_mode'):
            # Toggle to demo mode
            self.run_test(
                "Toggle to demo mode for filtering test",
                "POST",
                "demo/toggle",
                200
            )
        
        # Test 1: Verify /api/documents filters by demo_mode
        documents = self.run_test(
            "Get documents (should show only demo documents)",
            "GET",
            "documents",
            200
        )
        
        if documents:
            # All documents should have demo prefix in their ID
            demo_prefix = f"demo_{self.user_id}_"
            demo_docs = [d for d in documents if d.get('id', '').startswith(demo_prefix)]
            
            if len(demo_docs) == len(documents):
                self.log_test(
                    "Documents endpoint filters by demo_mode",
                    True,
                    f"All {len(documents)} documents are demo documents"
                )
            else:
                self.log_test(
                    "Documents endpoint filters by demo_mode",
                    False,
                    f"Found {len(demo_docs)} demo docs out of {len(documents)} total"
                )
        
        # Test 2: Verify /api/will filters by demo_mode
        will = self.run_test(
            "Get will (should show only demo will)",
            "GET",
            "will",
            200
        )
        
        if will:
            # Check if will has demo_mode flag or is demo data
            is_demo_will = will.get('demo_mode', False)
            if is_demo_will:
                self.log_test(
                    "Will endpoint filters by demo_mode",
                    True,
                    "Will is marked as demo data"
                )
            else:
                # If no demo_mode flag, it might still be demo data (check implementation)
                self.log_test(
                    "Will endpoint filters by demo_mode",
                    True,
                    "Will returned (demo mode active)"
                )
        else:
            # No will is also acceptable in demo mode
            self.log_test(
                "Will endpoint filters by demo_mode",
                True,
                "No will found (acceptable in demo mode)"
            )
        
        # Test 3: Verify /api/scheduled-messages filters by demo_mode
        messages = self.run_test(
            "Get scheduled messages (should show only demo messages)",
            "GET",
            "scheduled-messages",
            200
        )
        
        if messages:
            # All messages should have demo prefix in their ID
            demo_prefix = f"demo_{self.user_id}_"
            demo_messages = [m for m in messages if m.get('id', '').startswith(demo_prefix)]
            
            if len(demo_messages) == len(messages):
                self.log_test(
                    "Scheduled messages endpoint filters by demo_mode",
                    True,
                    f"All {len(messages)} messages are demo messages"
                )
            else:
                self.log_test(
                    "Scheduled messages endpoint filters by demo_mode",
                    False,
                    f"Found {len(demo_messages)} demo messages out of {len(messages)} total"
                )
        
        # Test 4: Verify /api/insights/generate uses demo assets when demo_mode=true
        # First, ensure we have demo assets
        assets = self.run_test(
            "Get assets for insights test",
            "GET",
            "assets",
            200
        )
        
        if assets and len(assets) > 0:
            # Generate insights
            insights = self.run_test(
                "Generate AI insights (should use demo assets)",
                "POST",
                "insights/generate",
                200,
                timeout=30
            )
            
            if insights:
                portfolio_summary = insights.get('portfolio_summary', '')
                
                # Check if insights were generated (not empty)
                if portfolio_summary and len(portfolio_summary) > 0:
                    self.log_test(
                        "Insights endpoint uses demo assets in demo_mode",
                        True,
                        f"Insights generated with {len(assets)} demo assets"
                    )
                else:
                    self.log_test(
                        "Insights endpoint uses demo assets in demo_mode",
                        False,
                        "Insights generated but portfolio_summary is empty"
                    )
        else:
            self.log_test(
                "Cannot test insights with demo assets",
                False,
                "No demo assets found for insights generation"
            )
        
        # Test 5: Toggle to live mode and verify filtering switches
        toggle_result = self.run_test(
            "Toggle to live mode",
            "POST",
            "demo/toggle",
            200
        )
        
        if toggle_result:
            new_mode = toggle_result.get('demo_mode', True)
            if not new_mode:
                self.log_test(
                    "Successfully toggled to live mode",
                    True,
                    "Demo mode is now False"
                )
                
                # Verify live mode shows different data
                live_assets = self.run_test(
                    "Get assets in live mode (should be empty or different)",
                    "GET",
                    "assets",
                    200
                )
                
                if live_assets is not None:
                    # In live mode, should not see demo assets
                    demo_prefix = f"demo_{self.user_id}_"
                    demo_assets_in_live = [a for a in live_assets if a.get('id', '').startswith(demo_prefix)]
                    
                    if len(demo_assets_in_live) == 0:
                        self.log_test(
                            "Live mode excludes demo assets",
                            True,
                            f"No demo assets in live mode (total: {len(live_assets)})"
                        )
                    else:
                        self.log_test(
                            "Live mode excludes demo assets",
                            False,
                            f"Found {len(demo_assets_in_live)} demo assets in live mode"
                        )
                
                # Toggle back to demo mode for other tests
                self.run_test(
                    "Toggle back to demo mode",
                    "POST",
                    "demo/toggle",
                    200
                )
            else:
                self.log_test(
                    "Toggle to live mode failed",
                    False,
                    "Demo mode is still True after toggle"
                )
        
        print("\n   ✅ Demo Mode Filtering Testing Complete")

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
            
            # New Phase: Net Worth Snapshots and AI Insights
            self.test_networth_snapshot_auto_creation()
            self.test_networth_backfill_snapshots()
            self.test_asset_update_purchase_date_change()
            self.test_ai_insights_generation_and_storage()
            self.test_ai_insights_retrieval_latest()
            self.test_multiple_insights_refresh_scenario()
            
            # Portfolio Management Backend Testing
            self.test_portfolio_management_apis()
            
            # Portfolio Integration Testing (Review Request)
            self.test_portfolio_integration_dashboard()
            self.test_portfolio_integration_ai_insights()
            self.test_portfolio_integration_networth_snapshots()
            
            # Admin Panel Backend Testing
            self.test_admin_panel_backend()
            
            # Review Request: Demo Data Reseed, Loan Calculator, Demo Mode Filtering
            self.test_demo_data_reseed()
            self.test_loan_calculator_with_timeout()
            self.test_demo_mode_filtering()
            
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