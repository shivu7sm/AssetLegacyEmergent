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
    def __init__(self, base_url="https://asset-manager-137.preview.emergentagent.com"):
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
            
            # New Phase: Net Worth Snapshots and AI Insights
            self.test_networth_snapshot_auto_creation()
            self.test_networth_backfill_snapshots()
            self.test_asset_update_purchase_date_change()
            self.test_ai_insights_generation_and_storage()
            self.test_ai_insights_retrieval_latest()
            self.test_multiple_insights_refresh_scenario()
            
            # Admin Panel Backend Testing
            self.test_admin_panel_backend()
            
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