from flask import request
from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity
from models import db, Complaint, User, Student
from utils import staff_or_admin_required, student_required

STATUS_ALIASES = {
    "open": "Open",
    "in-progress": "InProgress",
    "inprogress": "InProgress",
    "resolved": "Resolved",
    "Open": "Open",
    "InProgress": "InProgress",
    "Resolved": "Resolved",
}


def _normalize_status(value):
    if value is None:
        return None
    return STATUS_ALIASES.get(str(value).strip()) or STATUS_ALIASES.get(str(value).strip().lower())


def _user_display_name(user):
    if not user:
        return None
    return user.full_name or user.username


def _complaint_payload(complaint):
    data = complaint.to_dict()
    student = db.session.get(Student, complaint.student_id)
    user = db.session.get(User, student.user_id) if student else None
    resolver = db.session.get(User, complaint.resolved_by) if complaint.resolved_by else None
    data["full_name"] = student.full_name if student else None
    data["username"] = user.username if user else None
    data["roll_number"] = student.roll_number if student else None
    data["resolved_by_name"] = _user_display_name(resolver)
    return data


class StaffComplaintListResource(Resource):
    @staff_or_admin_required
    def get(self):
        status_filter = _normalize_status(request.args.get("status"))
        query = Complaint.query
        if status_filter:
            query = query.filter_by(status=status_filter)

        complaints = query.order_by(Complaint.created_at.desc()).all()
        result = [_complaint_payload(complaint) for complaint in complaints]
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

        new_status = _normalize_status(data.get("status"))
        if not new_status:
            return {
                "message": "status must be one of: Open, InProgress, Resolved"
            }, 400

        resolution_note = data.get("resolution_note")
        if resolution_note is not None:
            resolution_note = str(resolution_note).strip() or None

        if new_status == "Resolved" and not resolution_note and not complaint.resolution_note:
            return {"message": "resolution_note is required when resolving a complaint"}, 400

        complaint.status = new_status
        if resolution_note is not None:
            complaint.resolution_note = resolution_note
        if new_status == "Resolved":
            complaint.resolved_by = int(get_jwt_identity())

        db.session.commit()
        return {"message": "Complaint updated", "complaint": _complaint_payload(complaint)}, 200


class StudentComplaintCreateResource(Resource):
    @student_required
    def get(self):
        uid = int(get_jwt_identity())
        student = Student.query.filter_by(user_id=uid).first()
        if not student:
            return {"message": "Student not found"}, 404

        complaints = (
            Complaint.query.filter_by(student_id=student.student_id)
            .order_by(Complaint.created_at.desc())
            .all()
        )
        result = [_complaint_payload(complaint) for complaint in complaints]
        return {"total_complaints": len(result), "complaints": result}, 200

    @student_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        title = (data.get("title") or data.get("subject") or "").strip()
        description = (data.get("description") or "").strip()
        category = (data.get("category") or "").strip() or None
        if not title or not description:
            return {"message": "title and description are required"}, 400
        if len(title) > 200:
            return {"message": "title must be 200 characters or fewer"}, 400
        if category and len(category) > 100:
            return {"message": "category must be 100 characters or fewer"}, 400

        uid = int(get_jwt_identity())
        student = Student.query.filter_by(user_id=uid).first()
        if not student:
            return {"message": "Student not found"}, 404

        complaint = Complaint(
            student_id=student.student_id,
            title=title,
            description=description,
            category=category,
            status="Open",
        )
        db.session.add(complaint)
        db.session.commit()
        return {"message": "Complaint submitted", "complaint": _complaint_payload(complaint)}, 201
