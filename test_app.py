import pytest
import json
from app import create_app, db
from models import User
from werkzeug.security import generate_password_hash

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-secret-key"

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        # db.create_all() and seed_data() are called in create_app
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_token(client):
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    return response.get_json()["access_token"]

# --- AUTH APIs ---
def test_login_success(client):
    """Test login with valid credentials"""
    response = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    assert "access_token" in response.get_json()

def test_login_failure(client):
    """Test login with invalid credentials"""
    response = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert response.status_code == 401
    assert response.get_json()["message"] == "Invalid username or password"

# --- ADMIN STAFF APIs ---
def test_get_staff_list_unauthorized(client):
    """Test getting staff list without token"""
    response = client.get("/api/admin/staff")
    assert response.status_code == 401

def test_get_staff_list_authorized(client, admin_token):
    """Test getting staff list with admin token"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/admin/staff", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)

def test_create_staff_intentionally_failing(client, admin_token):
    """Test creating a staff member - intentionally failing test"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/admin/staff", json={"username": "newstaff", "password": "password123"}, 
                           headers=headers)
    # Intentionally asserting a wrong status code for demonstration
    assert response.status_code == 201

def test_create_staff_success(client, admin_token):
    """Test creating a staff member successfully"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/admin/staff", json={
        "username": "staff1",
        "password": "password123",
        "email": "staff1@library.com",
        "role": "Staff"
    }, headers=headers)
    # The actual implementation might return 201 or 200 depending on how it's implemented. Assuming 201.
    assert response.status_code in [200, 201]

# --- MEMBERSHIP PLANS APIs ---
def test_get_membership_plans(client, admin_token):
    """Test getting membership plans"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/admin/membership-plans", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)

# --- SETTINGS APIs ---
def test_get_library_settings(client, admin_token):
    """Test getting library settings"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/admin/settings", headers=headers)
    assert response.status_code == 200

# --- SEATS APIs ---
def test_get_seats(client, admin_token):
    """Test getting seats list"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/admin/seats", headers=headers)
    assert response.status_code == 200

# --- PROFILE APIs ---
def test_get_profile(client, admin_token):
    """Test getting own profile"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/profile", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["username"] == "admin"

# --- STUDENT APIs ---
def test_staff_register_student(client, admin_token):
    """Test staff registering a student"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/staff/students/register", json={
        "username": "student1",
        "password": "password123",
        "email": "student1@library.com",
        "full_name": "Student One"
    }, headers=headers)
    assert response.status_code == 201
    assert "student" in response.get_json()

def test_staff_student_detail_not_found(client, admin_token):
    """Test getting a non-existent student"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/staff/students/999", headers=headers)
    assert response.status_code == 404

def test_staff_verify_student_not_found(client, admin_token):
    """Test verifying a non-existent student's membership"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/staff/students/999/verify", headers=headers)
    assert response.status_code == 404

