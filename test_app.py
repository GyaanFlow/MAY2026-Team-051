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

def test_staff_register_student(client, admin_token):
    """Test staff registering a student"""
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.post(
        "/api/staff/students/register",
        json={
            "username": "teststudent1",
            "password": "password1234",
            "email": "student1@library.com",
            "full_name": "Student One"
        },
        headers=headers
    )

    assert response.status_code == 201

    data = response.get_json()

    assert "student_id" in data
    assert "user_id" in data
    assert data["full_name"] == "Student One"
    assert data["roll_number"] is None

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

# --- STORY 3.7: EXTENSION APPROVAL & SEAT ALLOCATION ---

def register_and_approve_student(client, admin_token, username):
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/staff/students/register", json={
        "username": username,
        "password": "password123",
        "email": f"{username}@library.com",
        "full_name": username,
    }, headers=headers)
    login = client.post("/api/auth/login", json={"username": username, "password": "password123"})
    token = login.get_json()["access_token"]
    student_id = client.get("/api/admin/memberships/pending", headers=headers).get_json()[-1]["student_id"]
    client.post(f"/api/admin/memberships/{student_id}/approve", headers=headers)
    return token

@pytest.fixture
def student_token(client, admin_token):
    return register_and_approve_student(client, admin_token, "extstudent")

@pytest.fixture
def staff_token(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/admin/staff", json={
        "username": "extstaff", "password": "password123", "email": "extstaff@library.com"
    }, headers=headers)
    login = client.post("/api/auth/login", json={"username": "extstaff", "password": "password123"})
    return login.get_json()["access_token"]

# --- STAFF MANAGEMENT: DETAIL / UPDATE / DEACTIVATE ---

def _create_staff(client, admin_token, username="detailstaff"):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/admin/staff", json={
        "username": username, "password": "password123",
        "email": f"{username}@library.com",
        "full_name": "Detail Staff",
        "position": "Librarian",
        "phone": "9999999999",
        "address": "Staff Quarters",
    }, headers=headers)
    return response.get_json()["user_id"]

