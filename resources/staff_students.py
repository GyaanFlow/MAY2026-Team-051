from datetime import date
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

        if len(password) < 8:
            return {"message": "Password must be at least 8 characters"}, 400

        if User.query.filter_by(username=username).first():
            return {"message": "Username already taken"}, 409

        roll_number = data.get("roll_number")
        if roll_number and Student.query.filter_by(roll_number=roll_number).first():
            return {"message": "Roll number already registered"}, 409

        plan_id = data.get("plan_id")
        plan = None
        if plan_id is not None:
            plan = db.session.get(MembershipPlan, plan_id)
            if not plan:
                return {"message": "Membership plan not found"}, 404
            if not plan.is_active:
                return {"message": "Membership plan is inactive"}, 400

        dob = None
        if data.get("dob"):
            try:
                dob = date.fromisoformat(data["dob"])
            except (TypeError, ValueError):
                return {"message": "dob must be in YYYY-MM-DD format"}, 400

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
            roll_number=roll_number,
            dob=dob,
            gender=data.get("gender"),
            address=data.get("address"),
            membership_status="Pending",
            plan_id=plan_id,
        )
        db.session.add(new_student)
        db.session.commit()

        response = new_student.to_dict()
        response.update({
            "username": new_user.username,
            "email": new_user.email,
            "phone": new_user.phone,
            "message": "Student registered successfully",
        })
        return response, 201


class StaffStudentListResource(Resource):
    @staff_or_admin_required
    def get(self):
        status_filter = request.args.get("status")
        query = Student.query
        if status_filter:
            query = query.filter_by(membership_status=status_filter)

        students = query.order_by(Student.student_id.desc()).all()
        result = []
        for student in students:
            item = student.to_dict()
            user = db.session.get(User, student.user_id)
            if user:
                item.update({
                    "username": user.username,
                    "email": user.email,
                    "phone": user.phone,
                    "account_active": user.status,
                })
            if student.plan_id:
                plan = db.session.get(MembershipPlan, student.plan_id)
                if plan:
                    item["membership_plan"] = plan.to_dict()
            result.append(item)
        return result, 200


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
            data["status"] = user.status
        if student.plan_id:
            plan = db.session.get(MembershipPlan, student.plan_id)
            if plan:
                data["membership_plan"] = plan.to_dict()
        return data, 200


class StaffVerifyStudentMembershipResource(Resource):
    @staff_or_admin_required
    def get(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "Student not found"}, 404

        valid = False
        if student.membership_status == "Active" and student.membership_expiry:
            valid = student.membership_expiry >= date.today()

        return {
            "student_id": student.student_id,
            "full_name": student.full_name,
            "roll_number": student.roll_number,
            "status": student.membership_status,
            "valid": valid,
            "membership_expiry": str(student.membership_expiry) if student.membership_expiry else None,
            "plan_id": student.plan_id,
        }, 200
