from datetime import datetime
from flask import request
from flask_restful import Resource
from models import db, Seat, Booking
from flask_jwt_extended import jwt_required


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