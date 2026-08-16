from flask import request
from flask_restful import Resource
from models import db, MembershipPlan
from utils import admin_required, staff_or_admin_required


class MembershipPlanListResource(Resource):
    @admin_required
    def get(self):
        plans = MembershipPlan.query.all()
        return [p.to_dict() for p in plans], 200

    @admin_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        plan_name = data.get("plan_name")
        if not plan_name:
            return {"message": "plan_name is required"}, 400

        try:
            duration_days = int(data.get("duration_days"))
        except (TypeError, ValueError):
            return {"message": "duration_days must be a number"}, 400
        if duration_days <= 0:
            return {"message": "duration_days must be positive"}, 400

        try:
            price = float(data.get("price"))
        except (TypeError, ValueError):
            return {"message": "price must be a number"}, 400
        if price < 0:
            return {"message": "price cannot be negative"}, 400

        plan = MembershipPlan(plan_name=plan_name, duration_days=duration_days, price=price)
        db.session.add(plan)
        db.session.commit()
        return plan.to_dict(), 201


class MembershipPlanResource(Resource):
    @admin_required
    def put(self, plan_id):
        plan = db.session.get(MembershipPlan, plan_id)
        if not plan:
            return {"message": "Membership plan not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        if "plan_name" in data:
            if not data.get("plan_name"):
                return {"message": "plan_name cannot be empty"}, 400
            plan.plan_name = data.get("plan_name")

        if "duration_days" in data:
            try:
                duration_days = int(data.get("duration_days"))
            except (TypeError, ValueError):
                return {"message": "duration_days must be a number"}, 400
            if duration_days <= 0:
                return {"message": "duration_days must be positive"}, 400
            plan.duration_days = duration_days

        if "price" in data:
            try:
                price = float(data.get("price"))
            except (TypeError, ValueError):
                return {"message": "price must be a number"}, 400
            if price < 0:
                return {"message": "price cannot be negative"}, 400
            plan.price = price

        db.session.commit()
        return plan.to_dict(), 200

    @admin_required
    def delete(self, plan_id):
        plan = db.session.get(MembershipPlan, plan_id)
        if not plan:
            return {"message": "Membership plan not found"}, 404

        if not plan.is_active:
            return {"message": "Plan is already retired"}, 400

        plan.is_active = False
        db.session.commit()
        return {"message": "Membership plan retired", "plan": plan.to_dict()}, 200

class StaffMembershipPlanListResource(Resource):
    """Return active membership plans that staff can assign during registration."""

    @staff_or_admin_required
    def get(self):
        plans = MembershipPlan.query.filter_by(is_active=True).all()
        return [p.to_dict() for p in plans], 200
