from flask_restful import Resource, reqparse
from werkzeug.security import generate_password_hash
from models import db, User
from utils import admin_required


class StaffListResource(Resource):
    @admin_required
    def get(self):
        staff = User.query.filter_by(role="Staff").all()
        return [s.to_dict() for s in staff], 200

    @admin_required
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument("username", type=str, required=True, help="Username is required")
        parser.add_argument("password", type=str, required=True, help="Password is required")
        parser.add_argument("email", type=str, required=True, help="Email is required")
        parser.add_argument("id_type", type=str, store_missing=False)
        parser.add_argument("id_number", type=str, store_missing=False)
        parser.add_argument("phone", type=str, store_missing=False)
        args = parser.parse_args()

        if User.query.filter_by(username=args["username"]).first():
            return {"message": "Username already exists"}, 409

        staff = User(
            username=args["username"],
            password_hash=generate_password_hash(args["password"]),
            email=args["email"],
            id_type=args.get("id_type"),
            id_number=args.get("id_number"),
            phone=args.get("phone"),
            role="Staff",
            status=True,
        )
        db.session.add(staff)
        db.session.commit()
        return staff.to_dict(), 201


class StaffResource(Resource):
    @admin_required
    def get(self, user_id):
        staff = User.query.filter_by(user_id=user_id, role="Staff").first()
        if not staff:
            return {"message": "Staff member not found"}, 404
        return staff.to_dict(), 200

    @admin_required
    def put(self, user_id):
        staff = User.query.filter_by(user_id=user_id, role="Staff").first()
        if not staff:
            return {"message": "Staff member not found"}, 404

        parser = reqparse.RequestParser()
        parser.add_argument("email", type=str, store_missing=False)
        parser.add_argument("id_type", type=str, store_missing=False)
        parser.add_argument("id_number", type=str, store_missing=False)
        parser.add_argument("phone", type=str, store_missing=False)
        parser.add_argument("password", type=str, store_missing=False)
        args = parser.parse_args()

        if "email" in args:
            staff.email = args["email"]
        if "id_type" in args:
            staff.id_type = args["id_type"]
        if "id_number" in args:
            staff.id_number = args["id_number"]
        if "phone" in args:
            staff.phone = args["phone"]
        if "password" in args:
            staff.password_hash = generate_password_hash(args["password"])

        db.session.commit()
        return staff.to_dict(), 200


class DeactivateStaffResource(Resource):
    @admin_required
    def patch(self, user_id):
        staff = User.query.filter_by(user_id=user_id, role="Staff").first()
        if not staff:
            return {"message": "Staff member not found"}, 404
        if not staff.status:
            return {"message": "Staff member is already deactivated"}, 400

        staff.status = False
        db.session.commit()
        return {"message": "Staff member deactivated successfully", "user": staff.to_dict()}, 200
