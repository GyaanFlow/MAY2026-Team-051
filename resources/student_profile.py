from datetime import date
from flask import request
from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity
from models import db, User, Student, MembershipPlan
from utils import student_required
from datetime import date


class StudentMeResource(Resource):
    @student_required
    def get(self):
        uid = int(get_jwt_identity())
        user = db.session.get(User, uid)
        student = Student.query.filter_by(user_id=uid).first()
        if not user or not student:
            return {"message": "Student not found"}, 404

        valid = False
        if student.membership_status == "Active" and student.membership_expiry:
            if student.membership_expiry >= date.today():
                valid = True

        data = student.to_dict()
        plan = None

        if student.plan_id:
            plan = db.session.get(MembershipPlan, student.plan_id)

        data["membership_plan"] = plan.to_dict() if plan else None
        data["username"] = user.username
        data["email"] = user.email
        data["phone"] = user.phone
        data["membership_valid"] = valid
        return data, 200

    @student_required
    def put(self):
        uid = int(get_jwt_identity())
        user = db.session.get(User, uid)
        student = Student.query.filter_by(user_id=uid).first()
        if not user or not student:
            return {"message": "Student not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        if "email" in data:
            if not data.get("email"):
                return {"message": "Email cannot be empty"}, 400
            user.email = data.get("email")

        if "phone" in data:
            user.phone = data.get("phone")

        if "full_name" in data:
            if not data.get("full_name"):
                return {"message": "Full name cannot be empty"}, 400
            student.full_name = data.get("full_name")

        if "address" in data:
            student.address = data.get("address")

        if "dob" in data:
            dob_value = data.get("dob")

            if dob_value:
                try:
                    student.dob = date.fromisoformat(dob_value)
                except (ValueError, TypeError):
                    return {
                "message": "Invalid date of birth. Use YYYY-MM-DD format."
            }, 400
                
            else:
                student.dob = None

        if "gender" in data:
            student.gender = data.get("gender")

        db.session.commit()
        return {"message": "Profile updated", "student": student.to_dict()}, 200
