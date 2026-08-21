from flask import request
from flask_restful import Resource
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash
from models import User, Student


MEMBERSHIP_LOGIN_MESSAGES = {
    "Pending": "Your membership is pending admin approval. You cannot log in until it is approved.",
    "Rejected": "Your membership request was rejected. Please contact the library for help.",
    "Disapproved": "Your membership has been suspended. Please contact the library for help.",
}


class LoginResource(Resource):
    def post(self):
        data = request.get_json(silent=True)

        if data is None:
            return {"message": "Request body must be JSON"}, 400

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return {"message": "Username and password are required"}, 400

        user = User.query.filter_by(username=username).first()

        if user is None or not check_password_hash(user.password_hash, password):
            return {"message": "Invalid username or password"}, 401

        if not user.status:
            return {"message": "Account is deactivated"}, 403

        if user.role == "Student":
            student = Student.query.filter_by(user_id=user.user_id).first()
            if not student:
                return {"message": "Student profile not found. Please contact the library."}, 403

            if student.membership_status != "Active":
                message = MEMBERSHIP_LOGIN_MESSAGES.get(
                    student.membership_status,
                    "Your membership is not active. Please contact the library.",
                )
                return {
                    "message": message,
                    "membership_status": student.membership_status,
                }, 403

        access_token = create_access_token(
            identity=str(user.user_id),
            additional_claims={
                "role": user.role,
                "username": user.username
            }
        )

        return {
            "access_token": access_token,
            "user": user.to_dict()
        }, 200
