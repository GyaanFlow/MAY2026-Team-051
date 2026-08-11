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

@pytest.fixture
def confirmed_booking(client, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/bookings", json={
        "seat_id": 1, "date": "2026-09-01", "start_time": "10:00", "end_time": "11:00"
    }, headers=headers)
    return response.get_json()["booking"]

def test_student_request_extension_success(client, student_token, confirmed_booking):
    """Student can request an extension on their own confirmed booking"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "11:30"}, headers=headers,
    )
    assert response.status_code == 201
    assert response.get_json()["extension_request"]["status"] == "Pending"

def test_student_request_extension_invalid_time_format(client, student_token, confirmed_booking):
    """Bad HH:MM format returns 400"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "not-a-time"}, headers=headers,
    )
    assert response.status_code == 400

def test_student_request_extension_before_current_end_rejected(client, student_token, confirmed_booking):
    """requested_end_time earlier than the current end time is invalid"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "10:30"}, headers=headers,
    )
    assert response.status_code == 400

def test_student_request_extension_duplicate_pending_conflict(client, student_token, confirmed_booking):
    """A second extension request while one is still pending returns 409"""
    headers = {"Authorization": f"Bearer {student_token}"}
    url = f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request"
    client.post(url, json={"requested_end_time": "11:30"}, headers=headers)
    response = client.post(url, json={"requested_end_time": "11:45"}, headers=headers)
    assert response.status_code == 409

def test_student_cannot_request_extension_on_others_booking(client, student_token, confirmed_booking, admin_token):
    """A different student cannot request an extension on someone else's booking"""
    other_token = register_and_approve_student(client, admin_token, "otherstudent")
    headers = {"Authorization": f"Bearer {other_token}"}
    response = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "11:30"}, headers=headers,
    )
    assert response.status_code == 404

def test_staff_view_pending_extension_requests(client, staff_token, student_token, confirmed_booking):
    """Staff can list pending extension requests"""
    student_headers = {"Authorization": f"Bearer {student_token}"}
    client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "11:30"}, headers=student_headers,
    )
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.get("/api/staff/extension-requests", headers=staff_headers)
    assert response.status_code == 200
    assert response.get_json()["total"] == 1
    assert response.get_json()["extension_requests"][0]["seat_number"] == "S01"

def test_staff_approve_extension_extends_same_seat(client, staff_token, student_token, confirmed_booking):
    """Approving with no clash extends the booking on the same seat"""
    student_headers = {"Authorization": f"Bearer {student_token}"}
    req = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "11:30"}, headers=student_headers,
    ).get_json()["extension_request"]

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(f"/api/staff/extension-requests/{req['extension_request_id']}/approve", headers=staff_headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["booking"]["end_time"] == "11:30"
    assert body["booking"]["seat_id"] == confirmed_booking["seat_id"]

def test_staff_approve_extension_reassigns_seat_on_clash(client, staff_token, student_token, confirmed_booking, admin_token):
    """When the original seat is booked during the extension window, approving without
    a seat_id fails with 409, and approving with a free seat_id reassigns the booking"""
    other_token = register_and_approve_student(client, admin_token, "blockerstudent")
    client.post("/api/bookings", json={
        "seat_id": confirmed_booking["seat_id"], "date": "2026-09-01", "start_time": "11:00", "end_time": "12:00"
    }, headers={"Authorization": f"Bearer {other_token}"})

    student_headers = {"Authorization": f"Bearer {student_token}"}
    req = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "11:30"}, headers=student_headers,
    ).get_json()["extension_request"]

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    clash_response = client.post(
        f"/api/staff/extension-requests/{req['extension_request_id']}/approve", headers=staff_headers
    )
    assert clash_response.status_code == 409

    reassign_response = client.post(
        f"/api/staff/extension-requests/{req['extension_request_id']}/approve",
        json={"seat_id": 2}, headers=staff_headers,
    )
    assert reassign_response.status_code == 200
    assert reassign_response.get_json()["booking"]["seat_id"] == 2

def test_staff_reject_extension(client, staff_token, student_token, confirmed_booking):
    """Staff can reject a pending extension request"""
    student_headers = {"Authorization": f"Bearer {student_token}"}
    req = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "11:30"}, headers=student_headers,
    ).get_json()["extension_request"]

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(f"/api/staff/extension-requests/{req['extension_request_id']}/reject", headers=staff_headers)
    assert response.status_code == 200
    assert response.get_json()["extension_request"]["status"] == "Rejected"

