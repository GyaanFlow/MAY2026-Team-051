from datetime import time
from flask import Flask, render_template
from flask_cors import CORS
from flask_restful import Api
from flask_jwt_extended import JWTManager
from sqlalchemy import inspect, text
from werkzeug.security import generate_password_hash

from config import Config
from models import db, User, MembershipPlan, LibrarySettings, Seat, Booking
from resources.auth import LoginResource
from resources.staff import StaffListResource, StaffResource, DeactivateStaffResource
from resources.membership import (
    MembershipPlanListResource,
    MembershipPlanResource,
    StaffMembershipPlanListResource,
)
from resources.settings import LibrarySettingsResource
from resources.seats import SeatListResource, SeatResource, SeatAvailabilityResource, StaffSeatListResource
from resources.profile import ProfileResource, ResetPasswordResource
from resources.student_profile import StudentMeResource
from resources.staff_students import (
    StaffRegisterStudentResource,
    StaffStudentListResource,
    StaffStudentDetailResource,
    StaffVerifyStudentMembershipResource,
)
from resources.admin_memberships import (
    PendingMembershipsResource,
    MembershipListResource,
    ApproveMembershipResource,
    RejectMembershipResource,
    DisapproveMembershipResource,
    MembershipDetailResource,
)
from resources.bookings import (
    BookingListResource,
    BookingDetailResource,
    BookingCancelResource,
    BookingCheckoutResource,
    StudentBookingHistoryResource,
    StaffTodayBookingsResource,
    WalkInBookingResource,
)
# from resources.checkin import StaffCheckinResource
from resources.extension_requests import (
    StudentExtensionRequestResource,
    StaffExtensionRequestListResource,
    StaffExtensionRequestApproveResource,
    StaffExtensionRequestRejectResource,
)
# from resources.no_show import NoShowCandidatesResource, MarkNoShowResource
from resources.payments import (
    StaffPaymentListResource,
    StudentPaymentHistoryResource,
    StaffStudentPaymentHistoryResource,
)
# from resources.complaints import (
#     StudentComplaintCreateResource,
#     StaffComplaintListResource,
#     StaffComplaintUpdateResource,
# )
# from resources.announcements import (
#     AdminAnnouncementListCreateResource,
#     AnnouncementListResource,
#     AdminAnnouncementDetailResource,
# )
# from resources.reports import (
#     OccupancyReportResource,
#     PeakHoursReportResource,
#     RevenueReportResource,
#     MembershipStatsReportResource,
# )

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    JWTManager(app)

    api = Api(app, prefix="/api")

    api.add_resource(LoginResource, "/auth/login")

    api.add_resource(StaffListResource, "/admin/staff")
    api.add_resource(StaffResource, "/admin/staff/<int:user_id>")
    api.add_resource(DeactivateStaffResource, "/admin/staff/<int:user_id>/deactivate")

    api.add_resource(MembershipPlanListResource, "/admin/membership-plans")
    api.add_resource(StaffMembershipPlanListResource, "/staff/membership-plans")
    api.add_resource(MembershipPlanResource, "/admin/membership-plans/<int:plan_id>")

    api.add_resource(LibrarySettingsResource, "/admin/settings")

    api.add_resource(SeatListResource, "/admin/seats")
    api.add_resource(SeatResource, "/admin/seats/<int:seat_id>")

    api.add_resource(ProfileResource, "/profile")
    api.add_resource(ResetPasswordResource, "/auth/reset-password")

    api.add_resource(StudentMeResource, "/students/me")

    api.add_resource(StaffRegisterStudentResource, "/staff/students/register")
    api.add_resource(StaffStudentListResource, "/staff/students")
    api.add_resource(StaffStudentDetailResource, "/staff/students/<int:student_id>")
    api.add_resource(StaffVerifyStudentMembershipResource, "/staff/students/<int:student_id>/verify")

    api.add_resource(PendingMembershipsResource, "/admin/memberships/pending")
    api.add_resource(MembershipListResource, "/admin/memberships")
    api.add_resource(ApproveMembershipResource, "/admin/memberships/<int:membership_id>/approve")
    api.add_resource(RejectMembershipResource, "/admin/memberships/<int:membership_id>/reject")
    api.add_resource(DisapproveMembershipResource, "/admin/memberships/<int:membership_id>/disapprove")
    api.add_resource(MembershipDetailResource, "/admin/memberships/<int:membership_id>")

    api.add_resource(SeatAvailabilityResource, "/seats/availability")
    api.add_resource(BookingListResource, "/bookings")
    api.add_resource(BookingDetailResource, "/bookings/<int:booking_id>")
    api.add_resource(BookingCancelResource, "/bookings/<int:booking_id>/cancel")
    api.add_resource(BookingCheckoutResource, "/bookings/<int:booking_id>/checkout")

    api.add_resource(StudentBookingHistoryResource, "/students/me/bookings")
    api.add_resource(StaffTodayBookingsResource, "/staff/bookings/today")
    api.add_resource(WalkInBookingResource, "/staff/bookings/walk-in")
    api.add_resource(
    StaffSeatListResource,
    "/staff/seats"
)

    # api.add_resource(StaffCheckinResource, "/staff/checkin")
    api.add_resource(
        StudentExtensionRequestResource,
        "/students/me/bookings/<int:booking_id>/extension-request",
    )
    api.add_resource(StaffExtensionRequestListResource, "/staff/extension-requests")
    api.add_resource(
        StaffExtensionRequestApproveResource,
        "/staff/extension-requests/<int:extension_request_id>/approve",
    )
    api.add_resource(
        StaffExtensionRequestRejectResource,
        "/staff/extension-requests/<int:extension_request_id>/reject",
    )

    # api.add_resource(NoShowCandidatesResource, "/staff/bookings/no-show-candidates")
    # api.add_resource(
    #     MarkNoShowResource,
    #     "/staff/bookings/<int:booking_id>/no-show",
    # )

    api.add_resource(StaffPaymentListResource, "/staff/payments")
    api.add_resource(StudentPaymentHistoryResource, "/students/me/payments")
    api.add_resource(
        StaffStudentPaymentHistoryResource,
        "/staff/students/<int:student_id>/payments",
    )

    # api.add_resource(StudentComplaintCreateResource, "/students/me/complaints")
    # api.add_resource(StaffComplaintListResource, "/staff/complaints")
    # api.add_resource(
    #     StaffComplaintUpdateResource,
    #     "/staff/complaints/<int:complaint_id>",
    # )

    # api.add_resource(AdminAnnouncementListCreateResource, "/admin/announcements")
    # api.add_resource(AnnouncementListResource, "/announcements")
    # api.add_resource(
    #     AdminAnnouncementDetailResource,
    #     "/admin/announcements/<int:announcement_id>",
    # )

    # api.add_resource(OccupancyReportResource, "/admin/reports/occupancy")
    # api.add_resource(PeakHoursReportResource, "/admin/reports/peak-hours")
    # api.add_resource(RevenueReportResource, "/admin/reports/revenue")
    # api.add_resource(MembershipStatsReportResource, "/admin/reports/membership-stats")

    # Frontend routes. The frontend templates/static assets are served by
    # this same Flask application, so browser calls to /api/* remain same-origin.
    @app.route("/")
    def login_page():
        return render_template("login.html")

    @app.route("/dashboard")
    def student_dashboard_page():
        return render_template("dashboard.html")

    @app.route("/staff/dashboard")
    def staff_dashboard_page():
        return render_template("staff_dashboard.html")

    @app.route("/admin/dashboard")
    def admin_dashboard_page():
        return render_template("admin_dashboard.html")

    with app.app_context():
        db.create_all()
        upgrade_sqlite_schema()
        seed_data()

    return app


