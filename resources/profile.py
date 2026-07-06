from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Student


class ProfileResource(Resource):
    @jwt_required()
    def get(self):
        uid = get_jwt_identity()
        user = User.query.get(int(uid))
        if not user:
            return {"message": "User not found"}, 404

        data = user.to_dict()
        if user.role == "Student":
            student = Student.query.filter_by(user_id=user.user_id).first()
            if student:
                data["full_name"] = student.full_name
                data["address"] = student.address
                data["membership_status"] = student.membership_status
                data["membership_expiry"] = str(student.membership_expiry) if student.membership_expiry else None

        return data, 200

    @jwt_required()
    def put(self):
        uid = get_jwt_identity()
        user = User.query.get(int(uid))
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

        if user.role == "Student":
            student = Student.query.filter_by(user_id=user.user_id).first()
            if student:
                if "full_name" in data:
                    if not data.get("full_name"):
                        return {"message": "Full name cannot be empty"}, 400
                    student.full_name = data.get("full_name")

                if "address" in data:
                    student.address = data.get("address")

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