def test_staff_cannot_resolve_already_resolved_extension(client, staff_token, student_token, confirmed_booking):
    """Approving/rejecting an already-resolved extension request returns 400"""
    student_headers = {"Authorization": f"Bearer {student_token}"}
    req = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "11:30"}, headers=student_headers,
    ).get_json()["extension_request"]

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    client.post(f"/api/staff/extension-requests/{req['extension_request_id']}/reject", headers=staff_headers)
    response = client.post(f"/api/staff/extension-requests/{req['extension_request_id']}/approve", headers=staff_headers)
    assert response.status_code == 400

def test_extension_endpoints_role_restrictions(client, staff_token, student_token, confirmed_booking):
    """Staff cannot hit the student extension-request endpoint and vice versa"""
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "11:30"}, headers=staff_headers,
    )
    assert response.status_code == 403

    student_headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/staff/extension-requests", headers=student_headers)
    assert response.status_code == 403

def test_extension_limit_minutes_enforced(client, staff_token, student_token, confirmed_booking, admin_token):
    """When library_settings.extension_limit_minutes is set, requests beyond it are rejected"""
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    from app import db
    from models import LibrarySettings
    with client.application.app_context():
        settings = LibrarySettings.query.first()
        settings.extension_limit_minutes = 15
        db.session.commit()

    student_headers = {"Authorization": f"Bearer {student_token}"}
    too_much = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "11:30"}, headers=student_headers,
    )
    assert too_much.status_code == 400

    within_limit = client.post(
        f"/api/students/me/bookings/{confirmed_booking['booking_id']}/extension-request",
        json={"requested_end_time": "11:10"}, headers=student_headers,
    )
    assert within_limit.status_code == 201


# --- STORY 4.1/4.2: STUDENT CHECK-IN / CHECK-IN VERIFICATION ---

@pytest.fixture
def todays_booking(client, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/bookings", json={
        "seat_id": 2, "date": str(date.today()), "start_time": "10:00", "end_time": "11:00"
    }, headers=headers)
    return response.get_json()["booking"]

def test_staff_checkin_missing_body(client, staff_token):
    """Non-JSON body returns 400"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/checkin", data="not json", headers=headers)
    assert response.status_code == 400

def test_staff_checkin_missing_code(client, staff_token):
    """Missing checkin_code returns 400"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/checkin", json={}, headers=headers)
    assert response.status_code == 400

def test_staff_checkin_invalid_code(client, staff_token):
    """Unknown checkin_code returns 404"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/checkin", json={"checkin_code": "NOPE1234"}, headers=headers)
    assert response.status_code == 404

def test_staff_checkin_success(client, staff_token, todays_booking):
    """Valid checkin_code for a today-dated Confirmed booking creates attendance and updates status"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(
        "/api/staff/checkin", json={"checkin_code": todays_booking["checkin_code"]}, headers=headers
    )
    assert response.status_code == 201
    body = response.get_json()
    assert body["attendance"]["booking_id"] == todays_booking["booking_id"]
    assert body["attendance"]["checkin_time"] is not None
    assert body["attendance"]["booking"]["status"] == "Checked-In"
    assert body["attendance"]["seat_number"] == "S02"

def test_staff_checkin_already_checked_in(client, staff_token, todays_booking):
    """A second check-in attempt on the same booking returns 400"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    url = "/api/staff/checkin"
    client.post(url, json={"checkin_code": todays_booking["checkin_code"]}, headers=headers)
    response = client.post(url, json={"checkin_code": todays_booking["checkin_code"]}, headers=headers)
    assert response.status_code == 400

def test_staff_checkin_wrong_date_rejected(client, staff_token, confirmed_booking):
    """A booking not scheduled for today cannot be checked in"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(
        "/api/staff/checkin", json={"checkin_code": confirmed_booking["checkin_code"]}, headers=headers
    )
    assert response.status_code == 400

