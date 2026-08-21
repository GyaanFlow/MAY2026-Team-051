from datetime import date
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User


class ProfileResource(Resource):
    @jwt_required()
    def get(self):
        if get_jwt().get("role") == "Student":
            return {"message": "Students should use /students/me"}, 403

        uid = get_jwt_identity()
        user = db.session.get(User, int(uid))
        if not user:
            return {"message": "User not found"}, 404

        return user.to_dict(), 200

    @jwt_required()
    def put(self):
        if get_jwt().get("role") == "Student":
            return {"message": "Students should use /students/me"}, 403

        uid = get_jwt_identity()
        user = db.session.get(User, int(uid))
        if not user:
            return {"message": "User not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        if "email" in data:
            if not data.get("email"):
                return {"message": "Email cannot be empty"}, 400
            user.email = data.get("email")

        if "phone" in data:
            user.phone = data.get("phone") or None

        if "full_name" in data:
            full_name = (data.get("full_name") or "").strip()
            if not full_name:
                return {"message": "Full name cannot be empty"}, 400
            user.full_name = full_name

        if "address" in data:
            user.address = data.get("address") or None

        if "position" in data:
            user.position = data.get("position") or None

        if "gender" in data:
            user.gender = data.get("gender") or None

        if "dob" in data:
            dob_value = data.get("dob")
            if not dob_value:
                user.dob = None
            else:
                try:
                    user.dob = date.fromisoformat(str(dob_value))
                except (TypeError, ValueError):
                    return {"message": "dob must be in YYYY-MM-DD format"}, 400

        db.session.commit()
        return {"message": "Profile updated", "user": user.to_dict()}, 200


class ResetPasswordResource(Resource):
    @jwt_required()
    def post(self):
        uid = get_jwt_identity()
        user = db.session.get(User, int(uid))
        if not user:
            return {"message": "User not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        old_password = data.get("old_password")
        new_password = data.get("new_password")

        if not old_password or not new_password:
            return {"message": "Old password and new password are required"}, 400

        if len(str(new_password)) < 8:
            return {"message": "New password must be at least 8 characters"}, 400

        if not check_password_hash(user.password_hash, old_password):
            return {"message": "Old password is wrong"}, 401

        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        return {"message": "Password changed"}, 200
