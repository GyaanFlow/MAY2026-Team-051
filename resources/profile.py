#from here gaurav code continues
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Student


class ProfileResource(Resource):
    @jwt_required()
    def get(self):
        uid = get_jwt_identity()
        user = User.query.get(int(uid))
        if not user:
            return {"message": "user not found"}, 404

        data = user.to_dict()
        if user.role == "Student":
            student = Student.query.filter_by(user_id=user.user_id).first()
            if student:
                data["full_name"] = student.full_name
                data["address"] = student.address
                data["membership_status"] = student.membership_status
        return data, 200

    @jwt_required()
    def put(self):
        uid = get_jwt_identity()
        user = User.query.get(int(uid))
        if not user:
            return {"message": "user not found"}, 404

        parser = reqparse.RequestParser()
        parser.add_argument("email", type=str, store_missing=False)
        parser.add_argument("phone", type=str, store_missing=False)
        parser.add_argument("full_name", type=str, store_missing=False)
        parser.add_argument("address", type=str, store_missing=False)
        args = parser.parse_args()

        if "email" in args:
            user.email = args["email"]
        if "phone" in args:
            user.phone = args["phone"]

        if user.role == "Student":
            student = Student.query.filter_by(user_id=user.user_id).first()
            if student:
                if "full_name" in args:
                    student.full_name = args["full_name"]
                if "address" in args:
                    student.address = args["address"]

        db.session.commit()
        return {"message": "profile updated"}, 200


class ResetPasswordResource(Resource):
    @jwt_required()
    def post(self):
        uid = get_jwt_identity()
        user = User.query.get(int(uid))
        if not user:
            return {"message": "user not found"}, 404

        parser = reqparse.RequestParser()
        parser.add_argument("old_password", type=str, required=True)
        parser.add_argument("new_password", type=str, required=True)
        args = parser.parse_args()

        if not check_password_hash(user.password_hash, args["old_password"]):
            return {"message": "old password wrong"}, 401

        user.password_hash = generate_password_hash(args["new_password"])
        db.session.commit()
        return {"message": "password changed"}, 200