def test_staff_checkin_cancelled_booking_rejected(client, staff_token, student_token, todays_booking):
    """A cancelled booking cannot be checked in"""
    student_headers = {"Authorization": f"Bearer {student_token}"}
    client.post(f"/api/bookings/{todays_booking['booking_id']}/cancel", headers=student_headers)

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(
        "/api/staff/checkin", json={"checkin_code": todays_booking["checkin_code"]}, headers=staff_headers
    )
    assert response.status_code == 400

def test_staff_checkin_role_restriction(client, student_token, todays_booking):
    """Students cannot call the staff check-in endpoint"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        "/api/staff/checkin", json={"checkin_code": todays_booking["checkin_code"]}, headers=headers
    )
    assert response.status_code == 403


# --- STORY 4.3: NO-SHOW MANAGEMENT ---

@pytest.fixture
def overdue_booking(client, student_token):
    from datetime import timedelta as td
    headers = {"Authorization": f"Bearer {student_token}"}
    # Dated yesterday so the slot is unambiguously in the past regardless of
    # the current wall-clock time (a same-day now-minus-N-minutes offset can
    # wrap past midnight and land in the future - see guide.txt section 15).
    yesterday = date.today() - td(days=1)
    response = client.post("/api/bookings", json={
        "seat_id": 5, "date": str(yesterday),
        "start_time": "10:00", "end_time": "11:00",
    }, headers=headers)
    return response.get_json()["booking"]

def test_no_show_candidates_lists_overdue_booking(client, staff_token, overdue_booking):
    """A Confirmed booking whose slot has already passed shows up as a candidate"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.get("/api/staff/bookings/no-show-candidates", headers=headers)
    assert response.status_code == 200
    ids = [c["booking_id"] for c in response.get_json()["candidates"]]
    assert overdue_booking["booking_id"] in ids

def test_no_show_candidates_excludes_future_booking(client, staff_token, confirmed_booking):
    """A booking dated in the future is not a no-show candidate"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.get("/api/staff/bookings/no-show-candidates", headers=headers)
    assert response.status_code == 200
    ids = [c["booking_id"] for c in response.get_json()["candidates"]]
    assert confirmed_booking["booking_id"] not in ids

def test_mark_no_show_success(client, staff_token, overdue_booking):
    """Staff can mark an overdue Confirmed booking as No-Show"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(f"/api/staff/bookings/{overdue_booking['booking_id']}/no-show", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["booking"]["status"] == "No-Show"

def test_mark_no_show_frees_seat_for_new_booking(client, staff_token, overdue_booking, admin_token):
    """After marking no-show, the same seat/slot can be booked again"""
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    client.post(f"/api/staff/bookings/{overdue_booking['booking_id']}/no-show", headers=staff_headers)

    other_token = register_and_approve_student(client, admin_token, "noshowstudent2")
    response = client.post("/api/bookings", json={
        "seat_id": overdue_booking["seat_id"],
        "date": overdue_booking["booking_date"],
        "start_time": overdue_booking["start_time"],
        "end_time": overdue_booking["end_time"],
    }, headers={"Authorization": f"Bearer {other_token}"})
    assert response.status_code == 201

def test_mark_no_show_before_grace_period_rejected(client, staff_token, todays_booking):
    """A booking still within the configured grace period cannot be marked no-show yet"""
    from app import db
    from models import LibrarySettings
    with client.application.app_context():
        settings = LibrarySettings.query.first()
        settings.no_show_grace_minutes = 100000
        db.session.commit()

    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(f"/api/staff/bookings/{todays_booking['booking_id']}/no-show", headers=headers)
    assert response.status_code == 400

def test_mark_no_show_not_found(client, staff_token):
    """Unknown booking_id returns 404"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/bookings/9999/no-show", headers=headers)
    assert response.status_code == 404

def test_mark_no_show_already_cancelled_rejected(client, staff_token, student_token, todays_booking):
    """A Cancelled booking cannot be marked no-show"""
    student_headers = {"Authorization": f"Bearer {student_token}"}
    client.post(f"/api/bookings/{todays_booking['booking_id']}/cancel", headers=student_headers)

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(f"/api/staff/bookings/{todays_booking['booking_id']}/no-show", headers=staff_headers)
    assert response.status_code == 400

def test_no_show_endpoints_role_restriction(client, student_token, overdue_booking):
    """Students cannot list candidates or mark bookings as no-show"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/staff/bookings/no-show-candidates", headers=headers)
    assert response.status_code == 403

    response = client.post(f"/api/staff/bookings/{overdue_booking['booking_id']}/no-show", headers=headers)
    assert response.status_code == 403


