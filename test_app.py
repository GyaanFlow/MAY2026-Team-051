import pytest
import json
from datetime import date, datetime, time, timedelta
from app import create_app, db
from models import User, LibrarySettings
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


def test_staff_seats_lists_availability(client, staff_token):
    """Staff can list active seats and whether they are free now."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.get("/api/staff/seats", headers=headers)
    assert response.status_code == 200
    seats = response.get_json()
    assert len(seats) > 0
    assert "seat_id" in seats[0]
    assert "is_available" in seats[0]


def test_walk_in_admission_success(client, staff_token, student_token):
    """Staff can admit an active student to a free seat for today."""
    student = client.get(
        "/api/students/me",
        headers={"Authorization": f"Bearer {student_token}"},
    ).get_json()
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    seats = client.get("/api/staff/seats", headers=staff_headers).get_json()
    seat_id = seats[0]["seat_id"]

    response = client.post("/api/staff/bookings/walk-in", json={
        "student_id": student["student_id"],
        "seat_id": seat_id,
        "duration_minutes": 30,
    }, headers=staff_headers)
    assert response.status_code == 201, response.get_json()
    booking = response.get_json()["booking"]
    assert booking["seat_id"] == seat_id
    assert booking["full_name"]
    assert booking["checkin_code"]

    overview = client.get("/api/staff/bookings/today", headers=staff_headers).get_json()
    ids = [item["booking_id"] for item in overview["bookings"]]
    assert booking["booking_id"] in ids


def test_walk_in_admission_by_username(client, staff_token, student_token):
    """Walk-in student lookup accepts the student's username."""
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/bookings/walk-in", json={
        "student_id": "extstudent",
        "seat_id": 2,
        "duration_minutes": 30,
    }, headers=staff_headers)
    assert response.status_code == 201, response.get_json()
    assert response.get_json()["booking"]["username"] == "extstudent"


def test_walk_in_admission_unknown_student(client, staff_token):
    """Unknown student identifiers return 404."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/bookings/walk-in", json={
        "student_id": "nobody",
        "seat_id": 1,
    }, headers=headers)
    assert response.status_code == 404


def test_walk_in_admission_pending_membership(client, staff_token, admin_token):
    """Pending students cannot be admitted as walk-ins."""
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    created = client.post("/api/staff/students/register", json={
        "username": "pendingwalk",
        "password": "password123",
        "email": "pendingwalk@library.com",
        "full_name": "Pending Walk",
    }, headers=staff_headers).get_json()

    response = client.post("/api/staff/bookings/walk-in", json={
        "student_id": created["student_id"],
        "seat_id": 1,
    }, headers=staff_headers)
    assert response.status_code == 400


def test_student_can_request_booking_extension(client, student_token, confirmed_booking):
    """Students can request extra time on a confirmed booking."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_minutes": 60},
        headers=headers,
    )
    assert response.status_code == 201, response.get_json()
    body = response.get_json()["extension_request"]
    assert body["status"] == "Pending"
    assert body["requested_end_time"] == "12:00"

    loaded = client.get("/api/students/me/bookings", headers=headers).get_json()
    match = next(item for item in loaded["bookings"] if item["booking_id"] == confirmed_booking["booking_id"])
    assert match["pending_extension"]["extension_request_id"] == body["extension_request_id"]


def test_staff_can_approve_extension_same_seat(client, staff_token, student_token, confirmed_booking):
    """Staff can extend the current seat through to the requested end time."""
    student_headers = {"Authorization": f"Bearer {student_token}"}
    created = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_minutes": 60},
        headers=student_headers,
    ).get_json()["extension_request"]

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    pending = client.get("/api/staff/extension-requests", headers=staff_headers)
    assert pending.status_code == 200
    ids = [item["extension_request_id"] for item in pending.get_json()["extension_requests"]]
    assert created["extension_request_id"] in ids

    response = client.post(
        f"/api/staff/extension-requests/{created['extension_request_id']}/approve",
        json={},
        headers=staff_headers,
    )
    assert response.status_code == 200, response.get_json()
    assert response.get_json()["booking"]["end_time"] == "12:00"


def test_staff_can_reassign_seat_when_approving_extension(client, staff_token, student_token, confirmed_booking):
    """Staff can approve an extension onto a different free seat."""
    student_headers = {"Authorization": f"Bearer {student_token}"}
    created = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_minutes": 60},
        headers=student_headers,
    ).get_json()["extension_request"]

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(
        f"/api/staff/extension-requests/{created['extension_request_id']}/approve",
        json={"seat_id": 2},
        headers=staff_headers,
    )
    assert response.status_code == 200, response.get_json()
    booking = response.get_json()["booking"]
    assert booking["seat_id"] == 2
    assert booking["end_time"] == "12:00"


