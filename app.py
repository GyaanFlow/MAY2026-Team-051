from datetime import time
from flask import Flask
from flask_cors import CORS
from flask_restful import Api
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash

from config import Config
from models import db, User, MembershipPlan, LibrarySettings, Seat, Booking
from resources.auth import LoginResource
from resources.staff import StaffListResource, StaffResource, DeactivateStaffResource
from resources.membership import MembershipPlanListResource, MembershipPlanResource
from resources.settings import LibrarySettingsResource
from resources.seats import SeatListResource, SeatResource, SeatAvailabilityResource
from resources.profile import ProfileResource, ResetPasswordResource
from resources.student_profile import StudentMeResource
from resources.staff_students import (
    StaffRegisterStudentResource,
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
from resources.extension_requests import (
    StudentExtensionRequestResource,
    StaffExtensionRequestListResource,
    StaffExtensionRequestApproveResource,
    StaffExtensionRequestRejectResource,
)
from resources.checkin import StaffCheckinResource
from resources.no_show import NoShowCandidatesResource, MarkNoShowResource
from resources.payments import (
    StaffPaymentListResource,
    StudentPaymentHistoryResource,
    StaffStudentPaymentHistoryResource,
)

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
    api.add_resource(MembershipPlanResource, "/admin/membership-plans/<int:plan_id>")

    api.add_resource(LibrarySettingsResource, "/admin/settings")

    api.add_resource(SeatListResource, "/admin/seats")
    api.add_resource(SeatResource, "/admin/seats/<int:seat_id>")

    api.add_resource(ProfileResource, "/profile")
    api.add_resource(ResetPasswordResource, "/auth/reset-password")

    api.add_resource(StudentMeResource, "/students/me")

    api.add_resource(StaffRegisterStudentResource, "/staff/students/register")
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
        StudentExtensionRequestResource, "/students/me/bookings/<int:booking_id>/extension-request"
    )
    api.add_resource(StaffExtensionRequestListResource, "/staff/extension-requests")
    api.add_resource(StaffExtensionRequestApproveResource, "/staff/extension-requests/<int:extension_request_id>/approve")
    api.add_resource(StaffExtensionRequestRejectResource, "/staff/extension-requests/<int:extension_request_id>/reject")

    api.add_resource(StaffCheckinResource, "/staff/checkin")

    api.add_resource(NoShowCandidatesResource, "/staff/bookings/no-show-candidates")
    api.add_resource(MarkNoShowResource, "/staff/bookings/<int:booking_id>/no-show")

    api.add_resource(StaffPaymentListResource, "/staff/payments")
    api.add_resource(StudentPaymentHistoryResource, "/students/me/payments")
    api.add_resource(StaffStudentPaymentHistoryResource, "/staff/students/<int:student_id>/payments")

    with app.app_context():
        db.create_all()
        seed_data()

    return app


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