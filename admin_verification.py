#!/usr/bin/env python3
"""
Admin Panel Verification - Simple test to verify all admin endpoints work
"""

import requests
import json
import time

def test_admin_endpoints():
    base_url = "https://legacy-asset-dev.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Create admin user
    timestamp = int(time.time())
    admin_user_id = f"admin-verify-{timestamp}"
    admin_session_token = f"admin_verify_session_{timestamp}"
    
    mongo_commands = f"""
use('test_database');
var adminUserId = '{admin_user_id}';
var adminSessionToken = '{admin_session_token}';
var expiresAt = new Date(Date.now() + 7*24*60*60*1000);

// Create admin user
db.users.insertOne({{
  id: adminUserId,
  email: 'shivu7sm@gmail.com',
  name: 'Admin Verification User',
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

print('Admin user created for verification');
"""
    
    import subprocess
    result = subprocess.run(
        ['mongosh', '--eval', mongo_commands],
        capture_output=True,
        text=True,
        timeout=30
    )
    
    if result.returncode != 0:
        print(f"❌ Failed to create admin user: {result.stderr}")
        return
    
    print(f"✅ Admin user created: {admin_user_id}")
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {admin_session_token}'
    }
    
    # Test all admin endpoints
    endpoints = [
        ("GET", "auth/me", "Admin user profile"),
        ("GET", "admin/stats", "Admin statistics dashboard"),
        ("GET", "admin/users?skip=0&limit=10", "List all users"),
        ("GET", "admin/jobs/scheduled-messages", "Scheduled messages status"),
        ("GET", "admin/jobs/dms-reminders", "DMS reminders monitoring"),
    ]
    
    print("\n🛡️ Testing Admin Panel Endpoints:")
    print("=" * 50)
    
    for method, endpoint, description in endpoints:
        try:
            url = f"{api_url}/{endpoint}"
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ {description}")
                
                # Show sample data for key endpoints
                if endpoint == "admin/stats":
                    data = response.json()
                    print(f"   Users: {data.get('users', {}).get('total', 0)}")
                    print(f"   Assets: {data.get('assets', {}).get('total', 0)}")
                    print(f"   Scheduled Messages: {data.get('scheduled_messages', {}).get('total', 0)}")
                    print(f"   Dead Man Switches: {data.get('dead_man_switches', {}).get('total', 0)}")
                    print(f"   AI Insights: {data.get('ai_insights', {}).get('total_generated', 0)}")
                
                elif endpoint.startswith("admin/users"):
                    data = response.json()
                    users = data.get('users', [])
                    print(f"   Found {len(users)} users (Total: {data.get('total', 0)})")
                    if users:
                        first_user = users[0]
                        print(f"   Sample user: {first_user.get('name')} ({first_user.get('email')}) - Role: {first_user.get('role', 'N/A')}")
                
                elif endpoint == "admin/jobs/scheduled-messages":
                    data = response.json()
                    messages = data.get('messages', [])
                    print(f"   Found {len(messages)} scheduled messages (Total: {data.get('total', 0)})")
                
                elif endpoint == "admin/jobs/dms-reminders":
                    data = response.json()
                    dms_list = data.get('dms_reminders', [])
                    print(f"   Found {len(dms_list)} DMS configurations (Total: {data.get('total', 0)})")
                
            else:
                print(f"❌ {description} - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:100]}")
                    
        except Exception as e:
            print(f"❌ {description} - Error: {str(e)}")
    
    # Test role update functionality
    print(f"\n🔄 Testing Role Update:")
    
    # Create a test user to update
    test_user_id = f"role-test-{timestamp}"
    test_user_commands = f"""
use('test_database');
db.users.insertOne({{
  id: '{test_user_id}',
  email: 'roletest.{timestamp}@example.com',
  name: 'Role Test User',
  role: 'user',
  subscription_plan: 'Free',
  last_activity: new Date(),
  created_at: new Date()
}});
print('Test user created for role update');
"""
    
    subprocess.run(['mongosh', '--eval', test_user_commands], timeout=30)
    
    # Test role update
    try:
        url = f"{api_url}/admin/users/{test_user_id}/role"
        response = requests.put(url, json={"role": "readonly"}, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print("✅ Role update to readonly successful")
        else:
            print(f"❌ Role update failed - Status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Role update error: {str(e)}")
    
    # Test user deletion
    print(f"\n🗑️ Testing User Deletion:")
    try:
        url = f"{api_url}/admin/users/{test_user_id}"
        response = requests.delete(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print("✅ User deletion successful")
        else:
            print(f"❌ User deletion failed - Status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ User deletion error: {str(e)}")
    
    # Cleanup
    cleanup_commands = f"""
use('test_database');
db.users.deleteOne({{id: '{admin_user_id}'}});
db.user_sessions.deleteOne({{user_id: '{admin_user_id}'}});
db.users.deleteOne({{id: '{test_user_id}'}});
print('Cleanup completed');
"""
    
    subprocess.run(['mongosh', '--eval', cleanup_commands], timeout=30)
    print("\n✅ Cleanup completed")

if __name__ == "__main__":
    test_admin_endpoints()