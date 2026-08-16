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

# --- AUTH: RESET PASSWORD ---

def test_reset_password_success(client, admin_token):
    """Authenticated user can change their password"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/auth/reset-password", json={
        "old_password": "test-password",
        "new_password": "new-password123",
    }, headers=headers)
    assert response.status_code == 200
    login = client.post("/api/auth/login", json={"username": "admin", "password": "new-password123"})
    assert login.status_code == 200

def test_reset_password_wrong_old_password(client, admin_token):
    """Wrong old password returns 401"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/auth/reset-password", json={
        "old_password": "wrong", "new_password": "newpass123"
    }, headers=headers)
    assert response.status_code == 401

def test_reset_password_missing_fields(client, admin_token):
    """Missing old or new password returns 400"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/auth/reset-password", json={"old_password": "test-password"}, headers=headers)
    assert response.status_code == 400


# --- PROFILE: UPDATE ---

def test_update_profile_success(client, admin_token):
    """Admin can update their own profile email and phone"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.put("/api/profile", json={
        "email": "updated-admin@library.com", "phone": "9876543210"
    }, headers=headers)
    assert response.status_code == 200
    profile = client.get("/api/profile", headers=headers).get_json()
    assert profile["email"] == "updated-admin@library.com"
    assert profile["phone"] == "9876543210"

def test_update_profile_student_forbidden(client, student_token):
    """Students must use /students/me instead of /profile"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.put("/api/profile", json={"email": "x@y.com"}, headers=headers)
    assert response.status_code == 403


# --- STUDENT PROFILE (/students/me) ---

def test_student_me_get(client, student_token):
    """Student can view their own profile with membership info"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/students/me", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["username"] == "extstudent"
    assert body["membership_status"] == "Active"
    assert "membership_valid" in body

def test_student_me_put(client, student_token):
    """Student can update their own profile fields"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.put("/api/students/me", json={
        "full_name": "Updated Student", "phone": "1234567890", "address": "123 Main St"
    }, headers=headers)
    assert response.status_code == 200
    assert response.get_json()["student"]["full_name"] == "Updated Student"

def test_student_me_role_restriction(client, admin_token):
    """Non-students cannot access /students/me"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/students/me", headers=headers)
    assert response.status_code == 403


# --- STAFF MANAGEMENT: DETAIL / UPDATE / DEACTIVATE ---

def _create_staff(client, admin_token, username="detailstaff"):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/admin/staff", json={
        "username": username, "password": "password123",
        "email": f"{username}@library.com",
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
    """Admin can update a staff member's email and phone"""
    user_id = _create_staff(client, admin_token, "updatestaff")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.put(f"/api/admin/staff/{user_id}", json={
        "email": "updated@library.com", "phone": "5551234"
    }, headers=headers)
    assert response.status_code == 200
    assert response.get_json()["email"] == "updated@library.com"

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


# --- MEMBERSHIP PLANS: CREATE / UPDATE / RETIRE ---

def test_create_membership_plan_success(client, admin_token):
    """Admin can create a new membership plan"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/admin/membership-plans", json={
        "plan_name": "Daily", "duration_days": 1, "price": 50
    }, headers=headers)
    assert response.status_code == 201
    assert response.get_json()["plan_name"] == "Daily"

def test_create_membership_plan_missing_name(client, admin_token):
    """Missing plan_name returns 400"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/admin/membership-plans", json={
        "duration_days": 7, "price": 100
    }, headers=headers)
    assert response.status_code == 400

def test_update_membership_plan_success(client, admin_token):
    """Admin can update an existing membership plan"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    plans = client.get("/api/admin/membership-plans", headers=headers).get_json()
    plan_id = plans[0]["plan_id"]
    response = client.put(f"/api/admin/membership-plans/{plan_id}", json={
        "price": 150
    }, headers=headers)
    assert response.status_code == 200
    assert response.get_json()["price"] == 150.0

def test_retire_membership_plan_success(client, admin_token):
    """Admin can retire (soft-delete) a membership plan"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    created = client.post("/api/admin/membership-plans", json={
        "plan_name": "Temp Plan", "duration_days": 3, "price": 75
    }, headers=headers).get_json()
    response = client.delete(f"/api/admin/membership-plans/{created['plan_id']}", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["plan"]["is_active"] is False

def test_retire_membership_plan_already_retired(client, admin_token):
    """Retiring an already-retired plan returns 400"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    created = client.post("/api/admin/membership-plans", json={
        "plan_name": "Temp Plan 2", "duration_days": 3, "price": 75
    }, headers=headers).get_json()
    plan_id = created["plan_id"]
    client.delete(f"/api/admin/membership-plans/{plan_id}", headers=headers)
    response = client.delete(f"/api/admin/membership-plans/{plan_id}", headers=headers)
    assert response.status_code == 400

def test_reactivate_membership_plan_success(client, admin_token):
    """Admin can reactivate a retired membership plan."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    created = client.post("/api/admin/membership-plans", json={
        "plan_name": "Weekend", "duration_days": 2, "price": 80
    }, headers=headers).get_json()
    plan_id = created["plan_id"]
    client.delete(f"/api/admin/membership-plans/{plan_id}", headers=headers)

    response = client.put(
        f"/api/admin/membership-plans/{plan_id}",
        json={"is_active": True},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.get_json()["is_active"] is True


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

def test_update_library_settings_success(client, admin_token):
    """Admin can update library operating hours"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.put("/api/admin/settings", json={
        "open_time": "08:00", "close_time": "22:00"
    }, headers=headers)
    assert response.status_code == 200
    settings = response.get_json()["settings"]
    assert settings["open_time"] == "08:00"
    assert settings["close_time"] == "22:00"

def test_update_booking_limits_success(client, admin_token):
    """Admin can persist seat count and booking rule limits."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.put("/api/admin/settings", json={
        "total_seats": 18,
        "min_booking_minutes": 30,
        "max_booking_hours": 3,
        "max_bookings_per_day": 2,
        "max_booking_days_ahead": 10,
        "cancellation_period": 2,
        "waitlist_enabled": True,
    }, headers=headers)
    assert response.status_code == 200
    settings = response.get_json()["settings"]
    assert settings["total_seats"] == 18
    assert settings["min_booking_minutes"] == 30
    assert settings["max_booking_hours"] == 3
    assert settings["max_bookings_per_day"] == 2
    assert settings["max_booking_days_ahead"] == 10
    assert settings["cancellation_period"] == 2
    assert settings["waitlist_enabled"] is True

    loaded = client.get("/api/admin/settings", headers=headers)
    assert loaded.status_code == 200
    assert loaded.get_json()["total_seats"] == 18