def test_staff_can_reject_extension(client, staff_token, student_token, confirmed_booking):
    """Staff can reject a pending extension request."""
    student_headers = {"Authorization": f"Bearer {student_token}"}
    created = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_minutes": 30},
        headers=student_headers,
    ).get_json()["extension_request"]

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(
        f"/api/staff/extension-requests/{created['extension_request_id']}/reject",
        headers=staff_headers,
    )
    assert response.status_code == 200
    assert response.get_json()["extension_request"]["status"] == "Rejected"


# --- 5.1 OFFLINE PAYMENT RECORDING ---

def test_staff_can_record_offline_payment(client, staff_token, student_token):
    """Staff can log a cash/UPI/card payment against an active student."""
    student = client.get(
        "/api/students/me",
        headers={"Authorization": f"Bearer {student_token}"},
    ).get_json()
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    response = client.post("/api/staff/payments", json={
        "student_id": student["student_id"],
        "amount": 500,
        "payment_mode": "Cash",
        "purpose": "Monthly membership",
    }, headers=staff_headers)
    assert response.status_code == 201, response.get_json()
    payment = response.get_json()["payment"]
    assert payment["amount"] == 500
    assert payment["payment_mode"] == "Cash"
    assert payment["purpose"] == "Monthly membership"
    assert payment["username"] == "extstudent"
    assert payment["full_name"]

    listed = client.get("/api/staff/payments", headers=staff_headers).get_json()
    ids = [item["payment_id"] for item in listed["payments"]]
    assert payment["payment_id"] in ids


def test_staff_can_record_payment_by_username(client, staff_token, student_token):
    """Payment student lookup accepts the student's username."""
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/payments", json={
        "student_id": "extstudent",
        "amount": 200,
        "payment_mode": "UPI",
    }, headers=staff_headers)
    assert response.status_code == 201, response.get_json()
    assert response.get_json()["payment"]["username"] == "extstudent"
    assert response.get_json()["payment"]["payment_mode"] == "UPI"


def test_record_payment_invalid_mode(client, staff_token, student_token):
    """Unsupported payment modes are rejected."""
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/payments", json={
        "student_id": "extstudent",
        "amount": 100,
        "payment_mode": "Cheque",
    }, headers=staff_headers)
    assert response.status_code == 400


def test_record_payment_unknown_student(client, staff_token):
    """Unknown student identifiers return 404."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/payments", json={
        "student_id": "nobody",
        "amount": 100,
        "payment_mode": "Card",
    }, headers=headers)
    assert response.status_code == 404


def test_student_can_view_own_payment_history(client, staff_token, student_token):
    """Students see payments staff recorded against their account."""
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    client.post("/api/staff/payments", json={
        "student_id": "extstudent",
        "amount": 300,
        "payment_mode": "Card",
        "purpose": "Day pass",
    }, headers=staff_headers)

    student_headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/students/me/payments", headers=student_headers)
    assert response.status_code == 200, response.get_json()
    body = response.get_json()
    assert body["total_payments"] >= 1
    assert body["payments"][0]["amount"] == 300
    assert body["payments"][0]["purpose"] == "Day pass"


def test_student_cannot_record_staff_payment(client, student_token):
    """Students cannot use the staff payment recording endpoint."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/staff/payments", json={
        "student_id": "extstudent",
        "amount": 50,
        "payment_mode": "Cash",
    }, headers=headers)
    assert response.status_code == 403


# --- 6.1 / 6.2 COMPLAINTS ---

def test_student_can_submit_and_list_complaints(client, student_token):
    """Students can raise a complaint and see it on their history."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/students/me/complaints", json={
        "title": "Wi-Fi keeps dropping",
        "category": "Wi-Fi / Internet",
        "description": "Hall B disconnects every few minutes.",
    }, headers=headers)
    assert response.status_code == 201, response.get_json()
    complaint = response.get_json()["complaint"]
    assert complaint["status"] == "Open"
    assert complaint["title"] == "Wi-Fi keeps dropping"
    assert complaint["category"] == "Wi-Fi / Internet"
    assert complaint["username"] == "extstudent"

    listed = client.get("/api/students/me/complaints", headers=headers).get_json()
    ids = [item["complaint_id"] for item in listed["complaints"]]
    assert complaint["complaint_id"] in ids


def test_student_complaint_requires_title_and_description(client, student_token):
    """Complaint create rejects a missing title or description."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/students/me/complaints", json={
        "title": "No description",
    }, headers=headers)
    assert response.status_code == 400


