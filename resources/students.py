from datetime import date, timedelta
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from werkzeug.security import generate_password_hash
from models import db, User, Student, MembershipPlan
from utils import admin_required, staff_or_admin_required


class StudentListResource(Resource):
    @jwt_required()
    def get(self):
        claims = get_jwt()
        if claims.get("role") not in ("Staff", "Admin"):
            return {"message": "Not allowed"}, 403

        students = Student.query.all()
        return [s.to_dict() for s in students], 200

    @staff_or_admin_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        username = data.get("username")
        password = data.get("password")
        email = data.get("email")
        full_name = data.get("full_name")

        if not username or not password or not email or not full_name:
            return {"message": "Username, password, email and full_name are required"}, 400

        if User.query.filter_by(username=username).first():
            return {"message": "Username already taken"}, 409

        plan_id = data.get("plan_id")
        if plan_id is not None:
            plan = db.session.get(MembershipPlan, plan_id)
            if not plan:
                return {"message": "Membership plan not found"}, 404

        new_user = User(
            username=username,
            password_hash=generate_password_hash(password),
            email=email,
            id_type=data.get("id_type"),
            id_number=data.get("id_number"),
            phone=data.get("phone"),
            role="Student",
            status=True,
        )
        db.session.add(new_user)
        db.session.flush()

        new_student = Student(
            user_id=new_user.user_id,
            full_name=full_name,
            address=data.get("address"),
            membership_status="Pending",
            plan_id=plan_id,
        )
        db.session.add(new_student)
        db.session.commit()
        return new_student.to_dict(), 201


class StudentResource(Resource):
    @jwt_required()
    def get(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "Student not found"}, 404

        claims = get_jwt()
        if claims.get("role") == "Student":
            my_id = get_jwt_identity()
            if str(student.user_id) != my_id:
                return {"message": "Not allowed"}, 403

        return student.to_dict(), 200


class VerifyMembershipResource(Resource):
    @staff_or_admin_required
    def get(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "Student not found"}, 404

        valid = False
        if student.membership_status == "Active" and student.membership_expiry:
            if student.membership_expiry >= date.today():
                valid = True

        return {
            "status": student.membership_status,
            "valid": valid,
            "membership_expiry": str(student.membership_expiry) if student.membership_expiry else None,
        }, 200


class ApproveStudentResource(Resource):
    @admin_required
    def patch(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "Student not found"}, 404

        if student.membership_status == "Active":
            return {"message": "Student is already active"}, 400

        plan = None
        if student.plan_id is not None:
            plan = db.session.get(MembershipPlan, student.plan_id)
            if not plan:
                return {"message": "Membership plan not found"}, 404

        student.membership_status = "Active"
        if plan and plan.duration_days:
            student.membership_expiry = date.today() + timedelta(days=plan.duration_days)

        db.session.commit()
        return {"message": "Student approved", "student": student.to_dict()}, 200


class RejectStudentResource(Resource):
    @admin_required
    def patch(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "Student not found"}, 404

        student.membership_status = "Rejected"
        student.membership_expiry = None
        db.session.commit()
        return {"message": "Student rejected", "student": student.to_dict()}, 200


class DisapproveStudentResource(Resource):
    @admin_required
    def patch(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "Student not found"}, 404

        if student.membership_status != "Active":
            return {"message": "Only active memberships can be disapproved"}, 400

        student.membership_status = "Disapproved"
        student.membership_expiry = None
        db.session.commit()
        return {"message": "Student membership disapproved", "student": student.to_dict()}, 200