def test_get_staff_detail_success(client, admin_token):
    """Admin can retrieve a specific staff member"""
    user_id = _create_staff(client, admin_token)
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get(f"/api/admin/staff/{user_id}", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["username"] == "detailstaff"

def test_get_staff_detail_not_found(client, admin_token):
    """Unknown staff user_id returns 404"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/admin/staff/9999", headers=headers)
    assert response.status_code == 404

def test_update_staff_success(client, admin_token):
    """Admin can update staff profile details."""
    user_id = _create_staff(client, admin_token, "updatestaff")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.put(f"/api/admin/staff/{user_id}", json={
        "email": "updated@library.com",
        "phone": "5551234",
        "full_name": "Updated Staff",
        "position": "Front Desk Executive",
        "address": "New Address",
    }, headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data["email"] == "updated@library.com"
    assert data["phone"] == "5551234"
    assert data["full_name"] == "Updated Staff"
    assert data["position"] == "Front Desk Executive"
    assert data["address"] == "New Address"

def test_deactivate_staff_success(client, admin_token):
    """Admin can deactivate an active staff member"""
    user_id = _create_staff(client, admin_token, "deactstaff")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post(f"/api/admin/staff/{user_id}/deactivate", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["user"]["status"] is False

def test_deactivate_staff_already_deactivated(client, admin_token):
    """Deactivating an already-inactive staff member returns 400"""
    user_id = _create_staff(client, admin_token, "deactstaff2")
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post(f"/api/admin/staff/{user_id}/deactivate", headers=headers)
    response = client.post(f"/api/admin/staff/{user_id}/deactivate", headers=headers)
    assert response.status_code == 400


def test_staff_management_requires_admin(client):
    """A non-admin cannot access staff management endpoints."""
    response = client.post("/api/auth/login", json={
        "username": "admin", "password": "test-password"
    })
    # Create a staff account using the admin token first.
    admin_token = response.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}
    created = client.post("/api/admin/staff", json={
        "username": "restrictedstaff",
        "password": "password123",
        "email": "restricted@library.com",
    }, headers=headers)
    user_id = created.get_json()["user_id"]
    login = client.post("/api/auth/login", json={
        "username": "restrictedstaff", "password": "password123"
    })
    staff_token = login.get_json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    assert client.get("/api/admin/staff", headers=staff_headers).status_code == 403
    assert client.post("/api/admin/staff", json={
        "username": "anotherstaff", "password": "password123", "email": "another@library.com"
    }, headers=staff_headers).status_code == 403
    assert client.put(f"/api/admin/staff/{user_id}", json={"phone": "123"}, headers=staff_headers).status_code == 403
    assert client.post(f"/api/admin/staff/{user_id}/deactivate", headers=staff_headers).status_code == 403


def test_deactivated_staff_cannot_login(client, admin_token):
    """A deactivated staff account cannot authenticate."""
    user_id = _create_staff(client, admin_token, "loginblockedstaff")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post(f"/api/admin/staff/{user_id}/deactivate", headers=admin_headers)
    assert response.status_code == 200

    login = client.post("/api/auth/login", json={
        "username": "loginblockedstaff", "password": "password123"
    })
    assert login.status_code == 403
    assert login.get_json()["message"] == "Account is deactivated"


def test_staff_list_returns_profile_fields(client, admin_token):
    """Staff list exposes the fields needed by the admin UI."""
    user_id = _create_staff(client, admin_token, "listprofile")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/admin/staff", headers=headers)
    assert response.status_code == 200
    staff = next(item for item in response.get_json() if item["user_id"] == user_id)
    assert staff["full_name"] == "Detail Staff"
    assert staff["position"] == "Librarian"
    assert staff["address"] == "Staff Quarters"



# --- ADMIN MEMBERSHIPS ---

def _register_pending_student(client, admin_token, username):
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/staff/students/register", json={
        "username": username, "password": "password123",
        "email": f"{username}@library.com", "full_name": username,
    }, headers=headers)
    pending = client.get("/api/admin/memberships/pending", headers=headers).get_json()
    return next(s for s in pending if s["full_name"] == username)

def test_get_pending_memberships(client, admin_token):
    """Admin can list students awaiting membership approval"""
    _register_pending_student(client, admin_token, "pendingstudent")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/admin/memberships/pending", headers=headers)
    assert response.status_code == 200
    names = [s["full_name"] for s in response.get_json()]
    assert "pendingstudent" in names

def test_get_memberships_list(client, admin_token):
    """Admin can list all memberships, optionally filtered by status"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/admin/memberships", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)

    filtered = client.get("/api/admin/memberships?status=Active", headers=headers)
    assert filtered.status_code == 200
    for s in filtered.get_json():
        assert s["membership_status"] == "Active"

