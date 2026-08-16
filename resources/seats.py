from datetime import datetime
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from models import db, Seat, Booking
from utils import admin_required, staff_or_admin_required


class SeatListResource(Resource):
    @admin_required
    def get(self):
        seats = Seat.query.all()
        return [s.to_dict() for s in seats], 200

    @admin_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        seat_number = data.get("seat_number")
        if not seat_number:
            return {"message": "seat_number is required"}, 400

        if Seat.query.filter_by(seat_number=seat_number).first():
            return {"message": "Seat number already exists"}, 409

        is_active = data.get("is_active", True)
        if not isinstance(is_active, bool):
            return {"message": "is_active must be true or false"}, 400

        seat = Seat(seat_number=seat_number, seat_type=data.get("seat_type"), is_active=is_active)
        db.session.add(seat)
        db.session.commit()
        return seat.to_dict(), 201

class StaffSeatListResource(Resource):
    @staff_or_admin_required
    def get(self):
        seats = Seat.query.filter_by(is_active=True).all()

        today = datetime.now().date()
        now = datetime.now().time()

        active_bookings = Booking.query.filter(
            Booking.booking_date == today,
            Booking.status.in_(("Confirmed", "Checked-In")),
            Booking.start_time <= now,
            Booking.end_time > now
        ).all()

        occupied_seat_ids = {
            booking.seat_id
            for booking in active_bookings
        }

        result = []

        for seat in seats:
            result.append({
                "seat_id": seat.seat_id,
                "seat_number": seat.seat_number,
                "seat_type": seat.seat_type,
                "is_active": seat.is_active,
                "is_available": seat.seat_id not in occupied_seat_ids
            })

        return result, 200



class SeatResource(Resource):
    @admin_required
    def put(self, seat_id):
        seat = db.session.get(Seat, seat_id)
        if not seat:
            return {"message": "Seat not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        if "is_active" not in data and "seat_type" not in data:
            return {"message": "is_active or seat_type is required"}, 400

        if "is_active" in data:
            is_active = data.get("is_active")
            if not isinstance(is_active, bool):
                return {"message": "is_active must be true or false"}, 400
            seat.is_active = is_active

        if "seat_type" in data:
            seat.seat_type = data.get("seat_type")

        db.session.commit()
        return {"message": "Seat updated", "seat": seat.to_dict()}, 200


class SeatAvailabilityResource(Resource):
    @jwt_required()
    def get(self):
        date_str = request.args.get("date")
        start_str = request.args.get("start_time")
        end_str = request.args.get("end_time")

        if not date_str or not start_str or not end_str:
            return {"message": "date, start_time and end_time are required"}, 400

        try:
            booking_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            start_time = datetime.strptime(start_str, "%H:%M").time()
            end_time = datetime.strptime(end_str, "%H:%M").time()
        except ValueError:
            return {"message": "date must be YYYY-MM-DD, times must be HH:MM"}, 400

        if start_time >= end_time:
            return {"message": "start_time must be before end_time"}, 400

        all_seats = Seat.query.filter_by(is_active=True).all()

        overlapping = Booking.query.filter(
            Booking.booking_date == booking_date,
            Booking.status == "Confirmed",
            Booking.start_time < end_time,
            Booking.end_time > start_time,
        ).all()
        booked_seat_ids = {b.seat_id for b in overlapping}

        available = [s.to_dict() for s in all_seats if s.seat_id not in booked_seat_ids]

        return {
            "date": date_str,
            "start_time": start_str,
            "end_time": end_str,
            "available_seats": available,
            "total_available": len(available),
        }, 200
