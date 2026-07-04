from flask_restful import Resource, reqparse
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

        parser = reqparse.RequestParser()
        parser.add_argument("price", type=float, required=True, help="Price is required")
        args = parser.parse_args()

        if args["price"] < 0:
            return {"message": "Price cannot be negative"}, 400

        plan.price = args["price"]
        db.session.commit()
        return plan.to_dict(), 200
