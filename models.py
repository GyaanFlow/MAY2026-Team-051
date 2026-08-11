from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(150), nullable=False)
    id_type = db.Column(db.String(255), nullable=True)
    id_number = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    role = db.Column(db.String(20), nullable=False)
    status = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "email": self.email,
            "id_type": self.id_type,
            "id_number": self.id_number,
            "phone": self.phone,
            "role": self.role,
            "status": self.status,
        }


class MembershipPlan(db.Model):
    __tablename__ = "membership_plans"

    plan_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    plan_name = db.Column(db.String(100), nullable=False)
    duration_days = db.Column(db.Integer, nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "plan_id": self.plan_id,
            "plan_name": self.plan_name,
            "duration_days": self.duration_days,
            "price": float(self.price) if self.price is not None else None,
            "is_active": self.is_active,
        }


class Student(db.Model):
    __tablename__ = "students"

    student_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    address = db.Column(db.Text, nullable=True)
    membership_status = db.Column(db.String(20), default="Pending", nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey("membership_plans.plan_id"), nullable=True)
    membership_expiry = db.Column(db.Date, nullable=True)

    def to_dict(self):
        return {
            "student_id": self.student_id,
            "user_id": self.user_id,
            "full_name": self.full_name,
            "address": self.address,
            "membership_status": self.membership_status,
            "plan_id": self.plan_id,
            "membership_expiry": str(self.membership_expiry) if self.membership_expiry else None,
        }

class Seat(db.Model):
    __tablename__ = "seats"

    seat_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    seat_number = db.Column(db.String(20), unique=True, nullable=False)
    seat_type = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "seat_id": self.seat_id,
            "seat_number": self.seat_number,
            "seat_type": self.seat_type,
            "is_active": self.is_active,
        }


class LibrarySettings(db.Model):
    __tablename__ = "library_settings"

    setting_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    open_time = db.Column(db.Time, nullable=True)
    close_time = db.Column(db.Time, nullable=True)
    total_seats = db.Column(db.Integer, nullable=True)
    no_show_grace_minutes = db.Column(db.Integer, nullable=True)
    cancellation_period = db.Column(db.Integer, nullable=True)
    max_booking_days_ahead = db.Column(db.Integer, nullable=True)
    extension_limit_minutes = db.Column(db.Integer, nullable=True)
    updated_by = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)
    updated_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "setting_id": self.setting_id,
            "open_time": self.open_time.strftime("%H:%M") if self.open_time else None,
            "close_time": self.close_time.strftime("%H:%M") if self.close_time else None,
            "total_seats": self.total_seats,
            "no_show_grace_minutes": self.no_show_grace_minutes,
            "cancellation_period": self.cancellation_period,
            "max_booking_days_ahead": self.max_booking_days_ahead,
            "extension_limit_minutes": self.extension_limit_minutes,
            "updated_by": self.updated_by,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Booking(db.Model):
    __tablename__ = "bookings"

    booking_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    seat_id = db.Column(db.Integer, db.ForeignKey("seats.seat_id"), nullable=False)
    booking_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    checkin_code = db.Column(db.String(20), unique=True, nullable=False)
    status = db.Column(db.String(20), default="Confirmed", nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now(), nullable=False)

    def to_dict(self):
        return {
            "booking_id": self.booking_id,
            "user_id": self.user_id,
            "seat_id": self.seat_id,
            "booking_date": str(self.booking_date),
            "start_time": self.start_time.strftime("%H:%M"),
            "end_time": self.end_time.strftime("%H:%M"),
            "checkin_code": self.checkin_code,
            "status": self.status,
            "created_at": str(self.created_at),
        }


class Attendance(db.Model):
    __tablename__ = "attendance"

    attendance_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.booking_id"), nullable=False)
    checkin_time = db.Column(db.DateTime, nullable=False)
    checkout_time = db.Column(db.DateTime, nullable=True)
    verified_by = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)

    def to_dict(self):
        return {
            "attendance_id": self.attendance_id,
            "booking_id": self.booking_id,
            "checkin_time": str(self.checkin_time) if self.checkin_time else None,
            "checkout_time": str(self.checkout_time) if self.checkout_time else None,
            "verified_by": self.verified_by,
        }


class ExtensionRequest(db.Model):
    __tablename__ = "extension_requests"

    extension_request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.booking_id"), nullable=False)
    requested_end_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default="Pending", nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)
    requested_at = db.Column(db.DateTime, default=db.func.now(), nullable=False)

    def to_dict(self):
        return {
            "extension_request_id": self.extension_request_id,
            "booking_id": self.booking_id,
            "requested_end_time": self.requested_end_time.strftime("%H:%M"),
            "status": self.status,
            "approved_by": self.approved_by,
            "requested_at": str(self.requested_at),
        }