def test_staff_can_review_and_resolve_complaint(client, staff_token, student_token):
    """Staff can take a student complaint in progress and mark it resolved."""
    student_headers = {"Authorization": f"Bearer {student_token}"}
    created = client.post("/api/students/me/complaints", json={
        "subject": "Desk was dirty",
        "category": "Cleanliness & Hygiene",
        "description": "Study room left uncleaned.",
    }, headers=student_headers).get_json()["complaint"]
    complaint_id = created["complaint_id"]

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    listed = client.get("/api/staff/complaints", headers=staff_headers)
    assert listed.status_code == 200, listed.get_json()
    ids = [item["complaint_id"] for item in listed.get_json()["complaints"]]
    assert complaint_id in ids

    review = client.put(
        f"/api/staff/complaints/{complaint_id}",
        json={"status": "InProgress"},
        headers=staff_headers,
    )
    assert review.status_code == 200, review.get_json()
    assert review.get_json()["complaint"]["status"] == "InProgress"

    resolved = client.put(
        f"/api/staff/complaints/{complaint_id}",
        json={"status": "Resolved", "resolution_note": "Room inspected and cleaned."},
        headers=staff_headers,
    )
    assert resolved.status_code == 200, resolved.get_json()
    body = resolved.get_json()["complaint"]
    assert body["status"] == "Resolved"
    assert body["resolution_note"] == "Room inspected and cleaned."
    assert body["resolved_by_name"]

    mine = client.get("/api/students/me/complaints", headers=student_headers).get_json()
    match = next(item for item in mine["complaints"] if item["complaint_id"] == complaint_id)
    assert match["status"] == "Resolved"
    assert match["resolution_note"] == "Room inspected and cleaned."


def test_resolve_complaint_requires_note(client, staff_token, student_token):
    """Resolving a complaint without a note is rejected."""
    student_headers = {"Authorization": f"Bearer {student_token}"}
    created = client.post("/api/students/me/complaints", json={
        "title": "Noisy neighbours",
        "description": "Talking loudly in Silent Zone.",
    }, headers=student_headers).get_json()["complaint"]

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.put(
        f"/api/staff/complaints/{created['complaint_id']}",
        json={"status": "Resolved"},
        headers=staff_headers,
    )
    assert response.status_code == 400


def test_student_cannot_list_staff_complaints(client, student_token):
    """Students cannot open the staff complaint inbox."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/staff/complaints", headers=headers)
    assert response.status_code == 403


# --- 6.3 ANNOUNCEMENTS ---

def test_admin_can_create_and_list_announcements(client, admin_token):
    """Admin can publish an announcement and see it in the admin list."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/admin/announcements", json={
        "title": "Library closed on 15th August",
        "content": "Closed for Independence Day.",
        "audience": "all",
        "priority": "Important",
    }, headers=headers)
    assert response.status_code == 201, response.get_json()
    announcement = response.get_json()["announcement"]
    assert announcement["is_active"] is True
    assert announcement["audience"] == "all"
    assert announcement["priority"] == "Important"

    listed = client.get("/api/admin/announcements", headers=headers).get_json()
    ids = [item["announcement_id"] for item in listed["announcements"]]
    assert announcement["announcement_id"] in ids


def test_announcement_audience_is_filtered_by_role(client, admin_token, staff_token, student_token):
    """Students and staff only see published announcements for their audience."""
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    everyone = client.post("/api/admin/announcements", json={
        "title": "Open to all",
        "content": "Applies to everyone.",
        "audience": "all",
    }, headers=admin_headers).get_json()["announcement"]
    students_only = client.post("/api/admin/announcements", json={
        "title": "Students only",
        "content": "For students.",
        "audience": "students",
    }, headers=admin_headers).get_json()["announcement"]
    staff_only = client.post("/api/admin/announcements", json={
        "title": "Staff only",
        "content": "For staff.",
        "audience": "staff",
    }, headers=admin_headers).get_json()["announcement"]

    student_ids = [
        item["announcement_id"]
        for item in client.get(
            "/api/announcements",
            headers={"Authorization": f"Bearer {student_token}"},
        ).get_json()["announcements"]
    ]
    staff_ids = [
        item["announcement_id"]
        for item in client.get(
            "/api/announcements",
            headers={"Authorization": f"Bearer {staff_token}"},
        ).get_json()["announcements"]
    ]
    assert everyone["announcement_id"] in student_ids
    assert students_only["announcement_id"] in student_ids
    assert staff_only["announcement_id"] not in student_ids
    assert everyone["announcement_id"] in staff_ids
    assert staff_only["announcement_id"] in staff_ids
    assert students_only["announcement_id"] not in staff_ids


