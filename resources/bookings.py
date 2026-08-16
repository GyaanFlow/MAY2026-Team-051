import secrets
from datetime import date as date_cls
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import WEEKDAYS, db, Seat, Booking, Student, User, Attendance, LibrarySettings
from flask_jwt_extended import get_jwt
from resources import settings
from utils import staff_or_admin_required
from datetime import datetime, timedelta, timezone

def generate_checkin_code():
    return secrets.token_hex(4).upper()


def _slot_datetime(booking_date, slot_time):
    return datetime.combine(booking_date, slot_time)


def _hours_error(settings, booking_date, start_time, end_time):
    booking_date_str = booking_date.isoformat()
    closed = any(
        item.get("date") == booking_date_str
        for item in settings.holiday_closures_list()
    )
    if closed:
        return "Library is closed on this date"

    weekly_hours = settings.weekly_hours_list()
    if weekly_hours:
        day_name = WEEKDAYS[booking_date.weekday()]
        day_hours = next(
            (item for item in weekly_hours if item.get("day") == day_name),
            None,
        )
        if not day_hours or not day_hours.get("is_open"):
            return f"Library is closed on {day_name}"
        open_time = datetime.strptime(day_hours["open_time"], "%H:%M").time()
        close_time = datetime.strptime(day_hours["close_time"], "%H:%M").time()
    else:
        open_time = settings.open_time
        close_time = settings.close_time

    if open_time and close_time and (start_time < open_time or end_time > close_time):
        return (
            "Booking must be within library operating hours "
            f"({open_time.strftime('%H:%M')} - {close_time.strftime('%H:%M')})"
        )
    return None


def _limit_error(settings, booking_date, start_time, end_time, user_id, role, exclude_booking_id=None):
    duration_minutes = (
        _slot_datetime(booking_date, end_time) - _slot_datetime(booking_date, start_time)
    ).total_seconds() / 60

    if settings.min_booking_minutes and duration_minutes < settings.min_booking_minutes:
        return f"Minimum booking duration is {settings.min_booking_minutes} minutes"
    if settings.max_booking_hours and duration_minutes > settings.max_booking_hours * 60:
        return f"Maximum booking duration is {settings.max_booking_hours} hour(s)"

    today = date_cls.today()
    if booking_date < today:
        return "Cannot book a date in the past"
    if (
        settings.max_booking_days_ahead is not None
        and booking_date > today + timedelta(days=settings.max_booking_days_ahead)
    ):
        return (
            f"Bookings cannot be made more than {settings.max_booking_days_ahead} day(s) in advance"
        )

    if role == "Student" and settings.max_bookings_per_day:
        query = Booking.query.filter(
            Booking.user_id == int(user_id),
            Booking.booking_date == booking_date,
            Booking.status.in_(("Confirmed", "Checked-In")),
        )
        if exclude_booking_id is not None:
            query = query.filter(Booking.booking_id != exclude_booking_id)
        if query.count() >= settings.max_bookings_per_day:
            return f"Maximum of {settings.max_bookings_per_day} booking(s) per day reached"
    return None


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

        settings = LibrarySettings.query.first()
        if settings:
            hours_error = _hours_error(settings, booking_date, start_time, end_time)
            if hours_error:
                return {"message": hours_error}, 400
            limit_error = _limit_error(
                settings,
                booking_date,
                start_time,
                end_time,
                get_jwt_identity(),
                get_jwt().get("role"),
            )
            if limit_error:
                return {"message": limit_error}, 400

        clash = Booking.query.filter(
            Booking.seat_id == seat_id,
            Booking.booking_date == booking_date,
            Booking.status == "Confirmed",
            Booking.start_time < end_time,
            Booking.end_time > start_time,
        ).first()
        if clash:
            return {"message": "Seat already booked for this time slot"}, 409

        user_id = int(get_jwt_identity())
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

        settings = LibrarySettings.query.first()
        if settings:
            hours_error = _hours_error(settings, new_date, new_start, new_end)
            if hours_error:
                return {"message": hours_error}, 400
            limit_error = _limit_error(
                settings,
                new_date,
                new_start,
                new_end,
                user_id,
                role,
                exclude_booking_id=booking.booking_id,
            )
            if limit_error:
                return {"message": limit_error}, 400

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

class BookingCancelResource(Resource):
    @jwt_required()
    def post(self, booking_id):
        booking = db.session.get(Booking, booking_id)
        if not booking:
            return {"message": "Booking not found"}, 404

        user_id = get_jwt_identity()
        role = get_jwt().get("role")
        if str(booking.user_id) != str(user_id) and role not in ("Staff", "Admin"):
            return {"message": "Not authorized to cancel this booking"}, 403

        if booking.status == "Cancelled":
            return {"message": "Booking is already cancelled"}, 400

        settings = LibrarySettings.query.first()
        if (
            role == "Student"
            and settings
            and settings.cancellation_period is not None
        ):
            start_dt = _slot_datetime(booking.booking_date, booking.start_time)
            latest_cancel = start_dt - timedelta(hours=settings.cancellation_period)
            if datetime.now() > latest_cancel:
                return {
                    "message": (
                        f"Cancellations must be made at least {settings.cancellation_period} "
                        "hour(s) before the slot"
                    )
                }, 400

        booking.status = "Cancelled"
        db.session.commit()

        return {"message": "Booking cancelled, seat freed", "booking": booking.to_dict()}, 200


