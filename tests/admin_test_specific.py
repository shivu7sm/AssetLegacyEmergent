#!/usr/bin/env python3
"""
Specific Admin Panel Backend Testing
Tests the admin panel features specifically as requested
"""

import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import time

class AdminPanelTester:
    def __init__(self, base_url="https://wealth-tracker-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_session_token = None
        self.admin_user_id = None
        self.regular_session_token = None
        self.regular_user_id = None
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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, session_token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Use provided session token or default admin token
        token = session_token or self.admin_session_token
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        
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

    def create_admin_user(self):
        """Create admin user for testing"""
        print("\n🔧 Creating admin user...")
        
        timestamp = int(time.time())
        self.admin_user_id = f"admin-test-{timestamp}"
        self.admin_session_token = f"admin_session_{timestamp}"
        
        mongo_commands = f"""
use('test_database');
var adminUserId = '{self.admin_user_id}';
var adminSessionToken = '{self.admin_session_token}';
var expiresAt = new Date(Date.now() + 7*24*60*60*1000);

// Create admin user
db.users.insertOne({{
  id: adminUserId,
  email: 'shivu7sm@gmail.com',
  name: 'Admin Test User',
  picture: 'https://via.placeholder.com/150',
  role: 'admin',
  subscription_plan: 'Pro',
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

print('Admin user created successfully');
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
                return True
            else:
                print(f"❌ Failed to create admin user: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating admin user: {str(e)}")
            return False

    def create_regular_user(self):
        """Create regular user for testing"""
        print("\n🔧 Creating regular user...")
        
        timestamp = int(time.time())
        self.regular_user_id = f"regular-test-{timestamp}"
        self.regular_session_token = f"regular_session_{timestamp}"
        
        mongo_commands = f"""
use('test_database');
var regularUserId = '{self.regular_user_id}';
var regularSessionToken = '{self.regular_session_token}';
var expiresAt = new Date(Date.now() + 7*24*60*60*1000);

// Create regular user
db.users.insertOne({{
  id: regularUserId,
  email: 'regular.test.{timestamp}@example.com',
  name: 'Regular Test User',
  picture: 'https://via.placeholder.com/150',
  role: 'user',
  subscription_plan: 'Free',
  last_activity: new Date(),
  created_at: new Date()
}});

// Create regular session
db.user_sessions.insertOne({{
  user_id: regularUserId,
  session_token: regularSessionToken,
  expires_at: expiresAt,
  created_at: new Date()
}});

// Create some test data for this user
db.assets.insertOne({{
  id: 'test-asset-' + regularUserId,
  user_id: regularUserId,
  type: 'bank',
  name: 'Test Bank Account',
  total_value: 5000,
  purchase_currency: 'USD',
  created_at: new Date(),
  updated_at: new Date()
}});

db.scheduled_messages.insertOne({{
  id: 'test-message-' + regularUserId,
  user_id: regularUserId,
  recipient_name: 'Test Recipient',
  recipient_email: 'test@example.com',
  subject: 'Test Message',
  message: 'This is a test message',
  send_date: '2024-12-25',
  status: 'scheduled',
  created_at: new Date()
}});

db.dead_man_switches.insertOne({{
  id: 'test-dms-' + regularUserId,
  user_id: regularUserId,
  inactivity_days: 90,
  reminder_1_days: 60,
  reminder_2_days: 75,
  reminder_3_days: 85,
  is_active: true,
  last_reset: new Date(),
  reminders_sent: 0,
  created_at: new Date()
}});

print('Regular user with test data created successfully');
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
                print(f"✅ Regular user created: {self.regular_user_id}")
                return True
            else:
                print(f"❌ Failed to create regular user: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating regular user: {str(e)}")
            return False

    def test_admin_role_assignment(self):
        """Test 1: Admin Role Assignment"""
        print("\n👑 Test 1: Admin Role Assignment")
        
        user_data = self.run_test(
            "Get admin user profile (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        
        if user_data:
            user_role = user_data.get('role')
            user_email = user_data.get('email')
            
            print(f"   User: {user_data.get('name')} ({user_email})")
            print(f"   Role: {user_role}")
            
            if user_email == 'shivu7sm@gmail.com' and user_role == 'admin':
                print("   ✅ Admin role correctly assigned to shivu7sm@gmail.com")
                return True
            else:
                print(f"   ❌ Expected shivu7sm@gmail.com with admin role, got {user_email} with {user_role}")
                return False
        return False

    def test_admin_authorization_middleware(self):
        """Test 2: Admin Authorization Middleware"""
        print("\n🔒 Test 2: Admin Authorization Middleware")
        
        # Test with non-admin user (should get 403)
        result1 = self.run_test(
            "Non-admin user accessing admin endpoint (should fail)",
            "GET",
            "admin/stats",
            403,
            session_token=self.regular_session_token
        )
        
        # Test with admin user (should work)
        result2 = self.run_test(
            "Admin user accessing admin endpoint (should work)",
            "GET",
            "admin/stats",
            200
        )
        
        return result1 is None and result2 is not None

    def test_admin_statistics_dashboard(self):
        """Test 3: Admin Statistics Dashboard"""
        print("\n📊 Test 3: Admin Statistics Dashboard")
        
        stats = self.run_test(
            "Get admin statistics dashboard",
            "GET",
            "admin/stats",
            200
        )
        
        if stats:
            print("   📈 Statistics Response:")
            print(f"   Users: {json.dumps(stats.get('users', {}), indent=4)}")
            print(f"   Assets: {json.dumps(stats.get('assets', {}), indent=4)}")
            print(f"   Scheduled Messages: {json.dumps(stats.get('scheduled_messages', {}), indent=4)}")
            print(f"   Dead Man Switches: {json.dumps(stats.get('dead_man_switches', {}), indent=4)}")
            print(f"   AI Insights: {json.dumps(stats.get('ai_insights', {}), indent=4)}")
            
            # Verify required fields
            required_sections = ['users', 'assets', 'scheduled_messages', 'dead_man_switches', 'ai_insights']
            missing_sections = [s for s in required_sections if s not in stats]
            
            if not missing_sections:
                print("   ✅ All required statistics sections present")
                
                # Verify users section structure
                users_section = stats.get('users', {})
                if 'total' in users_section and 'recent_30_days' in users_section and 'by_subscription' in users_section:
                    print("   ✅ Users section has correct structure")
                else:
                    print("   ❌ Users section missing required fields")
                    return False
                
                return True
            else:
                print(f"   ❌ Missing statistics sections: {missing_sections}")
                return False
        return False

    def test_list_all_users(self):
        """Test 4: List All Users"""
        print("\n👥 Test 4: List All Users")
        
        users_response = self.run_test(
            "Get all users list",
            "GET",
            "admin/users?skip=0&limit=50",
            200
        )
        
        if users_response:
            print("   👤 Users Response Structure:")
            print(f"   Total: {users_response.get('total', 0)}")
            print(f"   Skip: {users_response.get('skip', 0)}")
            print(f"   Limit: {users_response.get('limit', 0)}")
            print(f"   Users Count: {len(users_response.get('users', []))}")
            
            users = users_response.get('users', [])
            if users:
                print("   First User Fields:")
                first_user = users[0]
                for key, value in first_user.items():
                    if key not in ['last_activity', 'created_at']:  # Skip datetime fields for readability
                        print(f"     {key}: {value}")
                
                # Verify required fields
                required_fields = ['id', 'email', 'name', 'role', 'subscription_plan', 'created_at', 'asset_count']
                missing_fields = [f for f in required_fields if f not in first_user]
                
                if not missing_fields:
                    print("   ✅ User objects have all required fields")
                    return True
                else:
                    print(f"   ❌ Missing user fields: {missing_fields}")
                    return False
            else:
                print("   ❌ No users returned")
                return False
        return False

    def test_update_user_role(self):
        """Test 5: Update User Role"""
        print("\n🔄 Test 5: Update User Role")
        
        # Test updating regular user role to readonly
        result1 = self.run_test(
            "Update regular user role to readonly",
            "PUT",
            f"admin/users/{self.regular_user_id}/role",
            200,
            {"role": "readonly"}
        )
        
        # Test updating back to user
        result2 = self.run_test(
            "Update user role back to user",
            "PUT",
            f"admin/users/{self.regular_user_id}/role",
            200,
            {"role": "user"}
        )
        
        # Test invalid role (should fail)
        result3 = self.run_test(
            "Update user role to invalid role (should fail)",
            "PUT",
            f"admin/users/{self.regular_user_id}/role",
            400,
            {"role": "invalid_role"}
        )
        
        # Test admin trying to update own role (should fail)
        result4 = self.run_test(
            "Admin trying to update own role (should fail)",
            "PUT",
            f"admin/users/{self.admin_user_id}/role",
            400,
            {"role": "user"}
        )
        
        success_count = sum([1 for r in [result1, result2] if r is not None])
        fail_count = sum([1 for r in [result3, result4] if r is None])
        
        if success_count == 2 and fail_count == 2:
            print("   ✅ All role update tests passed")
            return True
        else:
            print(f"   ❌ Role update tests failed: {success_count}/2 successes, {fail_count}/2 expected failures")
            return False

    def test_scheduled_messages_status(self):
        """Test 6: Scheduled Messages Status"""
        print("\n📅 Test 6: Scheduled Messages Status")
        
        messages_response = self.run_test(
            "Get scheduled messages status",
            "GET",
            "admin/jobs/scheduled-messages",
            200
        )
        
        if messages_response:
            print("   📨 Scheduled Messages Response:")
            print(f"   Total: {messages_response.get('total', 0)}")
            print(f"   Messages Count: {len(messages_response.get('messages', []))}")
            
            messages = messages_response.get('messages', [])
            if messages:
                print("   First Message Fields:")
                first_message = messages[0]
                for key, value in first_message.items():
                    if key not in ['created_at']:  # Skip datetime fields for readability
                        print(f"     {key}: {value}")
                
                # Verify required fields
                required_fields = ['id', 'user_id', 'recipient_name', 'recipient_email', 'subject', 'send_date', 'status', 'created_at']
                missing_fields = [f for f in required_fields if f not in first_message]
                
                if not missing_fields:
                    print("   ✅ Message objects have all required fields")
                    return True
                else:
                    print(f"   ❌ Missing message fields: {missing_fields}")
                    return False
            else:
                print("   ⚠️  No scheduled messages found (this is okay)")
                return True
        return False

    def test_dms_reminders_monitoring(self):
        """Test 7: DMS Reminders Monitoring"""
        print("\n⏰ Test 7: DMS Reminders Monitoring")
        
        dms_response = self.run_test(
            "Get DMS reminders status",
            "GET",
            "admin/jobs/dms-reminders",
            200
        )
        
        if dms_response:
            print("   ⏰ DMS Reminders Response:")
            print(f"   Total: {dms_response.get('total', 0)}")
            print(f"   DMS Count: {len(dms_response.get('dms_reminders', []))}")
            
            dms_reminders = dms_response.get('dms_reminders', [])
            if dms_reminders:
                print("   First DMS Fields:")
                first_dms = dms_reminders[0]
                for key, value in first_dms.items():
                    print(f"     {key}: {value}")
                
                # Verify required fields
                required_fields = ['id', 'user_id', 'user_email', 'user_name', 'days_inactive', 'days_until_trigger', 'reminders_sent', 'is_active']
                missing_fields = [f for f in required_fields if f not in first_dms]
                
                if not missing_fields:
                    print("   ✅ DMS objects have all required fields")
                    return True
                else:
                    print(f"   ❌ Missing DMS fields: {missing_fields}")
                    return False
            else:
                print("   ⚠️  No DMS configurations found (this is okay)")
                return True
        return False

    def test_delete_user(self):
        """Test 8: Delete User (Comprehensive Cleanup)"""
        print("\n🗑️ Test 8: Delete User")
        
        # Create a test user specifically for deletion
        timestamp = int(time.time())
        delete_test_user_id = f"delete-test-{timestamp}"
        
        mongo_commands = f"""
use('test_database');
var deleteUserId = '{delete_test_user_id}';

// Create test user with associated data
db.users.insertOne({{
  id: deleteUserId,
  email: 'delete.test.{timestamp}@example.com',
  name: 'Delete Test User',
  role: 'user',
  subscription_plan: 'Free',
  last_activity: new Date(),
  created_at: new Date()
}});

// Create associated data
db.assets.insertOne({{
  id: 'asset-' + deleteUserId,
  user_id: deleteUserId,
  type: 'bank',
  name: 'Test Asset for Deletion',
  total_value: 1000,
  purchase_currency: 'USD',
  created_at: new Date(),
  updated_at: new Date()
}});

db.nominees.insertOne({{
  id: 'nominee-' + deleteUserId,
  user_id: deleteUserId,
  name: 'Test Nominee',
  email: 'nominee@example.com',
  created_at: new Date()
}});

print('Test user created for deletion test');
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
                print(f"   ✅ Test user created for deletion: {delete_test_user_id}")
                
                # Test admin trying to delete own account (should fail)
                result1 = self.run_test(
                    "Admin trying to delete own account (should fail)",
                    "DELETE",
                    f"admin/users/{self.admin_user_id}",
                    400
                )
                
                # Test deleting the test user (should work)
                result2 = self.run_test(
                    "Delete test user and all associated data",
                    "DELETE",
                    f"admin/users/{delete_test_user_id}",
                    200
                )
                
                if result1 is None and result2 is not None:
                    # Verify deletion was comprehensive
                    verification_commands = f"""
use('test_database');
var deleteUserId = '{delete_test_user_id}';

var userCount = db.users.countDocuments({{id: deleteUserId}});
var assetCount = db.assets.countDocuments({{user_id: deleteUserId}});
var nomineeCount = db.nominees.countDocuments({{user_id: deleteUserId}});

print('Verification - User: ' + userCount + ', Assets: ' + assetCount + ', Nominees: ' + nomineeCount);

if (userCount === 0 && assetCount === 0 && nomineeCount === 0) {{
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
                        print("   ✅ User deletion removes all associated data")
                        return True
                    else:
                        print(f"   ❌ Some data may remain: {verification_result.stdout}")
                        return False
                else:
                    print("   ❌ Delete user test failed")
                    return False
            else:
                print(f"   ❌ Failed to create test user for deletion: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error in delete user test: {str(e)}")
            return False

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        cleanup_commands = f"""
use('test_database');
db.users.deleteOne({{id: '{self.admin_user_id}'}});
db.user_sessions.deleteOne({{user_id: '{self.admin_user_id}'}});
db.users.deleteOne({{id: '{self.regular_user_id}'}});
db.user_sessions.deleteOne({{user_id: '{self.regular_user_id}'}});
db.assets.deleteMany({{user_id: '{self.regular_user_id}'}});
db.scheduled_messages.deleteMany({{user_id: '{self.regular_user_id}'}});
db.dead_man_switches.deleteMany({{user_id: '{self.regular_user_id}'}});
print('Test data cleaned up');
"""
        
        try:
            import subprocess
            subprocess.run(['mongosh', '--eval', cleanup_commands], timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")

    def run_admin_panel_tests(self):
        """Run all admin panel tests"""
        print("🛡️ Starting Admin Panel Backend Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Create test users
        if not self.create_admin_user():
            print("❌ Failed to create admin user. Cannot proceed.")
            return False
        
        if not self.create_regular_user():
            print("❌ Failed to create regular user. Cannot proceed.")
            return False
        
        try:
            # Run all admin panel tests
            test_results = []
            test_results.append(self.test_admin_role_assignment())
            test_results.append(self.test_admin_authorization_middleware())
            test_results.append(self.test_admin_statistics_dashboard())
            test_results.append(self.test_list_all_users())
            test_results.append(self.test_update_user_role())
            test_results.append(self.test_scheduled_messages_status())
            test_results.append(self.test_dms_reminders_monitoring())
            test_results.append(self.test_delete_user())
            
            passed_tests = sum(test_results)
            total_tests = len(test_results)
            
            print("\n" + "=" * 60)
            print(f"📊 Admin Panel Test Summary: {passed_tests}/{total_tests} tests passed")
            print(f"📈 Success Rate: {(passed_tests/total_tests*100):.1f}%")
            
            if passed_tests == total_tests:
                print("🎉 All admin panel tests passed!")
                return True
            else:
                print("⚠️  Some admin panel tests failed")
                return False
            
        finally:
            self.cleanup_test_data()

def main():
    """Main test execution"""
    tester = AdminPanelTester()
    
    try:
        success = tester.run_admin_panel_tests()
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())