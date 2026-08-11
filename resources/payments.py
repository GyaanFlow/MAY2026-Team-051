from datetime import datetime
from flask import request
from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity
from models import db, Payment, Student
from utils import staff_or_admin_required

VALID_PAYMENT_MODES = ("Cash", "UPI", "Card")


class StaffPaymentListResource(Resource):
    @staff_or_admin_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        student_id = data.get("student_id")
        if not student_id:
            return {"message": "student_id is required"}, 400

        student = db.session.get(Student, student_id)
        if not student:
            return {"message": "Student not found"}, 404

        try:
            amount = float(data.get("amount"))
        except (TypeError, ValueError):
            return {"message": "amount must be a number"}, 400
        if amount <= 0:
            return {"message": "amount must be positive"}, 400

        payment_mode = data.get("payment_mode")
        if payment_mode not in VALID_PAYMENT_MODES:
            return {
                "message": f"payment_mode must be one of {', '.join(VALID_PAYMENT_MODES)}"
            }, 400

        payment = Payment(
            student_id=student_id,
            amount=amount,
            payment_mode=payment_mode,
            payment_date=datetime.utcnow(),
            recorded_by=int(get_jwt_identity()),
        )
        db.session.add(payment)
        db.session.commit()

        result = payment.to_dict()
        result["full_name"] = student.full_name

        return {"message": "Payment recorded", "payment": result}, 201
