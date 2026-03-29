import requests
import sys
import json
from datetime import datetime, timedelta

class CrediControlAPITester:
    def __init__(self, base_url="https://credito-admin.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.admin_cookies = None
        self.user_cookies = None
        self.test_user_id = None
        self.test_customer_id = None
        self.test_loan_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "details": details})

    def make_request(self, method, endpoint, data=None, cookies=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, cookies=cookies)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, cookies=cookies)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, cookies=cookies)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, cookies=cookies)
            
            success = response.status_code == expected_status
            return success, response
        except Exception as e:
            return False, str(e)

    def test_admin_login(self):
        """Test admin login functionality"""
        print("\n🔐 Testing Admin Authentication...")
        
        # Test admin login
        success, response = self.make_request(
            'POST', 
            'auth/login',
            data={"email": "emersonthiago257@gmail.com", "password": "123456"},
            expected_status=200
        )
        
        if success:
            data = response.json()
            if data.get('role') == 'admin':
                self.admin_cookies = response.cookies
                self.log_test("Admin login", True)
                return True
            else:
                self.log_test("Admin login", False, f"Expected admin role, got {data.get('role')}")
        else:
            self.log_test("Admin login", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
        
        return False

    def test_admin_stats(self):
        """Test admin statistics endpoint"""
        if not self.admin_cookies:
            self.log_test("Admin stats", False, "No admin session")
            return False
            
        success, response = self.make_request(
            'GET',
            'admin/stats',
            cookies=self.admin_cookies,
            expected_status=200
        )
        
        if success:
            data = response.json()
            required_fields = ['total_users', 'total_loans', 'total_amount']
            if all(field in data for field in required_fields):
                self.log_test("Admin stats", True)
                return True
            else:
                self.log_test("Admin stats", False, f"Missing fields in response: {data}")
        else:
            self.log_test("Admin stats", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
        
        return False

    def test_admin_users_list(self):
        """Test admin users list endpoint"""
        if not self.admin_cookies:
            self.log_test("Admin users list", False, "No admin session")
            return False
            
        success, response = self.make_request(
            'GET',
            'admin/users',
            cookies=self.admin_cookies,
            expected_status=200
        )
        
        if success:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Admin users list", True)
                return True
            else:
                self.log_test("Admin users list", False, f"Expected list, got: {type(data)}")
        else:
            self.log_test("Admin users list", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
        
        return False

    def test_user_registration(self):
        """Test user registration"""
        print("\n👤 Testing User Registration...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"testuser{timestamp}@test.com"
        
        success, response = self.make_request(
            'POST',
            'auth/register',
            data={
                "name": f"Test User {timestamp}",
                "email": test_email,
                "password": "testpass123"
            },
            expected_status=200
        )
        
        if success:
            data = response.json()
            if data.get('role') == 'user':
                self.user_cookies = response.cookies
                self.test_user_id = data.get('id')
                self.log_test("User registration", True)
                return True
            else:
                self.log_test("User registration", False, f"Expected user role, got {data.get('role')}")
        else:
            self.log_test("User registration", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
        
        return False

    def test_user_dashboard(self):
        """Test user dashboard endpoint"""
        if not self.user_cookies:
            self.log_test("User dashboard", False, "No user session")
            return False
            
        success, response = self.make_request(
            'GET',
            'dashboard',
            cookies=self.user_cookies,
            expected_status=200
        )
        
        if success:
            data = response.json()
            required_fields = ['total_loaned', 'total_received', 'total_pending', 'customers_count', 'loans_count']
            if all(field in data for field in required_fields):
                self.log_test("User dashboard", True)
                return True
            else:
                self.log_test("User dashboard", False, f"Missing fields in response: {data}")
        else:
            self.log_test("User dashboard", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
        
        return False

    def test_customer_crud(self):
        """Test customer CRUD operations"""
        print("\n👥 Testing Customer Management...")
        
        if not self.user_cookies:
            self.log_test("Customer CRUD", False, "No user session")
            return False

        # Create customer
        success, response = self.make_request(
            'POST',
            'customers',
            data={
                "name": "João Silva",
                "phone": "(11) 99999-9999",
                "document": "123.456.789-00",
                "notes": "Cliente teste"
            },
            cookies=self.user_cookies,
            expected_status=200
        )
        
        if success:
            customer_data = response.json()
            self.test_customer_id = customer_data.get('id')
            self.log_test("Create customer", True)
        else:
            self.log_test("Create customer", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
            return False

        # List customers
        success, response = self.make_request(
            'GET',
            'customers',
            cookies=self.user_cookies,
            expected_status=200
        )
        
        if success:
            customers = response.json()
            if isinstance(customers, list) and len(customers) > 0:
                self.log_test("List customers", True)
            else:
                self.log_test("List customers", False, "No customers found")
        else:
            self.log_test("List customers", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

        # Get specific customer
        if self.test_customer_id:
            success, response = self.make_request(
                'GET',
                f'customers/{self.test_customer_id}',
                cookies=self.user_cookies,
                expected_status=200
            )
            
            if success:
                self.log_test("Get customer", True)
            else:
                self.log_test("Get customer", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

            # Update customer
            success, response = self.make_request(
                'PUT',
                f'customers/{self.test_customer_id}',
                data={"name": "João Silva Updated"},
                cookies=self.user_cookies,
                expected_status=200
            )
            
            if success:
                self.log_test("Update customer", True)
            else:
                self.log_test("Update customer", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

        return True

    def test_loan_management(self):
        """Test loan creation and management"""
        print("\n💰 Testing Loan Management...")
        
        if not self.user_cookies or not self.test_customer_id:
            self.log_test("Loan management", False, "No user session or customer")
            return False

        # Create loan
        start_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        success, response = self.make_request(
            'POST',
            'loans',
            data={
                "customer_id": self.test_customer_id,
                "amount": 1000.0,
                "interest_rate": 10.0,
                "number_of_installments": 12,
                "start_date": start_date,
                "interval_days": 30
            },
            cookies=self.user_cookies,
            expected_status=200
        )
        
        if success:
            loan_data = response.json()
            self.test_loan_id = loan_data.get('id')
            # Check if total_amount is calculated correctly (1000 + 10% = 1100)
            expected_total = 1100.0
            if abs(loan_data.get('total_amount', 0) - expected_total) < 0.01:
                self.log_test("Create loan with interest calculation", True)
            else:
                self.log_test("Create loan with interest calculation", False, f"Expected {expected_total}, got {loan_data.get('total_amount')}")
        else:
            self.log_test("Create loan", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
            return False

        # List loans
        success, response = self.make_request(
            'GET',
            'loans',
            cookies=self.user_cookies,
            expected_status=200
        )
        
        if success:
            loans = response.json()
            if isinstance(loans, list) and len(loans) > 0:
                self.log_test("List loans", True)
            else:
                self.log_test("List loans", False, "No loans found")
        else:
            self.log_test("List loans", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

        # Get specific loan
        if self.test_loan_id:
            success, response = self.make_request(
                'GET',
                f'loans/{self.test_loan_id}',
                cookies=self.user_cookies,
                expected_status=200
            )
            
            if success:
                self.log_test("Get loan details", True)
            else:
                self.log_test("Get loan details", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

        return True

    def test_installments_and_payments(self):
        """Test installments and payment functionality"""
        print("\n📅 Testing Installments and Payments...")
        
        if not self.user_cookies or not self.test_loan_id:
            self.log_test("Installments test", False, "No user session or loan")
            return False

        # Get installments for loan
        success, response = self.make_request(
            'GET',
            f'installments/loan/{self.test_loan_id}',
            cookies=self.user_cookies,
            expected_status=200
        )
        
        if success:
            installments = response.json()
            if isinstance(installments, list) and len(installments) == 12:  # Should have 12 installments
                self.log_test("Get loan installments", True)
                
                # Test payment on first installment
                first_installment = installments[0]
                installment_id = first_installment.get('id')
                
                if installment_id:
                    success, response = self.make_request(
                        'POST',
                        f'installments/{installment_id}/pay',
                        cookies=self.user_cookies,
                        expected_status=200
                    )
                    
                    if success:
                        self.log_test("Register installment payment", True)
                    else:
                        self.log_test("Register installment payment", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
                
            else:
                self.log_test("Get loan installments", False, f"Expected 12 installments, got {len(installments) if isinstance(installments, list) else 'invalid response'}")
        else:
            self.log_test("Get loan installments", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

        return True

    def test_access_control(self):
        """Test role-based access control"""
        print("\n🔒 Testing Access Control...")
        
        # Test admin accessing user endpoints (should fail)
        if self.admin_cookies:
            success, response = self.make_request(
                'GET',
                'dashboard',
                cookies=self.admin_cookies,
                expected_status=403
            )
            
            if success:
                self.log_test("Admin blocked from user dashboard", True)
            else:
                self.log_test("Admin blocked from user dashboard", False, f"Admin should not access user dashboard")

        # Test user accessing admin endpoints (should fail)
        if self.user_cookies:
            success, response = self.make_request(
                'GET',
                'admin/stats',
                cookies=self.user_cookies,
                expected_status=403
            )
            
            if success:
                self.log_test("User blocked from admin stats", True)
            else:
                self.log_test("User blocked from admin stats", False, f"User should not access admin endpoints")

        return True

    def test_logout(self):
        """Test logout functionality"""
        print("\n🚪 Testing Logout...")
        
        # Test admin logout
        if self.admin_cookies:
            success, response = self.make_request(
                'POST',
                'auth/logout',
                cookies=self.admin_cookies,
                expected_status=200
            )
            
            if success:
                self.log_test("Admin logout", True)
                # Test that admin can't access protected endpoints after logout
                success, response = self.make_request(
                    'GET',
                    'admin/stats',
                    cookies=self.admin_cookies,
                    expected_status=401
                )
                if success:
                    self.log_test("Admin session invalidated after logout", True)
                else:
                    self.log_test("Admin session invalidated after logout", False, "Session still active after logout")
            else:
                self.log_test("Admin logout", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

        # Test user logout
        if self.user_cookies:
            success, response = self.make_request(
                'POST',
                'auth/logout',
                cookies=self.user_cookies,
                expected_status=200
            )
            
            if success:
                self.log_test("User logout", True)
            else:
                self.log_test("User logout", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting CrediControl API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test admin functionality
        if self.test_admin_login():
            self.test_admin_stats()
            self.test_admin_users_list()
        
        # Test user functionality
        if self.test_user_registration():
            self.test_user_dashboard()
            self.test_customer_crud()
            if self.test_loan_management():
                self.test_installments_and_payments()
        
        # Test access control
        self.test_access_control()
        
        # Test logout
        self.test_logout()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CrediControlAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())