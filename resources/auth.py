from flask_restful import Resource, reqparse
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash
from models import User


class LoginResource(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument("username", type=str, required=True, help="Username is required")
        parser.add_argument("password", type=str, required=True, help="Password is required")
        args = parser.parse_args()

        user = User.query.filter_by(username=args["username"]).first()

        if not user or not check_password_hash(user.password_hash, args["password"]):
            return {"message": "Invalid username or password"}, 401

        if not user.status:
            return {"message": "Account is deactivated"}, 403

        token = create_access_token(
            identity=str(user.user_id),
            additional_claims={"role": user.role, "username": user.username}
        )

        return {"access_token": token, "user": user.to_dict()}, 200