def upgrade_sqlite_schema():
    """Apply compatibility changes needed by older local SQLite databases."""
    if db.engine.dialect.name != "sqlite":
        return

    membership_columns = {column["name"] for column in inspect(db.engine).get_columns("membership_plans")}
    if "is_active" not in membership_columns:
        db.session.execute(
            text("ALTER TABLE membership_plans ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1")
        )
        db.session.commit()

    # Story 1.1: staff profile fields. These are nullable so existing
    # users/databases remain backward-compatible.
    user_columns = {column["name"] for column in inspect(db.engine).get_columns("users")}
    staff_columns = {
        "full_name": "ALTER TABLE users ADD COLUMN full_name VARCHAR(150)",
        "position": "ALTER TABLE users ADD COLUMN position VARCHAR(100)",
        "address": "ALTER TABLE users ADD COLUMN address TEXT",
    }
    changed = False
    for column_name, statement in staff_columns.items():
        if column_name not in user_columns:
            db.session.execute(text(statement))
            changed = True
    student_columns = {column["name"] for column in inspect(db.engine).get_columns("students")}
    student_columns_to_add = {
        "roll_number": "ALTER TABLE students ADD COLUMN roll_number VARCHAR(100)",
        "dob": "ALTER TABLE students ADD COLUMN dob DATE",
        "gender": "ALTER TABLE students ADD COLUMN gender VARCHAR(50)",
    }
    for column_name, statement in student_columns_to_add.items():
        if column_name not in student_columns:
            db.session.execute(text(statement))
            changed = True

    settings_columns = {column["name"] for column in inspect(db.engine).get_columns("library_settings")}
    settings_columns_to_add = {
        "weekly_hours": "ALTER TABLE library_settings ADD COLUMN weekly_hours TEXT",
        "holiday_closures": "ALTER TABLE library_settings ADD COLUMN holiday_closures TEXT",
        "min_booking_minutes": "ALTER TABLE library_settings ADD COLUMN min_booking_minutes INTEGER",
        "max_booking_hours": "ALTER TABLE library_settings ADD COLUMN max_booking_hours INTEGER",
        "max_bookings_per_day": "ALTER TABLE library_settings ADD COLUMN max_bookings_per_day INTEGER",
        "waitlist_enabled": "ALTER TABLE library_settings ADD COLUMN waitlist_enabled BOOLEAN DEFAULT 0",
        "seat_zones": "ALTER TABLE library_settings ADD COLUMN seat_zones TEXT",
    }
    for column_name, statement in settings_columns_to_add.items():
        if column_name not in settings_columns:
            db.session.execute(text(statement))
            changed = True

    inspector = inspect(db.engine)
    if inspector.has_table("payments"):
        payment_columns = {column["name"] for column in inspector.get_columns("payments")}
        if "purpose" not in payment_columns:
            db.session.execute(text("ALTER TABLE payments ADD COLUMN purpose VARCHAR(200)"))
            changed = True

    if changed:
        db.session.commit()


def seed_data():
    admin = User.query.filter_by(role="Admin").first()
    if not admin:
        admin = User(
            username="admin",
            password_hash=generate_password_hash("test-password"),
            email="admin@library.com",
            role="Admin",
            status=True,
        )
        db.session.add(admin)

    first_plan = MembershipPlan.query.first()
    if not first_plan:
        db.session.add_all([
            MembershipPlan(plan_name="Weekly", duration_days=7, price=100),
            MembershipPlan(plan_name="Monthly", duration_days=30, price=500),
            MembershipPlan(plan_name="Yearly", duration_days=365, price=3000),
        ])
    if not Seat.query.first():
        db.session.add_all([
            Seat(seat_number=f"S{i:02d}", seat_type="Standard", is_active=True)
            for i in range(1, 21)
        ])
        db.session.commit()

    if not LibrarySettings.query.first():
        db.session.add(LibrarySettings(open_time=time(9, 0), close_time=time(21, 0)))

    db.session.commit()


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