def test_reject_membership_success(client, admin_token):
    """Admin can reject a pending membership"""
    student = _register_pending_student(client, admin_token, "rejectstudent")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post(f"/api/admin/memberships/{student['student_id']}/reject", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["student"]["membership_status"] == "Rejected"

def test_disapprove_membership_success(client, admin_token):
    """Admin can disapprove an active membership"""
    student = _register_pending_student(client, admin_token, "disapprovestudent")
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post(f"/api/admin/memberships/{student['student_id']}/approve", headers=headers)
    response = client.post(f"/api/admin/memberships/{student['student_id']}/disapprove", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["student"]["membership_status"] == "Disapproved"

def test_update_membership_extend(client, admin_token):
    """Admin can extend a student's membership expiry"""
    student = _register_pending_student(client, admin_token, "extendstudent")
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post(f"/api/admin/memberships/{student['student_id']}/approve", headers=headers)
    response = client.put(f"/api/admin/memberships/{student['student_id']}", json={
        "extend_days": 30
    }, headers=headers)
    assert response.status_code == 200
    assert response.get_json()["student"]["membership_expiry"] is not None


# --- STORY 1.2: STUDENT MEMBERSHIP MANAGEMENT ---

def test_membership_management_requires_admin(client, staff_token):
    """Staff users cannot access admin membership management APIs."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    assert client.get("/api/admin/memberships", headers=headers).status_code == 403
    assert client.get("/api/admin/memberships/pending", headers=headers).status_code == 403


def test_approve_membership_sets_active_and_expiry(client, admin_token):
    """Admin can approve a pending membership and receive an expiry date when a plan is assigned."""
    student = _register_pending_student(client, admin_token, "story12approve")
    headers = {"Authorization": f"Bearer {admin_token}"}

    plans = client.get("/api/admin/membership-plans", headers=headers).get_json()
    if plans:
        client.put(
            f"/api/admin/memberships/{student['student_id']}",
            json={"plan_id": plans[0]["plan_id"]},
            headers=headers,
        )

    response = client.post(
        f"/api/admin/memberships/{student['student_id']}/approve",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.get_json()["student"]
    assert body["membership_status"] == "Active"
    if plans and plans[0].get("duration_days"):
        assert body["membership_expiry"] is not None


def test_reject_pending_membership(client, admin_token):
    """Admin can reject a pending membership."""
    student = _register_pending_student(client, admin_token, "story12reject")
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.post(
        f"/api/admin/memberships/{student['student_id']}/reject",
        headers=headers,
    )
    assert response.status_code == 200
    assert response.get_json()["student"]["membership_status"] == "Rejected"


def test_disapprove_active_membership(client, admin_token):
    """Admin can disapprove an active membership."""
    student = _register_pending_student(client, admin_token, "story12disapprove")
    headers = {"Authorization": f"Bearer {admin_token}"}

    client.post(f"/api/admin/memberships/{student['student_id']}/approve", headers=headers)
    response = client.post(
        f"/api/admin/memberships/{student['student_id']}/disapprove",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.get_json()["student"]
    assert body["membership_status"] == "Disapproved"
    assert body["membership_expiry"] is None


def test_update_membership_plan(client, admin_token):
    """Admin can assign a valid membership plan to a student."""
    student = _register_pending_student(client, admin_token, "story12plan")
    headers = {"Authorization": f"Bearer {admin_token}"}
    plans = client.get("/api/admin/membership-plans", headers=headers).get_json()
    assert plans

    response = client.put(
        f"/api/admin/memberships/{student['student_id']}",
        json={"plan_id": plans[0]["plan_id"]},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.get_json()["student"]["plan_id"] == plans[0]["plan_id"]


def test_approve_nonexistent_membership_returns_404(client, admin_token):
    """Approving an unknown membership returns 404."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/admin/memberships/999999/approve", headers=headers)
    assert response.status_code == 404

def test_membership_actions_require_admin(client, admin_token, staff_token):
    """Approval, rejection, and disapproval actions are restricted to admins."""
    student = _register_pending_student(client, admin_token, "story12auth")
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    response = client.post(
        f"/api/admin/memberships/{student['student_id']}/approve",
        headers=staff_headers,
    )
    assert response.status_code == 403

    response = client.post(
        f"/api/admin/memberships/{student['student_id']}/reject",
        headers=staff_headers,
    )
    assert response.status_code == 403

    client.post(
        f"/api/admin/memberships/{student['student_id']}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    response = client.post(
        f"/api/admin/memberships/{student['student_id']}/disapprove",
        headers=staff_headers,
    )
    assert response.status_code == 403


def test_cannot_reject_active_membership(client, admin_token):
    """An active membership cannot be rejected; it must be disapproved instead."""
    student = _register_pending_student(client, admin_token, "story12transition")
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post(f"/api/admin/memberships/{student['student_id']}/approve", headers=headers)

    response = client.post(
        f"/api/admin/memberships/{student['student_id']}/reject",
        headers=headers,
    )
    assert response.status_code == 400



# --- STAFF STUDENTS: SUCCESS CASES ---

def test_staff_student_detail_success(client, admin_token):
    """Staff can retrieve an existing student's details"""
    student = _register_pending_student(client, admin_token, "detailstudent")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get(f"/api/staff/students/{student['student_id']}", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["full_name"] == "detailstudent"

def test_staff_verify_student_active(client, admin_token):
    """Staff can verify an active student's membership"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/staff/students/register", json={
        "username": "verifystudent", "password": "password123",
        "email": "verifystudent@library.com", "full_name": "verifystudent",
        "plan_id": 1,
    }, headers=headers)
    pending = client.get("/api/admin/memberships/pending", headers=headers).get_json()
    student = next(s for s in pending if s["full_name"] == "verifystudent")
    client.post(f"/api/admin/memberships/{student['student_id']}/approve", headers=headers)
    response = client.get(f"/api/staff/students/{student['student_id']}/verify", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["status"] == "Active"
    assert body["valid"] is True

# --- STORY 1.3: STUDENT REGISTRATION & MEMBERSHIP VERIFICATION ---

def test_staff_can_list_registered_students(client, staff_token):
    """Library staff can view registered students for verification."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.get("/api/staff/students", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)


def test_student_cannot_list_registered_students(client, student_token):
    """Students cannot access the staff student-management list."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/staff/students", headers=headers)
    assert response.status_code == 403


def test_staff_can_get_active_membership_plans(client, staff_token):
    """Staff can load active plans for the registration form."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.get("/api/staff/membership-plans", headers=headers)
    assert response.status_code == 200
    plans = response.get_json()
    assert isinstance(plans, list)
    assert all(plan["is_active"] for plan in plans)


def test_student_cannot_get_staff_membership_plans(client, student_token):
    """Students cannot load the staff registration plan endpoint."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/staff/membership-plans", headers=headers)
    assert response.status_code == 403


def test_staff_registration_persists_profile_and_pending_membership(client, staff_token):
    """Registration creates a Student account with a pending membership."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/students/register", json={
        "username": "story13student",
        "password": "password123",
        "email": "story13student@library.com",
        "full_name": "Story Thirteen Student",
        "phone": "9876543210",
        "address": "Library Road",
        "roll_number": "RV-2026-013",
        "dob": "2004-05-12",
        "gender": "female",
        "plan_id": 1,
    }, headers=headers)

    assert response.status_code == 201
    student = response.get_json()
    assert student["full_name"] == "Story Thirteen Student"
    assert student["roll_number"] == "RV-2026-013"
    assert student["dob"] == "2004-05-12"
    assert student["gender"] == "female"
    assert student["membership_status"] == "Pending"
    assert student["plan_id"] == 1
    assert student["username"] == "story13student"


def test_student_registration_duplicate_roll_number_rejected(client, staff_token):
    """A roll number can belong to only one registered student."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    payload = {
        "username": "rollstudent1",
        "password": "password123",
        "email": "rollstudent1@library.com",
        "full_name": "Roll Student One",
        "roll_number": "UNIQUE-ROLL-1",
    }
    first = client.post("/api/staff/students/register", json=payload, headers=headers)
    assert first.status_code == 201

    payload["username"] = "rollstudent2"
    payload["email"] = "rollstudent2@library.com"
    second = client.post("/api/staff/students/register", json=payload, headers=headers)
    assert second.status_code == 409
    assert "Roll number already registered" in second.get_json()["message"]


def test_student_registration_invalid_plan_rejected(client, staff_token):
    """Registration rejects an unknown membership plan."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/students/register", json={
        "username": "badplanstudent",
        "password": "password123",
        "email": "badplanstudent@library.com",
        "full_name": "Bad Plan Student",
        "plan_id": 99999,
    }, headers=headers)
    assert response.status_code == 404


