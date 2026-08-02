from flask import request
from flask_restful import Resource
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
        data = request.get_json(silent=True)

        if data is None:
            return {"message": "Request body must be JSON"}, 400

        username = data.get("username")
        password = data.get("password")
        email = data.get("email")

        if not username or not password or not email:
            return {"message": "Username, password and email are required"}, 400

        if User.query.filter_by(username=username).first():
            return {"message": "Username already exists"}, 409

        staff = User(
            username=username,
            password_hash=generate_password_hash(password),
            email=email,
            id_type=data.get("id_type"),
            id_number=data.get("id_number"),
            phone=data.get("phone"),
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

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        if "email" in data:
            if not data.get("email"):
                return {"message": "Email cannot be empty"}, 400
            staff.email = data.get("email")

        if "id_type" in data:
            staff.id_type = data.get("id_type")

        if "id_number" in data:
            staff.id_number = data.get("id_number")

        if "phone" in data:
            staff.phone = data.get("phone")

        if "password" in data:
            if not data.get("password"):
                return {"message": "Password cannot be empty"}, 400
            staff.password_hash = generate_password_hash(data.get("password"))

        db.session.commit()
        return staff.to_dict(), 200


class DeactivateStaffResource(Resource):
    @admin_required
    def post(self, user_id):
        staff = User.query.filter_by(user_id=user_id, role="Staff").first()
        if not staff:
            return {"message": "Staff member not found"}, 404

        if not staff.status:
            return {"message": "Staff member is already deactivated"}, 400

        staff.status = False
        db.session.commit()
        return {
            "message": "Staff member deactivated successfully",
            "user": staff.to_dict()
        }, 200