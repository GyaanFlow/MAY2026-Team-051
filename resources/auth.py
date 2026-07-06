from flask import request
from flask_restful import Resource
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash
from models import User


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