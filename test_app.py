import pytest
import json
from datetime import date
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
        "password": "test-password"
    })
    return response.get_json()["access_token"]

# --- AUTH APIs ---
def test_login_success(client):
    """Test login with valid credentials"""
    response = client.post("/api/auth/login", json={"username": "admin", "password": "test-password"})
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

def test_create_staff_requires_complete_details(client, admin_token):
    """Creating a staff member without the required details is rejected."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/admin/staff", json={"username": "newstaff", "password": "password123"}, 
                           headers=headers)
    assert response.status_code == 400

def test_create_staff_success(client, admin_token):
    """Admin can create a staff account with profile details."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/admin/staff", json={
        "username": "staff1",
        "password": "password123",
        "email": "staff1@library.com",
        "full_name": "Staff One",
        "position": "Librarian",
        "phone": "9876543210",
        "address": "Library Quarters"
    }, headers=headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data["role"] == "Staff"
    assert data["status"] is True
    assert data["full_name"] == "Staff One"
    assert data["position"] == "Librarian"
