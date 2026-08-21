from datetime import date as date_cls, datetime, timezone
from flask import request
from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity
from models import db, Attendance, Booking, Seat, Student, User
from resources.bookings import _booking_payload
from utils import staff_or_admin_required


def _normalize_code(value):
    return str(value or "").strip().upper()


def _lookup_booking(checkin_code):
    code = _normalize_code(checkin_code)
    if not code:
        return None, {"message": "checkin_code is required"}, 400

    booking = Booking.query.filter(Booking.checkin_code == code).first()
    if not booking:
        booking = Booking.query.filter(db.func.upper(Booking.checkin_code) == code).first()
    if not booking:
        return None, {"message": "Invalid checkin_code"}, 404
    return booking, None, None


def _staff_booking_payload(booking):
    data = _booking_payload(booking)
    user = db.session.get(User, booking.user_id)
    student = Student.query.filter_by(user_id=booking.user_id).first()
    data["username"] = user.username if user else None
    data["full_name"] = student.full_name if student else None
    data["roll_number"] = student.roll_number if student else None
    seat = db.session.get(Seat, booking.seat_id)
    data["seat_number"] = seat.seat_number if seat else data.get("seat_number")
    return data


class StaffCheckinResource(Resource):
    @staff_or_admin_required
    def get(self):
        booking, error, status = _lookup_booking(request.args.get("checkin_code"))
        if error:
            return error, status

        if booking.booking_date != date_cls.today():
            return {"message": "Booking is not scheduled for today"}, 400
        if booking.status != "Confirmed":
            return {
                "message": f"Booking is not eligible for check-in (status: {booking.status})"
            }, 400

        return {"booking": _staff_booking_payload(booking)}, 200

    @staff_or_admin_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        booking, error, status = _lookup_booking(data.get("checkin_code"))
        if error:
            return error, status

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
        result["booking"] = _staff_booking_payload(booking)
        result["seat_number"] = result["booking"].get("seat_number")
        result["full_name"] = result["booking"].get("full_name")
        result["username"] = result["booking"].get("username")
        return {"message": "Check-in successful", "attendance": result}, 201
