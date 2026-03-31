"""
CrediControl API Tests - Supabase PostgreSQL Backend
Tests all CRUD operations and authentication flows
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "emersonthiago257@gmail.com"
ADMIN_PASSWORD = "123456"
USER_EMAIL = "teste2@teste.com"
USER_PASSWORD = "123456"


class TestHealthAndRoot:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint returns version info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "CrediControl" in data["message"]
        assert "version" in data
        print(f"✓ API root: {data}")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data["role"] == "admin"
        assert data["email"] == ADMIN_EMAIL
        assert "id" in data
        print(f"✓ Admin login successful: {data['email']}, role: {data['role']}")
        
        # Verify cookies are set
        assert "access_token" in session.cookies or response.cookies.get("access_token")
        print("✓ Auth cookies set correctly")
    
    def test_user_login_success(self):
        """Test user login with valid credentials"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data["role"] == "user"
        assert data["email"] == USER_EMAIL
        print(f"✓ User login successful: {data['email']}, role: {data['role']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")
    
    def test_auth_me_without_token(self):
        """Test /auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Unauthenticated /auth/me correctly returns 401")
    
    def test_auth_me_with_session(self):
        """Test /auth/me with valid session"""
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert login_response.status_code == 200
        
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        data = me_response.json()
        assert data["email"] == USER_EMAIL
        print(f"✓ /auth/me returns correct user: {data['email']}")
    
    def test_logout(self):
        """Test logout clears session"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        
        logout_response = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200
        print("✓ Logout successful")


class TestAdminEndpoints:
    """Admin-only endpoint tests"""
    
    @pytest.fixture
    def admin_session(self):
        """Create authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return session
    
    def test_admin_stats(self, admin_session):
        """Test admin stats endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_loans" in data
        assert "total_amount" in data
        print(f"✓ Admin stats: {data['total_users']} users, {data['total_loans']} loans")
    
    def test_admin_list_users(self, admin_session):
        """Test admin list users endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin users list: {len(data)} users")
        
        # Verify user structure
        if len(data) > 0:
            user = data[0]
            assert "id" in user
            assert "name" in user
            assert "email" in user
            assert "role" in user
            print(f"✓ User structure verified: {user['email']}")
    
    def test_admin_access_denied_for_user(self):
        """Test admin endpoints are blocked for regular users"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        
        response = session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 403
        print("✓ Admin endpoints correctly blocked for regular users")


class TestUserDashboard:
    """User dashboard tests"""
    
    @pytest.fixture
    def user_session(self):
        """Create authenticated user session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"User login failed: {response.text}")
        return session
    
    def test_user_dashboard(self, user_session):
        """Test user dashboard endpoint"""
        response = user_session.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "total_loaned" in data
        assert "total_pending" in data
        assert "total_received" in data
        assert "customers_count" in data
        assert "loans_count" in data
        print(f"✓ Dashboard: {data['loans_count']} loans, {data['customers_count']} customers")


class TestCustomersCRUD:
    """Customer CRUD operations tests"""
    
    @pytest.fixture
    def user_session(self):
        """Create authenticated user session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"User login failed: {response.text}")
        return session
    
    def test_list_customers(self, user_session):
        """Test listing customers"""
        response = user_session.get(f"{BASE_URL}/api/customers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Customers list: {len(data)} customers")
    
    def test_create_and_delete_customer(self, user_session):
        """Test customer creation and deletion"""
        # Create customer
        test_name = f"TEST_Customer_{uuid.uuid4().hex[:8]}"
        create_response = user_session.post(f"{BASE_URL}/api/customers", json={
            "name": test_name,
            "phone": "11999999999",
            "email": f"test_{uuid.uuid4().hex[:8]}@test.com"
        })
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        customer = create_response.json()
        assert customer["name"] == test_name
        customer_id = customer["id"]
        print(f"✓ Customer created: {customer['name']} (ID: {customer_id})")
        
        # Verify customer exists via GET
        get_response = user_session.get(f"{BASE_URL}/api/customers/{customer_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == test_name
        print(f"✓ Customer verified via GET")
        
        # Delete customer
        delete_response = user_session.delete(f"{BASE_URL}/api/customers/{customer_id}")
        assert delete_response.status_code == 200
        print(f"✓ Customer deleted")
        
        # Verify deletion
        verify_response = user_session.get(f"{BASE_URL}/api/customers/{customer_id}")
        assert verify_response.status_code == 404
        print(f"✓ Customer deletion verified")


class TestLoansCRUD:
    """Loan CRUD operations tests"""
    
    @pytest.fixture
    def user_session(self):
        """Create authenticated user session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"User login failed: {response.text}")
        return session
    
    def test_list_loans(self, user_session):
        """Test listing loans"""
        response = user_session.get(f"{BASE_URL}/api/loans")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Loans list: {len(data)} loans")
        
        # Verify loan structure if loans exist
        if len(data) > 0:
            loan = data[0]
            assert "id" in loan
            assert "amount" in loan
            assert "interest_rate" in loan
            assert "total_amount" in loan
            assert "customer_name" in loan
            print(f"✓ Loan structure verified: {loan['customer_name']}")


class TestInstallments:
    """Installments tests"""
    
    @pytest.fixture
    def user_session(self):
        """Create authenticated user session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"User login failed: {response.text}")
        return session
    
    def test_list_all_installments(self, user_session):
        """Test listing all installments"""
        response = user_session.get(f"{BASE_URL}/api/installments")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Installments list: {len(data)} installments")
    
    def test_installments_stats(self, user_session):
        """Test installments stats endpoint"""
        response = user_session.get(f"{BASE_URL}/api/installments/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_pending" in data
        assert "total_overdue" in data
        assert "total_paid" in data
        print(f"✓ Installments stats: {data['total_pending']} pending, {data['total_paid']} paid")
    
    def test_installments_filter_by_status(self, user_session):
        """Test filtering installments by status"""
        for status in ["pending", "paid", "overdue"]:
            response = user_session.get(f"{BASE_URL}/api/installments?status={status}")
            assert response.status_code == 200
            print(f"✓ Filter by status '{status}' works")


class TestSettings:
    """Settings tests"""
    
    @pytest.fixture
    def user_session(self):
        """Create authenticated user session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"User login failed: {response.text}")
        return session
    
    def test_get_settings(self, user_session):
        """Test getting user settings"""
        response = user_session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "email" in data
        assert "preferences" in data
        print(f"✓ Settings retrieved: {data['email']}")
    
    def test_get_preferences(self, user_session):
        """Test getting user preferences"""
        response = user_session.get(f"{BASE_URL}/api/settings/preferences")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Preferences retrieved: {data}")


class TestRoleBasedAccess:
    """Role-based access control tests"""
    
    def test_user_cannot_access_admin_routes(self):
        """Test user cannot access admin routes"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        
        # Try admin endpoints
        endpoints = ["/api/admin/stats", "/api/admin/users"]
        for endpoint in endpoints:
            response = session.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 403, f"Expected 403 for {endpoint}"
        print("✓ User correctly blocked from admin routes")
    
    def test_admin_cannot_access_user_routes(self):
        """Test admin cannot access user-only routes"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        # Try user endpoints
        endpoints = ["/api/dashboard", "/api/customers", "/api/loans"]
        for endpoint in endpoints:
            response = session.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 403, f"Expected 403 for {endpoint}"
        print("✓ Admin correctly blocked from user-only routes")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
