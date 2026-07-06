from flask import request
from flask_restful import Resource
from models import db, MembershipPlan
from utils import admin_required


class MembershipPlanListResource(Resource):
    @admin_required
    def get(self):
        plans = MembershipPlan.query.all()
        return [p.to_dict() for p in plans], 200


class MembershipPlanResource(Resource):
    @admin_required
    def put(self, plan_id):
        plan = db.session.get(MembershipPlan, plan_id)
        if not plan:
            return {"message": "Membership plan not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        if "price" not in data:
            return {"message": "Price is required"}, 400

        try:
            price = float(data.get("price"))
        except (TypeError, ValueError):
            return {"message": "Price must be a number"}, 400

        if price < 0:
            return {"message": "Price cannot be negative"}, 400

        plan.price = price
        db.session.commit()
        return plan.to_dict(), 200