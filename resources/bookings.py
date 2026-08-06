import secrets
from datetime import datetime
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Seat, Booking
from flask_jwt_extended import get_jwt


def generate_checkin_code():
    return secrets.token_hex(4).upper()


class BookingListResource(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        seat_id = data.get("seat_id")
        date_str = data.get("date")
        start_str = data.get("start_time")
        end_str = data.get("end_time")

        if not seat_id or not date_str or not start_str or not end_str:
            return {"message": "seat_id, date, start_time and end_time are required"}, 400

        seat = db.session.get(Seat, seat_id)
        if not seat or not seat.is_active:
            return {"message": "Seat not found or inactive"}, 404

        try:
            booking_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            start_time = datetime.strptime(start_str, "%H:%M").time()
            end_time = datetime.strptime(end_str, "%H:%M").time()
        except ValueError:
            return {"message": "date must be YYYY-MM-DD, times must be HH:MM"}, 400

        if start_time >= end_time:
            return {"message": "start_time must be before end_time"}, 400

        clash = Booking.query.filter(
            Booking.seat_id == seat_id,
            Booking.booking_date == booking_date,
            Booking.status == "Confirmed",
            Booking.start_time < end_time,
            Booking.end_time > start_time,
        ).first()
        if clash:
            return {"message": "Seat already booked for this time slot"}, 409

        user_id = get_jwt_identity()
        checkin_code = generate_checkin_code()

        booking = Booking(
            user_id=user_id,
            seat_id=seat_id,
            booking_date=booking_date,
            start_time=start_time,
            end_time=end_time,
            checkin_code=checkin_code,
            status="Confirmed",
        )
        db.session.add(booking)
        db.session.commit()

        return {"message": "Booking created", "booking": booking.to_dict()}, 201



class BookingDetailResource(Resource):
    @jwt_required()
    def put(self, booking_id):
        booking = db.session.get(Booking, booking_id)
        if not booking:
            return {"message": "Booking not found"}, 404

        user_id = get_jwt_identity()
        role = get_jwt().get("role")
        if str(booking.user_id) != str(user_id) and role not in ("Staff", "Admin"):
            return {"message": "Not authorized to modify this booking"}, 403

        if booking.status != "Confirmed":
            return {"message": "Only confirmed bookings can be modified"}, 400

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        new_date = booking.booking_date
        new_start = booking.start_time
        new_end = booking.end_time

        try:
            if "date" in data:
                new_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
            if "start_time" in data:
                new_start = datetime.strptime(data["start_time"], "%H:%M").time()
            if "end_time" in data:
                new_end = datetime.strptime(data["end_time"], "%H:%M").time()
        except ValueError:
            return {"message": "Invalid date/time format"}, 400

        if new_start >= new_end:
            return {"message": "start_time must be before end_time"}, 400

        clash = Booking.query.filter(
            Booking.seat_id == booking.seat_id,
            Booking.booking_date == new_date,
            Booking.status == "Confirmed",
            Booking.booking_id != booking.booking_id,
            Booking.start_time < new_end,
            Booking.end_time > new_start,
        ).first()
        if clash:
            return {"message": "Seat already booked for this new time slot"}, 409

        booking.booking_date = new_date
        booking.start_time = new_start
        booking.end_time = new_end
        db.session.commit()

        return {"message": "Booking updated", "booking": booking.to_dict()}, 200    