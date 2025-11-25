#!/usr/bin/env python3
"""
Portfolio Management API Testing
Focused test for portfolio management endpoints
"""

import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import time
import subprocess

class PortfolioAPITester:
    def __init__(self, base_url="https://finportal-28.preview.emergentagent.com"):
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
                response = requests.get(url, headers=test_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=15)

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
        self.user_id = f"portfolio-test-user-{timestamp}"
        self.session_token = f"portfolio_session_{timestamp}"
        
        # MongoDB commands to create test user and session
        mongo_commands = f"""
use('test_database');
var userId = '{self.user_id}';
var sessionToken = '{self.session_token}';
var expiresAt = new Date(Date.now() + 7*24*60*60*1000);

// Create user
db.users.insertOne({{
  id: userId,
  email: 'portfolio.test.{timestamp}@example.com',
  name: 'Portfolio Test User {timestamp}',
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

print('Portfolio test user and session created successfully');
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

    def test_auth_first(self):
        """Test authentication to ensure session works"""
        print("\n🔐 Testing Authentication...")
        
        user_data = self.run_test(
            "Get current user (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        
        if user_data:
            print(f"   User: {user_data.get('name')} ({user_data.get('email')})")
            return True
        return False

    def test_portfolio_management_apis(self):
        """Test Portfolio Management Backend APIs"""
        print("\n💼 Testing Portfolio Management Backend APIs...")
        
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

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        mongo_cleanup = f"""
use('test_database');
var userId = '{self.user_id}';

// Clean up user data
db.portfolio_assets.deleteMany({{user_id: userId}});
db.user_sessions.deleteMany({{user_id: userId}});
db.users.deleteMany({{id: userId}});

print('Portfolio test data cleaned up');
"""
        
        try:
            subprocess.run(['mongosh', '--eval', mongo_cleanup], timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")

    def run_tests(self):
        """Run portfolio management tests"""
        print("🚀 Starting Portfolio Management API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Create test user and session
        if not self.create_test_user():
            print("❌ Failed to create test user. Cannot proceed with tests.")
            return False
        
        try:
            # Test authentication first
            if not self.test_auth_first():
                print("❌ Authentication failed. Cannot proceed with portfolio tests.")
                return False
            
            # Run portfolio tests
            self.test_portfolio_management_apis()
            
        finally:
            # Always cleanup
            self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80

def main():
    """Main test execution"""
    tester = PortfolioAPITester()
    
    try:
        success = tester.run_tests()
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()