from flask import request
from flask_restful import Resource
from werkzeug.security import generate_password_hash
from models import db, User, Student, MembershipPlan
from utils import staff_or_admin_required


class StaffRegisterStudentResource(Resource):
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

        return {
            "message": "Student registered successfully",
            "student": new_student.to_dict()
        }, 201


class StaffStudentDetailResource(Resource):
    @staff_or_admin_required
    def get(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "Student not found"}, 404

        data = student.to_dict()
        user = db.session.get(User, student.user_id)
        if user:
            data["email"] = user.email
            data["phone"] = user.phone
            data["username"] = user.username

        return data, 200