def test_student_registration_duplicate_username_rejected(client, staff_token):
    """Registration rejects an already-used username."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    payload = {
        "username": "duplicateusername",
        "password": "password123",
        "email": "one@library.com",
        "full_name": "First Student",
    }
    assert client.post("/api/staff/students/register", json=payload, headers=headers).status_code == 201

    payload["email"] = "two@library.com"
    payload["full_name"] = "Second Student"
    response = client.post("/api/staff/students/register", json=payload, headers=headers)
    assert response.status_code == 409


def test_staff_verify_pending_membership_is_not_valid(client, staff_token):
    """A newly registered pending membership is not yet valid."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/students/register", json={
        "username": "pendingverify13",
        "password": "password123",
        "email": "pendingverify13@library.com",
        "full_name": "Pending Verify",
    }, headers=headers)
    assert response.status_code == 201
    student_id = response.get_json()["student_id"]

    response = client.get(f"/api/staff/students/{student_id}/verify", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["status"] == "Pending"
    assert body["valid"] is False


def test_staff_verify_active_membership_is_valid(client, admin_token, staff_token):
    """Staff can verify an approved, unexpired membership as valid."""
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.post("/api/staff/students/register", json={
        "username": "activeverify13",
        "password": "password123",
        "email": "activeverify13@library.com",
        "full_name": "Active Verify",
        "plan_id": 1,
    }, headers=staff_headers)
    assert response.status_code == 201
    student_id = response.get_json()["student_id"]

    approved = client.post(
        f"/api/admin/memberships/{student_id}/approve",
        headers=admin_headers,
    )
    assert approved.status_code == 200

    response = client.get(f"/api/staff/students/{student_id}/verify", headers=staff_headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["status"] == "Active"
    assert body["valid"] is True
    assert body["membership_expiry"] is not None


def test_student_cannot_verify_membership_as_staff(client, student_token):
    """A student cannot call the staff membership verification endpoint."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/staff/students/1/verify", headers=headers)
    assert response.status_code == 403