# --- STORY 4.4: STUDY SESSION CHECK-OUT ---

@pytest.fixture
def checked_in_booking(client, staff_token, todays_booking):
    headers = {"Authorization": f"Bearer {staff_token}"}
    client.post("/api/staff/checkin", json={"checkin_code": todays_booking["checkin_code"]}, headers=headers)
    return todays_booking

def test_checkout_success(client, student_token, checked_in_booking):
    """The booking's own student can check out of a Checked-In booking"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(f"/api/bookings/{checked_in_booking['booking_id']}/checkout", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["attendance"]["booking"]["status"] == "Completed"
    assert body["attendance"]["checkout_time"] is not None

def test_checkout_by_staff_allowed(client, staff_token, checked_in_booking):
    """Staff can also check out a booking on the student's behalf"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post(f"/api/bookings/{checked_in_booking['booking_id']}/checkout", headers=headers)
    assert response.status_code == 200

def test_checkout_not_checked_in_rejected(client, student_token, confirmed_booking):
    """A booking that was never checked in cannot be checked out"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(f"/api/bookings/{confirmed_booking['booking_id']}/checkout", headers=headers)
    assert response.status_code == 400

def test_checkout_not_found(client, student_token):
    """Unknown booking_id returns 404"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/bookings/9999/checkout", headers=headers)
    assert response.status_code == 404

def test_checkout_not_owner_rejected(client, student_token, checked_in_booking, admin_token):
    """A different student cannot check out someone else's booking"""
    other_token = register_and_approve_student(client, admin_token, "checkoutstudent2")
    headers = {"Authorization": f"Bearer {other_token}"}
    response = client.post(f"/api/bookings/{checked_in_booking['booking_id']}/checkout", headers=headers)
    assert response.status_code == 403

def test_checkout_twice_rejected(client, student_token, checked_in_booking):
    """A second checkout attempt on an already-Completed booking returns 400"""
    headers = {"Authorization": f"Bearer {student_token}"}
    url = f"/api/bookings/{checked_in_booking['booking_id']}/checkout"
    client.post(url, headers=headers)
    response = client.post(url, headers=headers)
    assert response.status_code == 400


# --- STORY 5.1: OFFLINE PAYMENT RECORDING ---

@pytest.fixture
def payment_student_id(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/staff/students/register", json={
        "username": "paystudent", "password": "password123",
        "email": "paystudent@library.com", "full_name": "Pay Student",
    }, headers=headers)
    pending = client.get("/api/admin/memberships/pending", headers=headers).get_json()
    return next(s["student_id"] for s in pending if s["full_name"] == "Pay Student")

def test_staff_record_payment_success(client, staff_token, payment_student_id):
    """Staff can record an offline payment against a student"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/payments", json={
        "student_id": payment_student_id, "amount": 500, "payment_mode": "Cash"
    }, headers=headers)
    assert response.status_code == 201
    body = response.get_json()["payment"]
    assert body["amount"] == 500.0
    assert body["payment_mode"] == "Cash"
    assert body["student_id"] == payment_student_id
    assert body["full_name"] == "Pay Student"

def test_staff_record_payment_invalid_mode(client, staff_token, payment_student_id):
    """An unsupported payment_mode returns 400"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/payments", json={
        "student_id": payment_student_id, "amount": 500, "payment_mode": "Cheque"
    }, headers=headers)
    assert response.status_code == 400

def test_staff_record_payment_missing_amount(client, staff_token, payment_student_id):
    """Missing amount returns 400"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/payments", json={
        "student_id": payment_student_id, "payment_mode": "UPI"
    }, headers=headers)
    assert response.status_code == 400

def test_staff_record_payment_negative_amount(client, staff_token, payment_student_id):
    """Non-positive amount returns 400"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/payments", json={
        "student_id": payment_student_id, "amount": -50, "payment_mode": "Cash"
    }, headers=headers)
    assert response.status_code == 400

