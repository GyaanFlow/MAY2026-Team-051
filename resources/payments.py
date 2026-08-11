from datetime import datetime
from flask import request
from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity
from models import db, Payment, Student
from utils import staff_or_admin_required, student_required

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


class StudentPaymentHistoryResource(Resource):
    @student_required
    def get(self):
        uid = int(get_jwt_identity())
        student = Student.query.filter_by(user_id=uid).first()
        if not student:
            return {"message": "Student not found"}, 404

        payments = (
            Payment.query.filter_by(student_id=student.student_id)
            .order_by(Payment.payment_date.desc())
            .all()
        )

        return {
            "total_payments": len(payments),
            "payments": [p.to_dict() for p in payments],
        }, 200


class StaffStudentPaymentHistoryResource(Resource):
    @staff_or_admin_required
    def get(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return {"message": "Student not found"}, 404

        payments = (
            Payment.query.filter_by(student_id=student_id)
            .order_by(Payment.payment_date.desc())
            .all()
        )

        return {
            "student_id": student_id,
            "full_name": student.full_name,
            "total_payments": len(payments),
            "payments": [p.to_dict() for p in payments],
        }, 200
