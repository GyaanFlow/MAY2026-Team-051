#from here gaurav code continues
from datetime import date, timedelta
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from werkzeug.security import generate_password_hash
from models import db, User, Student, MembershipPlan
from utils import admin_required, staff_or_admin_required


class StudentListResource(Resource):
    @jwt_required()
    def get(self):
        claims = get_jwt()
        if claims.get("role") not in ("Staff", "Admin"):
            return {"message": "not allowed"}, 403

        students = Student.query.all()
        result = []
        for s in students:
            result.append(s.to_dict())
        return result, 200

    @staff_or_admin_required
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument("username", type=str, required=True)
        parser.add_argument("password", type=str, required=True)
        parser.add_argument("email", type=str, required=True)
        parser.add_argument("full_name", type=str, required=True)
        parser.add_argument("address", type=str, store_missing=False)
        parser.add_argument("plan_id", type=int, store_missing=False)
        args = parser.parse_args()

        old_user = User.query.filter_by(username=args["username"]).first()
        if old_user:
            return {"message": "username already taken"}, 409

        new_user = User(
            username=args["username"],
            password_hash=generate_password_hash(args["password"]),
            email=args["email"],
            role="Student",
            status=True,
        )
        db.session.add(new_user)
        db.session.flush()

        new_student = Student(
            user_id=new_user.user_id,
            full_name=args["full_name"],
            address=args.get("address"),
            membership_status="Pending",
            plan_id=args.get("plan_id"),
        )
        db.session.add(new_student)
        db.session.commit()
        return new_student.to_dict(), 201


class StudentResource(Resource):
    @jwt_required()
    def get(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "student not found"}, 404

        claims = get_jwt()
        if claims.get("role") == "Student":
            my_id = get_jwt_identity()
            if str(student.user_id) != my_id:
                return {"message": "not allowed"}, 403

        return student.to_dict(), 200


class VerifyMembershipResource(Resource):
    @staff_or_admin_required
    def get(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "student not found"}, 404

        valid = False
        if student.membership_status == "Active" and student.membership_expiry:
            if student.membership_expiry >= date.today():
                valid = True

        return {"status": student.membership_status, "valid": valid}, 200


class ApproveStudentResource(Resource):
    @admin_required
    def patch(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "student not found"}, 404
        if student.membership_status == "Active":
            return {"message": "already active"}, 400

        plan = None
        if student.plan_id:
            plan = MembershipPlan.query.get(student.plan_id)

        student.membership_status = "Active"
        if plan and plan.duration_days:
            student.membership_expiry = date.today() + timedelta(days=plan.duration_days)

        db.session.commit()
        return {"message": "approved", "student": student.to_dict()}, 200


class RejectStudentResource(Resource):
    @admin_required
    def patch(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "student not found"}, 404

        student.membership_status = "Rejected"
        db.session.commit()
        return {"message": "rejected", "student": student.to_dict()}, 200


class DisapproveStudentResource(Resource):
    @admin_required
    def patch(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "student not found"}, 404
        if student.membership_status != "Active":
            return {"message": "only active can be disapproved"}, 400

        student.membership_status = "Disapproved"
        student.membership_expiry = None
        db.session.commit()
        return {"message": "disapproved", "student": student.to_dict()}, 200