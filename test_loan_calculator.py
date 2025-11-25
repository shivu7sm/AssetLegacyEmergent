#!/usr/bin/env python3
"""
Loan Calculator API Testing Script
Tests the new loan calculator endpoint with comprehensive scenarios
"""

import sys
import os

# Add parent directory to path to import backend_test
sys.path.insert(0, '/app')

from backend_test import AssetManagementAPITester

def main():
    """Run only the loan calculator tests"""
    print("🚀 Starting Loan Calculator API Tests")
    print("=" * 60)
    
    tester = AssetManagementAPITester()
    
    # Create test user and session
    if not tester.create_test_user():
        print("❌ Failed to create test user. Cannot proceed with tests.")
        return 1
    
    try:
        # Run only the loan calculator test
        tester.test_loan_calculator_endpoint()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {tester.tests_passed}/{tester.tests_run} tests passed")
        
        success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate < 80:
            print("⚠️  Warning: Low success rate detected")
        else:
            print("✅ All loan calculator tests passed successfully!")
        
        return 0 if success_rate >= 80 else 1
        
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        # Cleanup test user
        tester.cleanup_test_data()

if __name__ == "__main__":
    sys.exit(main())
