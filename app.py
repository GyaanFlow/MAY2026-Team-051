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
