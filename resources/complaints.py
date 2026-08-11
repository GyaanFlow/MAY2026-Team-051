from flask import request
from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity
from models import db, Complaint, Student
from utils import student_required


class StudentComplaintListResource(Resource):
    @student_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        title = data.get("title")
        description = data.get("description")
        if not title or not description:
            return {"message": "title and description are required"}, 400

        uid = int(get_jwt_identity())
        student = Student.query.filter_by(user_id=uid).first()
        if not student:
            return {"message": "Student not found"}, 404

        complaint = Complaint(
            student_id=student.student_id,
            title=title,
            description=description,
            status="Open",
        )
        db.session.add(complaint)
        db.session.commit()

        return {"message": "Complaint submitted", "complaint": complaint.to_dict()}, 201
