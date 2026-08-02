from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User


class ProfileResource(Resource):
    """Self-service profile for Admin/Staff. Students use /students/me instead."""

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
            user.phone = data.get("phone")

        db.session.commit()
        return {"message": "Profile updated"}, 200


class ResetPasswordResource(Resource):
    @jwt_required()
    def post(self):
        uid = get_jwt_identity()
        user = User.query.get(int(uid))
        if not user:
            return {"message": "User not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        old_password = data.get("old_password")
        new_password = data.get("new_password")

        if not old_password or not new_password:
            return {"message": "Old password and new password are required"}, 400

        if not check_password_hash(user.password_hash, old_password):
            return {"message": "Old password is wrong"}, 401

        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        return {"message": "Password changed"}, 200