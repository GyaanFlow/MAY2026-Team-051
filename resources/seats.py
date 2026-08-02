from flask import request
from flask_restful import Resource
from models import db, Seat
from utils import admin_required

VALID_STATUSES = ("Available", "Maintenance")


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

        status = data.get("status", "Available")
        if status not in VALID_STATUSES:
            return {"message": f"status must be one of {VALID_STATUSES}"}, 400

        seat = Seat(seat_number=seat_number, status=status)
        db.session.add(seat)
        db.session.commit()
        return seat.to_dict(), 201


class SeatResource(Resource):
    @admin_required
    def put(self, seat_id):
        seat = db.session.get(Seat, seat_id)
        if not seat:
            return {"message": "Seat not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        if "status" not in data:
            return {"message": "status is required"}, 400

        status = data.get("status")
        if status not in VALID_STATUSES:
            return {"message": f"status must be one of {VALID_STATUSES}"}, 400

        seat.status = status
        db.session.commit()
        return {"message": "Seat updated", "seat": seat.to_dict()}, 200
