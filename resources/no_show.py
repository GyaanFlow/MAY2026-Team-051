from datetime import datetime, timedelta
from flask_restful import Resource
from models import db, Booking, LibrarySettings, Seat, Student, User
from utils import staff_or_admin_required


def _grace_minutes():
    settings = LibrarySettings.query.first()
    if settings and settings.no_show_grace_minutes is not None:
        return settings.no_show_grace_minutes
    return 0


def _cutoff_datetime(booking, grace_minutes):
    return datetime.combine(booking.booking_date, booking.start_time) + timedelta(minutes=grace_minutes)


def _annotate(booking):
    data = booking.to_dict()
    seat = db.session.get(Seat, booking.seat_id)
    student = Student.query.filter_by(user_id=booking.user_id).first()
    user = db.session.get(User, booking.user_id)
    data["seat_number"] = seat.seat_number if seat else None
    data["full_name"] = student.full_name if student else None
    data["username"] = user.username if user else None
    return data


class NoShowCandidatesResource(Resource):
    @staff_or_admin_required
    def get(self):
        grace_minutes = _grace_minutes()
        now = datetime.now()

        overdue = []
        for booking in Booking.query.filter_by(status="Confirmed").all():
            cutoff = _cutoff_datetime(booking, grace_minutes)
            if cutoff <= now:
                data = _annotate(booking)
                data["minutes_overdue"] = int((now - cutoff).total_seconds() // 60)
                overdue.append((cutoff, data))

        overdue.sort(key=lambda pair: pair[0])

        return {
            "grace_minutes": grace_minutes,
            "total_candidates": len(overdue),
            "candidates": [entry[1] for entry in overdue],
        }, 200


class MarkNoShowResource(Resource):
    @staff_or_admin_required
    def post(self, booking_id):
        booking = db.session.get(Booking, booking_id)
        if not booking:
            return {"message": "Booking not found"}, 404

        if booking.status != "Confirmed":
            return {
                "message": f"Booking is not eligible for no-show (status: {booking.status})"
            }, 400

        grace_minutes = _grace_minutes()
        cutoff = _cutoff_datetime(booking, grace_minutes)
        if datetime.now() < cutoff:
            return {"message": "Booking is still within the grace period; cannot mark no-show yet"}, 400

        booking.status = "No-Show"
        db.session.commit()

        return {
            "message": "Booking marked as No-Show, seat released",
            "booking": _annotate(booking),
        }, 200
