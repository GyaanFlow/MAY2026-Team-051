from datetime import date as date_cls, datetime, timezone
from flask import request
from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity
from models import db, Attendance, Booking, Seat, Student, User
from utils import staff_or_admin_required


class StaffCheckinResource(Resource):
    @staff_or_admin_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        checkin_code = data.get("checkin_code")
        if not checkin_code:
            return {"message": "checkin_code is required"}, 400

        booking = Booking.query.filter_by(checkin_code=checkin_code).first()
        if not booking:
            return {"message": "Invalid checkin_code"}, 404

        if booking.status != "Confirmed":
            return {
                "message": f"Booking is not eligible for check-in (status: {booking.status})"
            }, 400

        if booking.booking_date != date_cls.today():
            return {"message": "Booking is not scheduled for today"}, 400

        attendance = Attendance(
            booking_id=booking.booking_id,
            checkin_time=datetime.now(timezone.utc),
            verified_by=int(get_jwt_identity()),
        )
        booking.status = "Checked-In"
        db.session.add(attendance)
        db.session.commit()

        result = attendance.to_dict()
        result["booking"] = booking.to_dict()

        seat = db.session.get(Seat, booking.seat_id)
        student = Student.query.filter_by(user_id=booking.user_id).first()
        user = db.session.get(User, booking.user_id)
        result["seat_number"] = seat.seat_number if seat else None
        result["full_name"] = student.full_name if student else None
        result["username"] = user.username if user else None

        return {"message": "Check-in successful", "attendance": result}, 201