def test_unpublished_announcement_hidden_from_readers(client, admin_token, student_token):
    """Unpublishing an announcement hides it from the public list."""
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    created = client.post("/api/admin/announcements", json={
        "title": "Temporary notice",
        "content": "Will be unpublished.",
        "audience": "all",
    }, headers=admin_headers).get_json()["announcement"]

    update = client.put(
        f"/api/admin/announcements/{created['announcement_id']}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert update.status_code == 200
    assert update.get_json()["announcement"]["is_active"] is False

    student_ids = [
        item["announcement_id"]
        for item in client.get(
            "/api/announcements",
            headers={"Authorization": f"Bearer {student_token}"},
        ).get_json()["announcements"]
    ]
    assert created["announcement_id"] not in student_ids

    admin_ids = [
        item["announcement_id"]
        for item in client.get("/api/admin/announcements", headers=admin_headers).get_json()["announcements"]
    ]
    assert created["announcement_id"] in admin_ids


def test_admin_can_edit_and_delete_announcement(client, admin_token):
    """Admin can update announcement text and delete it."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    created = client.post("/api/admin/announcements", json={
        "title": "Old title",
        "content": "Old message",
        "audience": "students",
        "priority": "Normal",
    }, headers=headers).get_json()["announcement"]

    updated = client.put(
        f"/api/admin/announcements/{created['announcement_id']}",
        json={
            "title": "New title",
            "message": "New message",
            "priority": "Urgent",
        },
        headers=headers,
    )
    assert updated.status_code == 200, updated.get_json()
    body = updated.get_json()["announcement"]
    assert body["title"] == "New title"
    assert body["content"] == "New message"
    assert body["priority"] == "Urgent"

    deleted = client.delete(
        f"/api/admin/announcements/{created['announcement_id']}",
        headers=headers,
    )
    assert deleted.status_code == 200
    remaining = [
        item["announcement_id"]
        for item in client.get("/api/admin/announcements", headers=headers).get_json()["announcements"]
    ]
    assert created["announcement_id"] not in remaining


def test_staff_cannot_create_announcement(client, staff_token):
    """Only admins can publish announcements."""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/admin/announcements", json={
        "title": "Nope",
        "content": "Staff should not publish this.",
    }, headers=headers)
    assert response.status_code == 403


# --- 4.2 / 4.3 / 4.4 CHECK-IN, NO-SHOW, CHECK-OUT ---

def _prepare_today_library(client, grace_minutes=0):
    with client.application.app_context():
        settings = LibrarySettings.query.first()
        settings.open_time = time(0, 0)
        settings.close_time = time(23, 59)
        settings.no_show_grace_minutes = grace_minutes
        settings.min_booking_minutes = None
        settings.max_booking_hours = None
        db.session.commit()


def _book_today(client, student_token, seat_id=1, start_offset_minutes=-20, duration=60):
    now = datetime.now().replace(second=0, microsecond=0)
    start = now + timedelta(minutes=start_offset_minutes)
    end = start + timedelta(minutes=duration)
    today = date.today()
    if start.date() != today:
        start = datetime.combine(today, time(0, 0))
        end = start + timedelta(minutes=max(duration, 1))
    if end.date() != today:
        end = datetime.combine(today, time(23, 59))
    if end <= start:
        end = start + timedelta(minutes=1)
        if end.date() != today:
            end = datetime.combine(today, time(23, 59))
    response = client.post("/api/bookings", json={
        "seat_id": seat_id,
        "date": today.isoformat(),
        "start_time": start.strftime("%H:%M"),
        "end_time": end.strftime("%H:%M"),
    }, headers={"Authorization": f"Bearer {student_token}"})
    assert response.status_code == 201, response.get_json()
    return response.get_json()["booking"]


def test_staff_can_lookup_and_check_in_with_code(client, admin_token, staff_token, student_token):
    """Staff can verify a today's check-in code and mark the booking Checked-In."""
    _prepare_today_library(client)
    booking = _book_today(client, student_token, start_offset_minutes=10)
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    lookup = client.get(
        f"/api/staff/checkin?checkin_code={booking['checkin_code'].lower()}",
        headers=staff_headers,
    )
    assert lookup.status_code == 200, lookup.get_json()
    assert lookup.get_json()["booking"]["booking_id"] == booking["booking_id"]

    response = client.post("/api/staff/checkin", json={
        "checkin_code": booking["checkin_code"].lower(),
    }, headers=staff_headers)
    assert response.status_code == 201, response.get_json()
    body = response.get_json()["attendance"]
    assert body["booking"]["status"] == "Checked-In"
    assert body["checkin_time"]

    loaded = client.get(
        "/api/students/me/bookings",
        headers={"Authorization": f"Bearer {student_token}"},
    ).get_json()
    match = next(item for item in loaded["bookings"] if item["booking_id"] == booking["booking_id"])
    assert match["status"] == "Checked-In"
    assert match["checkin_time"]

    availability = client.get(
        f"/api/seats/availability?date={date.today().isoformat()}&start_time={booking['start_time']}&end_time={booking['end_time']}",
        headers={"Authorization": f"Bearer {student_token}"},
    ).get_json()
    seat_ids = [seat["seat_id"] for seat in availability["available_seats"]]
    assert booking["seat_id"] not in seat_ids


def test_checkin_rejects_invalid_or_future_booking(client, staff_token, student_token, confirmed_booking):
    """Unknown codes 404; future-dated confirmed bookings cannot be checked in."""
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    missing = client.post("/api/staff/checkin", json={
        "checkin_code": "NOPE1234",
    }, headers=staff_headers)
    assert missing.status_code == 404

    future = client.post("/api/staff/checkin", json={
        "checkin_code": confirmed_booking["checkin_code"],
    }, headers=staff_headers)
    assert future.status_code == 400


def test_student_cannot_use_staff_checkin(client, student_token):
    """Students cannot verify check-in codes."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/staff/checkin", json={"checkin_code": "ABC"}, headers=headers)
    assert response.status_code == 403


def test_staff_can_mark_no_show_after_grace(client, staff_token, student_token):
    """After the grace window, staff can mark a confirmed booking unarrived and free the seat."""
    _prepare_today_library(client, grace_minutes=0)
    booking = _book_today(client, student_token, start_offset_minutes=-30)
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    candidates = client.get("/api/staff/bookings/no-show-candidates", headers=staff_headers)
    assert candidates.status_code == 200, candidates.get_json()
    ids = [item["booking_id"] for item in candidates.get_json()["candidates"]]
    assert booking["booking_id"] in ids

    response = client.post(
        f"/api/staff/bookings/{booking['booking_id']}/no-show",
        headers=staff_headers,
    )
    assert response.status_code == 200, response.get_json()
    assert response.get_json()["booking"]["status"] == "No-Show"

    today = date.today().isoformat()
    availability = client.get(
        f"/api/seats/availability?date={today}&start_time={booking['start_time']}&end_time={booking['end_time']}",
        headers={"Authorization": f"Bearer {student_token}"},
    ).get_json()
    seat_ids = [seat["seat_id"] for seat in availability["available_seats"]]
    assert booking["seat_id"] in seat_ids


def test_no_show_rejected_during_grace_period(client, staff_token, student_token):
    """Bookings still inside the waiting window cannot be marked unarrived."""
    _prepare_today_library(client, grace_minutes=15)
    booking = _book_today(client, student_token, start_offset_minutes=5)
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(
        f"/api/staff/bookings/{booking['booking_id']}/no-show",
        headers=staff_headers,
    )
    assert response.status_code == 400


def test_student_can_check_out_after_checkin(client, staff_token, student_token):
    """Checked-in students can check out; attendance is closed and the booking completes."""
    _prepare_today_library(client)
    booking = _book_today(client, student_token, start_offset_minutes=10)
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    client.post("/api/staff/checkin", json={
        "checkin_code": booking["checkin_code"],
    }, headers=staff_headers)

    student_headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        f"/api/bookings/{booking['booking_id']}/checkout",
        headers=student_headers,
    )
    assert response.status_code == 200, response.get_json()
    attendance = response.get_json()["attendance"]
    assert attendance["checkout_time"]
    assert attendance["booking"]["status"] == "Completed"

    loaded = client.get("/api/students/me/bookings", headers=student_headers).get_json()
    match = next(item for item in loaded["bookings"] if item["booking_id"] == booking["booking_id"])
    assert match["status"] == "Completed"
    assert match["checkout_time"]

    availability = client.get(
        f"/api/seats/availability?date={date.today().isoformat()}&start_time={booking['start_time']}&end_time={booking['end_time']}",
        headers=student_headers,
    ).get_json()
    seat_ids = [seat["seat_id"] for seat in availability["available_seats"]]
    assert booking["seat_id"] in seat_ids


def test_checkout_requires_checked_in_booking(client, student_token, confirmed_booking):
    """A booking that was never checked in cannot be checked out."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        f"/api/bookings/{confirmed_booking['booking_id']}/checkout",
        headers=headers,
    )
    assert response.status_code == 400

