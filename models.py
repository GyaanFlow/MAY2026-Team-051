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

    def to_dict(self):
        return {
            "plan_id": self.plan_id,
            "plan_name": self.plan_name,
            "duration_days": self.duration_days,
            "price": float(self.price) if self.price is not None else None,
        }


class Student(db.Model):
    __tablename__ = "students"

    student_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"))
    full_name = db.Column(db.String(150))
    address = db.Column(db.Text)
    membership_status = db.Column(db.String(20), default="Pending")
    plan_id = db.Column(db.Integer, db.ForeignKey("membership_plans.plan_id"))
    membership_expiry = db.Column(db.Date)

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