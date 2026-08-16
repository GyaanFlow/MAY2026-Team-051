from datetime import datetime, date as date_cls, timedelta
from flask import request
from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity
from models import db, Booking, ExtensionRequest, LibrarySettings, Seat, Student, User
from utils import staff_or_admin_required, student_required


def _minutes_between(earlier_time, later_time):
    today = date_cls.today()
    return (datetime.combine(today, later_time) - datetime.combine(today, earlier_time)).total_seconds() / 60


class StudentExtensionRequestResource(Resource):
    @student_required
    def post(self, booking_id):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        requested_end_str = data.get("requested_end_time")
        requested_minutes = data.get("requested_minutes")
        requested_end_time = None

        if requested_minutes is not None:
            try:
                minutes = int(requested_minutes)
            except (TypeError, ValueError):
                return {"message": "requested_minutes must be a number"}, 400
            if minutes <= 0:
                return {"message": "requested_minutes must be greater than zero"}, 400
        elif requested_end_str:
            try:
                requested_end_time = datetime.strptime(requested_end_str, "%H:%M").time()
            except ValueError:
                return {"message": "requested_end_time must be in HH:MM format"}, 400
        else:
            return {"message": "requested_end_time or requested_minutes is required"}, 400

        booking = db.session.get(Booking, booking_id)
        if not booking or str(booking.user_id) != str(get_jwt_identity()):
            return {"message": "Booking not found"}, 404

        if booking.status not in ("Confirmed", "Checked-In"):
            return {"message": "Only confirmed or checked-in bookings can request an extension"}, 400

        if requested_end_time is None:
            end_dt = datetime.combine(booking.booking_date, booking.end_time) + timedelta(minutes=minutes)
            if end_dt.date() != booking.booking_date:
                return {"message": "Requested extension would go past midnight"}, 400
            requested_end_time = end_dt.time().replace(microsecond=0)

        if requested_end_time <= booking.end_time:
            return {"message": "requested_end_time must be after the current booking end time"}, 400

        existing = ExtensionRequest.query.filter_by(booking_id=booking.booking_id, status="Pending").first()
        if existing:
            return {"message": "An extension request is already pending for this booking"}, 409

        settings = LibrarySettings.query.first()
        if settings and settings.extension_limit_minutes:
            requested_minutes = _minutes_between(booking.end_time, requested_end_time)
            if requested_minutes > settings.extension_limit_minutes:
                return {
                    "message": f"Requested extension exceeds the maximum allowed ({settings.extension_limit_minutes} minutes)"
                }, 400

        extension_request = ExtensionRequest(
            booking_id=booking.booking_id,
            requested_end_time=requested_end_time,
            status="Pending",
        )
        db.session.add(extension_request)
        db.session.commit()

        return {"message": "Extension request submitted", "extension_request": extension_request.to_dict()}, 201


class StaffExtensionRequestListResource(Resource):
    @staff_or_admin_required
    def get(self):
        status_filter = request.args.get("status", "Pending")
        query = ExtensionRequest.query
        if status_filter and status_filter.lower() != "all":
            query = query.filter_by(status=status_filter)
        requests_ = query.order_by(ExtensionRequest.requested_at.asc()).all()

        result = []
        for ext in requests_:
            data = ext.to_dict()
            booking = db.session.get(Booking, ext.booking_id)
            if booking:
                data["booking_date"] = str(booking.booking_date)
                data["current_end_time"] = booking.end_time.strftime("%H:%M")
                data["seat_id"] = booking.seat_id
                seat = db.session.get(Seat, booking.seat_id)
                data["seat_number"] = seat.seat_number if seat else None
                student = Student.query.filter_by(user_id=booking.user_id).first()
                user = db.session.get(User, booking.user_id)
                data["full_name"] = student.full_name if student else None
                data["username"] = user.username if user else None
            result.append(data)

        return {"total": len(result), "extension_requests": result}, 200


class StaffExtensionRequestApproveResource(Resource):
    @staff_or_admin_required
    def post(self, extension_request_id):
        extension_request = db.session.get(ExtensionRequest, extension_request_id)
        if not extension_request:
            return {"message": "Extension request not found"}, 404

        if extension_request.status != "Pending":
            return {"message": "Only pending extension requests can be approved"}, 400

        booking = db.session.get(Booking, extension_request.booking_id)
        if not booking or booking.status not in ("Confirmed", "Checked-In"):
            return {"message": "Associated booking is no longer active"}, 400

        data = request.get_json(silent=True) or {}
        seat_id = data.get("seat_id")
        reassigned = seat_id is not None and int(seat_id) != booking.seat_id
        target_seat_id = int(seat_id) if seat_id is not None else booking.seat_id

        if reassigned:
            seat = db.session.get(Seat, target_seat_id)
            if not seat or not seat.is_active:
                return {"message": "Seat not found or inactive"}, 404
            window_start = booking.start_time
        else:
            window_start = booking.end_time

        clash = Booking.query.filter(
            Booking.seat_id == target_seat_id,
            Booking.booking_date == booking.booking_date,
            Booking.status.in_(("Confirmed", "Checked-In")),
            Booking.booking_id != booking.booking_id,
            Booking.start_time < extension_request.requested_end_time,
            Booking.end_time > window_start,
        ).first()
        if clash:
            if reassigned:
                return {"message": "Selected seat is not available for the requested period"}, 409
            return {
                "message": "Current seat is unavailable for the requested extension; retry with a seat_id to reassign"
            }, 409

        booking.end_time = extension_request.requested_end_time
        booking.seat_id = target_seat_id

        extension_request.status = "Approved"
        extension_request.approved_by = int(get_jwt_identity())

        db.session.commit()

        return {
            "message": "Extension approved" + (", seat reassigned" if reassigned else ""),
            "extension_request": extension_request.to_dict(),
            "booking": booking.to_dict(),
        }, 200


class StaffExtensionRequestRejectResource(Resource):
    @staff_or_admin_required
    def post(self, extension_request_id):
        extension_request = db.session.get(ExtensionRequest, extension_request_id)
        if not extension_request:
            return {"message": "Extension request not found"}, 404

        if extension_request.status != "Pending":
            return {"message": "Only pending extension requests can be rejected"}, 400

        extension_request.status = "Rejected"
        extension_request.approved_by = int(get_jwt_identity())
        db.session.commit()

        return {"message": "Extension request rejected", "extension_request": extension_request.to_dict()}, 200
