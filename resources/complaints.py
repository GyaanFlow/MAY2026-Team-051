from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Complaint, User
from utils import staff_or_admin_required


class StaffComplaintListResource(Resource):
    @staff_or_admin_required
    def get(self):
        status_filter = request.args.get("status")

        query = Complaint.query
        if status_filter:
            query = query.filter_by(status=status_filter)

        complaints = query.order_by(Complaint.created_at.desc()).all()

        result = []
        for c in complaints:
            data = c.to_dict()
            user = db.session.get(User, c.user_id)
            if user:
                data["username"] = user.username
                data["role"] = user.role
            result.append(data)

        return {"total_complaints": len(result), "complaints": result}, 200


class StaffComplaintUpdateResource(Resource):
    @staff_or_admin_required
    def put(self, complaint_id):
        complaint = db.session.get(Complaint, complaint_id)
        if not complaint:
            return {"message": "Complaint not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        new_status = data.get("status")
        if new_status not in ("Open", "InProgress", "Resolved"):
            return {"message": "status must be one of: Open, InProgress, Resolved"}, 400

        complaint.status = new_status
        db.session.commit()

        return {"message": "Complaint updated", "complaint": complaint.to_dict()}, 200