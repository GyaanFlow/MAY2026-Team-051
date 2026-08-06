from flask import Flask
from flask_cors import CORS
from flask_restful import Api
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash

from config import Config
from models import db, User, MembershipPlan, Seat, Booking
from resources.auth import LoginResource
from resources.staff import StaffListResource, StaffResource, DeactivateStaffResource
from resources.membership import MembershipPlanListResource, MembershipPlanResource
from resources.students import (
    StudentListResource,
    StudentResource,
    VerifyMembershipResource,
    ApproveStudentResource,
    RejectStudentResource,
    DisapproveStudentResource,
)
from resources.profile import ProfileResource, ResetPasswordResource
from resources.staff_students import StaffRegisterStudentResource, StaffStudentDetailResource
from resources.admin_memberships import (
    PendingMembershipsResource,
    MembershipListResource,
    ApproveMembershipResource,
    RejectMembershipResource,
    MembershipDetailResource,
)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    JWTManager(app)

    api = Api(app, prefix="/api")

    api.add_resource(LoginResource, "/auth/login")

    api.add_resource(StaffListResource, "/staff")
    api.add_resource(StaffResource, "/staff/<int:user_id>")
    api.add_resource(DeactivateStaffResource, "/staff/<int:user_id>/deactivate")

    api.add_resource(MembershipPlanListResource, "/membership-plans")
    api.add_resource(MembershipPlanResource, "/membership-plans/<int:plan_id>")

    api.add_resource(StudentListResource, "/students")
    api.add_resource(StudentResource, "/students/<int:student_id>")
    api.add_resource(VerifyMembershipResource, "/students/<int:student_id>/verify")
    api.add_resource(ApproveStudentResource, "/students/<int:student_id>/approve")
    api.add_resource(RejectStudentResource, "/students/<int:student_id>/reject")
    api.add_resource(DisapproveStudentResource, "/students/<int:student_id>/disapprove")

    api.add_resource(ProfileResource, "/profile")
    api.add_resource(ResetPasswordResource, "/auth/reset-password")

    api.add_resource(StaffRegisterStudentResource, "/staff/students/register")
    api.add_resource(StaffStudentDetailResource, "/staff/students/<int:student_id>")

    api.add_resource(PendingMembershipsResource, "/admin/memberships/pending")
    api.add_resource(MembershipListResource, "/admin/memberships")
    api.add_resource(ApproveMembershipResource, "/admin/memberships/<int:membership_id>/approve")
    api.add_resource(RejectMembershipResource, "/admin/memberships/<int:membership_id>/reject")
    api.add_resource(MembershipDetailResource, "/admin/memberships/<int:membership_id>")

         

    with app.app_context():
        db.create_all()
        seed_data()

    return app


def seed_data():
    admin = User.query.filter_by(role="Admin").first()
    if not admin:
        admin = User(
            username="admin",
            password_hash=generate_password_hash("admin123"),
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

    db.session.commit()


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)