class BookingCheckoutResource(Resource):
    @jwt_required()
    def post(self, booking_id):
        booking = db.session.get(Booking, booking_id)
        if not booking:
            return {"message": "Booking not found"}, 404

        user_id = get_jwt_identity()
        role = get_jwt().get("role")
        if str(booking.user_id) != str(user_id) and role not in ("Staff", "Admin"):
            return {"message": "Not authorized to check out this booking"}, 403

        if booking.status != "Checked-In":
            return {
                "message": f"Only checked-in bookings can be checked out (status: {booking.status})"
            }, 400

        attendance = (
            Attendance.query.filter_by(booking_id=booking.booking_id, checkout_time=None)
            .order_by(Attendance.checkin_time.desc())
            .first()
        )
        if not attendance:
            return {"message": "No open attendance record found for this booking"}, 404

        attendance.checkout_time = datetime.now(timezone.utc)
        booking.status = "Completed"
        db.session.commit()

        result = attendance.to_dict()
        result["booking"] = booking.to_dict()

        seat = db.session.get(Seat, booking.seat_id)
        student = Student.query.filter_by(user_id=booking.user_id).first()
        user = db.session.get(User, booking.user_id)
        result["seat_number"] = seat.seat_number if seat else None
        result["full_name"] = student.full_name if student else None
        result["username"] = user.username if user else None

        return {"message": "Checked out, seat closed", "attendance": result}, 200



class StudentBookingHistoryResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()

        bookings = (
            Booking.query.filter_by(user_id=user_id)
            .order_by(Booking.booking_date.desc(), Booking.start_time.desc())
            .all()
        )

        result = []
        for b in bookings:
            data = b.to_dict()
            seat = db.session.get(Seat, b.seat_id)
            data["seat_number"] = seat.seat_number if seat else None
            result.append(data)

        return {"total_bookings": len(result), "bookings": result}, 200


class StaffTodayBookingsResource(Resource):
    @staff_or_admin_required
    def get(self):
        today = date_cls.today()

        bookings = (
            Booking.query.filter_by(booking_date=today, status="Confirmed")
            .order_by(Booking.start_time.asc())
            .all()
        )

        result = []
        for b in bookings:
            data = b.to_dict()
            seat = db.session.get(Seat, b.seat_id)
            user = db.session.get(User, b.user_id)
            student = Student.query.filter_by(user_id=b.user_id).first()

            data["seat_number"] = seat.seat_number if seat else None
            data["username"] = user.username if user else None
            data["full_name"] = student.full_name if student else None
            result.append(data)

        return {
            "date": str(today),
            "total_expected": len(result),
            "bookings": result,
        }, 200



class WalkInBookingResource(Resource):
    @staff_or_admin_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        student_id = data.get("student_id")
        duration_minutes = data.get("duration_minutes", 60)

        if not student_id:
            return {"message": "student_id is required"}, 400

        try:
            duration_minutes = int(duration_minutes)
            if duration_minutes <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return {"message": "duration_minutes must be a positive number"}, 400

        student = db.session.get(Student, student_id)
        if not student:
            return {"message": "Student not found"}, 404

        if student.membership_status != "Active":
            return {"message": "Student membership is not active"}, 400

        now = datetime.now()
        booking_date = now.date()
        start_time = now.time().replace(microsecond=0)
        end_dt = now + timedelta(minutes=duration_minutes)
        end_time = end_dt.time().replace(microsecond=0)

        all_seats = Seat.query.filter_by(is_active=True).all()
        if not all_seats:
            return {"message": "No seats configured"}, 404

        booked_seat_ids = {
            b.seat_id
            for b in Booking.query.filter(
                Booking.booking_date == booking_date,
                Booking.status == "Confirmed",
                Booking.start_time < end_time,
                Booking.end_time > start_time,
            ).all()
        }

        free_seat = next((s for s in all_seats if s.seat_id not in booked_seat_ids), None)
        if not free_seat:
            return {"message": "No free seats available right now"}, 409

        checkin_code = generate_checkin_code()

        booking = Booking(
            user_id=student.user_id,
            seat_id=free_seat.seat_id,
            booking_date=booking_date,
            start_time=start_time,
            end_time=end_time,
            checkin_code=checkin_code,
            status="Confirmed",
        )
        db.session.add(booking)
        db.session.commit()

        result = booking.to_dict()
        result["seat_number"] = free_seat.seat_number
        result["full_name"] = student.full_name

        return {"message": "Walk-in booking created", "booking": result}, 201