def test_update_seat_zones_success(client, admin_token):
    """Admin can persist named seat zones and reload them."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.put("/api/admin/settings", json={
        "seat_zones": [
            {"zone": "Reading Room", "seats": 12},
            {"zone": "Silent Zone", "seats": 8},
        ]
    }, headers=headers)
    assert response.status_code == 200
    settings = response.get_json()["settings"]
    assert settings["seat_zones"] == [
        {"zone": "Reading Room", "seats": 12},
        {"zone": "Silent Zone", "seats": 8},
    ]

    loaded = client.get("/api/admin/settings", headers=headers)
    assert loaded.status_code == 200
    assert loaded.get_json()["seat_zones"] == [
        {"zone": "Reading Room", "seats": 12},
        {"zone": "Silent Zone", "seats": 8},
    ]


def test_update_library_settings_invalid_hours(client, admin_token):
    """close_time before open_time returns 400"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.put("/api/admin/settings", json={
        "open_time": "22:00", "close_time": "08:00"
    }, headers=headers)
    assert response.status_code == 400


@pytest.fixture
def confirmed_booking(client, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/bookings", json={
        "seat_id": 1, "date": "2026-09-01", "start_time": "10:00", "end_time": "11:00"
    }, headers=headers)
    return response.get_json()["booking"]


def test_seat_availability_success(client, student_token):
    """Authenticated user can search for available seats in a time slot"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get(
        "/api/seats/availability?date=2026-12-01&start_time=10:00&end_time=11:00",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["total_available"] > 0
    assert len(body["available_seats"]) == body["total_available"]


def test_seat_availability_missing_params(client, student_token):
    """Missing query parameters returns 400"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/seats/availability", headers=headers)
    assert response.status_code == 400


def test_seat_availability_excludes_booked_seat(client, student_token, confirmed_booking):
    """A booked seat is excluded from availability for the same slot"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get(
        "/api/seats/availability?date=2026-09-01&start_time=10:00&end_time=11:00",
        headers=headers,
    )
    assert response.status_code == 200
    seat_ids = [s["seat_id"] for s in response.get_json()["available_seats"]]
    assert confirmed_booking["seat_id"] not in seat_ids


def test_student_can_list_own_bookings(client, student_token, confirmed_booking):
    """Student bookings persist and are returned after reload."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/students/me/bookings", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["total_bookings"] == 1
    booking = body["bookings"][0]
    assert booking["booking_id"] == confirmed_booking["booking_id"]
    assert booking["seat_id"] == confirmed_booking["seat_id"]
    assert booking["seat_number"]


def test_student_can_change_booking_seat(client, student_token, confirmed_booking):
    """Student can move a confirmed booking to another seat."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.put(
        f"/api/bookings/{confirmed_booking['booking_id']}",
        json={"seat_id": 2, "date": "2026-09-01", "start_time": "10:00", "end_time": "11:00"},
        headers=headers,
    )
    assert response.status_code == 200
    body = response.get_json()["booking"]
    assert body["seat_id"] == 2
    assert body["seat_number"] == "S02"


def test_staff_daily_overview_lists_todays_bookings(client, staff_token, student_token):
    """Staff can see real student bookings for a given date."""
    booking_date = "2026-09-01"
    student_headers = {"Authorization": f"Bearer {student_token}"}
    created = client.post("/api/bookings", json={
        "seat_id": 1, "date": booking_date, "start_time": "10:00", "end_time": "11:00"
    }, headers=student_headers)
    assert created.status_code == 201
    booking_id = created.get_json()["booking"]["booking_id"]

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.get(f"/api/staff/bookings/today?date={booking_date}", headers=staff_headers)
    assert response.status_code == 200
    body = response.get_json()
    ids = [item["booking_id"] for item in body["bookings"]]
    assert booking_id in ids
    match = next(item for item in body["bookings"] if item["booking_id"] == booking_id)
    assert match["full_name"]
    assert match["seat_number"]


def test_staff_daily_overview_empty_other_date(client, staff_token, confirmed_booking):
    """A date with no bookings returns an empty list."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.get("/api/staff/bookings/today?date=2026-12-25", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["bookings"] == []


def test_staff_daily_overview_student_forbidden(client, student_token):
    """Students cannot access the staff daily overview."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/staff/bookings/today", headers=headers)
    assert response.status_code == 403