def test_staff_record_payment_student_not_found(client, staff_token):
    """Unknown student_id returns 404"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/staff/payments", json={
        "student_id": 9999, "amount": 500, "payment_mode": "Cash"
    }, headers=headers)
    assert response.status_code == 404

def test_staff_record_payment_role_restriction(client, student_token, payment_student_id):
    """Students cannot record payments"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/staff/payments", json={
        "student_id": payment_student_id, "amount": 500, "payment_mode": "Cash"
    }, headers=headers)
    assert response.status_code == 403


# --- STORY 5.2: PAYMENT HISTORY ---

@pytest.fixture
def payment_student(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/staff/students/register", json={
        "username": "payhistorystudent", "password": "password123",
        "email": "payhistorystudent@library.com", "full_name": "Pay History Student",
    }, headers=headers)
    login = client.post("/api/auth/login", json={"username": "payhistorystudent", "password": "password123"})
    token = login.get_json()["access_token"]
    pending = client.get("/api/admin/memberships/pending", headers=headers).get_json()
    student_id = next(s["student_id"] for s in pending if s["full_name"] == "Pay History Student")
    return {"token": token, "student_id": student_id}

def test_student_views_own_payment_history(client, staff_token, payment_student):
    """A student can see their own recorded payments"""
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    client.post("/api/staff/payments", json={
        "student_id": payment_student["student_id"], "amount": 300, "payment_mode": "UPI"
    }, headers=staff_headers)

    student_headers = {"Authorization": f"Bearer {payment_student['token']}"}
    response = client.get("/api/students/me/payments", headers=student_headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["total_payments"] == 1
    assert body["payments"][0]["amount"] == 300.0

def test_student_payment_history_empty_when_no_payments(client, student_token):
    """A student with no recorded payments gets an empty list, not an error"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/students/me/payments", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["total_payments"] == 0

def test_staff_views_student_payment_history(client, staff_token, payment_student):
    """Staff can view a specific student's full payment history"""
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    client.post("/api/staff/payments", json={
        "student_id": payment_student["student_id"], "amount": 200, "payment_mode": "Card"
    }, headers=staff_headers)
    client.post("/api/staff/payments", json={
        "student_id": payment_student["student_id"], "amount": 100, "payment_mode": "Cash"
    }, headers=staff_headers)

    response = client.get(
        f"/api/staff/students/{payment_student['student_id']}/payments", headers=staff_headers
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["total_payments"] == 2
    assert body["full_name"] == "Pay History Student"

def test_staff_payment_history_student_not_found(client, staff_token):
    """Unknown student_id returns 404"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.get("/api/staff/students/9999/payments", headers=headers)
    assert response.status_code == 404

def test_student_payment_history_role_restriction(client, staff_token):
    """Staff cannot call the student-only /students/me/payments route"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.get("/api/students/me/payments", headers=headers)
    assert response.status_code == 403

def test_staff_payment_history_role_restriction(client, student_token, payment_student):
    """Students cannot call the staff-only student payment history route"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get(
        f"/api/staff/students/{payment_student['student_id']}/payments", headers=headers
    )
    assert response.status_code == 403


# --- STORY 6.1: COMPLAINT SUBMISSION ---

def test_student_submit_complaint_success(client, student_token):
    """A student can submit a complaint"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/students/me/complaints", json={
        "title": "Noisy neighbors",
        "description": "Students at the next table were talking loudly.",
    }, headers=headers)
    assert response.status_code == 201
    body = response.get_json()["complaint"]
    assert body["title"] == "Noisy neighbors"
    assert body["status"] == "Open"

def test_student_submit_complaint_missing_title(client, student_token):
    """Missing title returns 400"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/students/me/complaints", json={
        "description": "Something happened"
    }, headers=headers)
    assert response.status_code == 400

def test_student_submit_complaint_missing_description(client, student_token):
    """Missing description returns 400"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/students/me/complaints", json={
        "title": "Issue"
    }, headers=headers)
    assert response.status_code == 400

def test_student_submit_complaint_missing_body(client, student_token):
    """Non-JSON body returns 400"""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post("/api/students/me/complaints", data="not json", headers=headers)
    assert response.status_code == 400

def test_student_submit_complaint_role_restriction(client, staff_token):
    """Staff cannot call the student-only complaint submission route"""
    headers = {"Authorization": f"Bearer {staff_token}"}
    response = client.post("/api/students/me/complaints", json={
        "title": "Issue", "description": "Details"
    }, headers=headers)
    assert response.status_code == 403

