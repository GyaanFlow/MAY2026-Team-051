from datetime import date, timedelta
from flask import request
from flask_restful import Resource
from models import db, Student, MembershipPlan
from utils import admin_required


def _student_with_plan(student):
    data = student.to_dict()
    if student.plan_id:
        plan = db.session.get(MembershipPlan, student.plan_id)
        data["membership_plan"] = plan.to_dict() if plan else None
    else:
        data["membership_plan"] = None
    return data


class PendingMembershipsResource(Resource):
    @admin_required
    def get(self):
        students = Student.query.filter_by(membership_status="Pending").all()
        return [_student_with_plan(s) for s in students], 200


class MembershipListResource(Resource):
    @admin_required
    def get(self):
        status_filter = request.args.get("status")

        query = Student.query
        if status_filter:
            query = query.filter_by(membership_status=status_filter)

        students = query.all()
        return [_student_with_plan(s) for s in students], 200


class ApproveMembershipResource(Resource):
    @admin_required
    def post(self, membership_id):
        student = Student.query.filter_by(student_id=membership_id).first()
        if not student:
            return {"message": "Membership not found"}, 404

        if student.membership_status == "Active":
            return {"message": "Membership is already active"}, 400

        plan = None
        if student.plan_id is not None:
            plan = db.session.get(MembershipPlan, student.plan_id)
            if not plan:
                return {"message": "Membership plan not found"}, 404

        student.membership_status = "Active"
        if plan and plan.duration_days:
            student.membership_expiry = date.today() + timedelta(days=plan.duration_days)

        db.session.commit()
        return {"message": "Membership approved", "student": _student_with_plan(student)}, 200


class RejectMembershipResource(Resource):
    @admin_required
    def post(self, membership_id):
        student = Student.query.filter_by(student_id=membership_id).first()
        if not student:
            return {"message": "Membership not found"}, 404

        if student.membership_status != "Pending":
            return {"message": "Only pending memberships can be rejected"}, 400

        student.membership_status = "Rejected"
        student.membership_expiry = None
        db.session.commit()
        return {"message": "Membership rejected", "student": _student_with_plan(student)}, 200


class DisapproveMembershipResource(Resource):
    @admin_required
    def post(self, membership_id):
        student = Student.query.filter_by(student_id=membership_id).first()
        if not student:
            return {"message": "Membership not found"}, 404

        if student.membership_status != "Active":
            return {"message": "Only active memberships can be disapproved"}, 400

        student.membership_status = "Disapproved"
        student.membership_expiry = None
        db.session.commit()
        return {"message": "Membership disapproved", "student": _student_with_plan(student)}, 200


class MembershipDetailResource(Resource):
    @admin_required
    def put(self, membership_id):
        student = Student.query.filter_by(student_id=membership_id).first()
        if not student:
            return {"message": "Membership not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        if "plan_id" in data:
            plan_id = data.get("plan_id")
            if plan_id is not None:
                plan = db.session.get(MembershipPlan, plan_id)
                if not plan:
                    return {"message": "Membership plan not found"}, 404
            student.plan_id = plan_id

        if "extend_days" in data:
            try:
                extend_days = int(data.get("extend_days"))
            except (TypeError, ValueError):
                return {"message": "extend_days must be a number"}, 400

            base_date = student.membership_expiry if student.membership_expiry else date.today()
            student.membership_expiry = base_date + timedelta(days=extend_days)

        if "membership_expiry" in data:
            try:
                student.membership_expiry = date.fromisoformat(data.get("membership_expiry"))
            except (TypeError, ValueError):
                return {"message": "membership_expiry must be in YYYY-MM-DD format"}, 400

        db.session.commit()
        return {"message": "Membership updated", "student": _student_with_plan(student)}, 200
