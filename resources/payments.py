from datetime import datetime, timezone
from flask import request
from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity
from models import db, Payment, Student, User
from utils import staff_or_admin_required, student_required

VALID_PAYMENT_MODES = ("Cash", "UPI", "Card")


def _resolve_student(identifier):
    if identifier is None or str(identifier).strip() == "":
        return None

    raw = str(identifier).strip()
    try:
        student = db.session.get(Student, int(raw))
        if student:
            return student
    except (TypeError, ValueError):
        pass

    student = Student.query.filter_by(roll_number=raw).first()
    if student:
        return student

    user = User.query.filter_by(username=raw).first()
    if user:
        return Student.query.filter_by(user_id=user.user_id).first()
    return None


def _payment_payload(payment):
    data = payment.to_dict()
    student = db.session.get(Student, payment.student_id)
    user = db.session.get(User, student.user_id) if student else None
    data["full_name"] = student.full_name if student else None
    data["username"] = user.username if user else None
    data["roll_number"] = student.roll_number if student else None
    return data


class StaffPaymentListResource(Resource):
    @staff_or_admin_required
    def get(self):
        payments = Payment.query.order_by(Payment.payment_date.desc()).limit(100).all()
        result = [_payment_payload(payment) for payment in payments]
        return {"total_payments": len(result), "payments": result}, 200

    @staff_or_admin_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        identifier = data.get("student_id") or data.get("username") or data.get("roll_number")
        if not identifier:
            return {"message": "student_id is required"}, 400

        student = _resolve_student(identifier)
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

        purpose = (data.get("purpose") or "").strip() or None
        if purpose and len(purpose) > 200:
            return {"message": "purpose must be 200 characters or fewer"}, 400

        payment = Payment(
            student_id=student.student_id,
            amount=amount,
            payment_mode=payment_mode,
            purpose=purpose,
            payment_date=datetime.now(timezone.utc),
            recorded_by=int(get_jwt_identity()),
        )
        db.session.add(payment)
        db.session.commit()

        return {"message": "Payment recorded", "payment": _payment_payload(payment)}, 201


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
            "payments": [_payment_payload(payment) for payment in payments],
        }, 200


class StaffStudentPaymentHistoryResource(Resource):
    @staff_or_admin_required
    def get(self, student_id):
        student = db.session.get(Student, student_id)
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
            "payments": [_payment_payload(payment) for payment in payments],
        }, 200
