import json
from datetime import datetime, time, timezone
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import WEEKDAYS, db, LibrarySettings
from utils import admin_required


def _parse_hhmm(value):
    try:
        parsed = time.fromisoformat(str(value))
    except (TypeError, ValueError):
        return None
    return parsed.replace(second=0, microsecond=0)


def _format_hhmm(value):
    if hasattr(value, "strftime"):
        return value.strftime("%H:%M")
    text = str(value or "")
    return text[:5] if text else None


def _validate_weekly_hours(weekly_hours):
    if not isinstance(weekly_hours, list):
        return "weekly_hours must be a list", None

    normalized = []
    seen = set()
    for entry in weekly_hours:
        if not isinstance(entry, dict):
            return "Each weekly_hours item must be an object", None
        day = entry.get("day")
        if day not in WEEKDAYS:
            return "weekly_hours contains an unknown day", None
        if day in seen:
            return f"{day} is duplicated in weekly_hours", None
        seen.add(day)

        is_open = bool(entry.get("is_open"))
        open_time = _parse_hhmm(entry.get("open_time") or "09:00")
        close_time = _parse_hhmm(entry.get("close_time") or "21:00")
        if open_time is None or close_time is None:
            return f"{day} times must be in HH:MM format", None
        if is_open and close_time <= open_time:
            return f"{day} close_time must be after open_time", None

        normalized.append({
            "day": day,
            "is_open": is_open,
            "open_time": _format_hhmm(open_time),
            "close_time": _format_hhmm(close_time),
        })
    return None, normalized


def _validate_holiday_closures(holiday_closures):
    if not isinstance(holiday_closures, list):
        return "holiday_closures must be a list", None

    normalized = []
    seen = set()
    for entry in holiday_closures:
        if not isinstance(entry, dict):
            return "Each holiday closure must be an object", None
        date_str = entry.get("date")
        reason = (entry.get("reason") or "").strip()
        if not date_str or not reason:
            return "Each holiday closure needs a date and reason", None
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return "holiday closure dates must be YYYY-MM-DD", None
        if date_str in seen:
            return f"Duplicate holiday closure for {date_str}", None
        seen.add(date_str)
        normalized.append({"date": date_str, "reason": reason})
    normalized.sort(key=lambda item: item["date"])
    return None, normalized


def _parse_optional_int(data, key, *, minimum=0):
    if key not in data:
        return None
    raw = data.get(key)
    if raw is None or raw == "":
        return None
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise ValueError(f"{key} must be a number")
    if value < minimum:
        raise ValueError(f"{key} must be at least {minimum}")
    return value


def _validate_seat_zones(seat_zones):
    if not isinstance(seat_zones, list):
        return "seat_zones must be a list", None

    normalized = []
    seen = set()
    for entry in seat_zones:
        if not isinstance(entry, dict):
            return "Each seat zone must be an object", None
        zone = (entry.get("zone") or "").strip()
        if not zone:
            return "Each seat zone needs a name", None
        key = zone.lower()
        if key in seen:
            return f"Duplicate seat zone '{zone}'", None
        seen.add(key)
        try:
            seats = int(entry.get("seats"))
        except (TypeError, ValueError):
            return f"Seat count for {zone} must be a number", None
        if seats <= 0:
            return f"Seat count for {zone} must be greater than zero", None
        normalized.append({"zone": zone, "seats": seats})
    return None, normalized


class LibrarySettingsResource(Resource):
    @admin_required
    def get(self):
        settings = LibrarySettings.query.first()
        if not settings:
            return {"message": "Library settings not configured"}, 404
        return settings.to_dict(), 200

    @admin_required
    def put(self):
        settings = LibrarySettings.query.first()
        if not settings:
            return {"message": "Library settings not configured"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        has_hours = "open_time" in data or "close_time" in data
        has_weekly = "weekly_hours" in data
        has_closures = "holiday_closures" in data
        has_zones = "seat_zones" in data
        limit_keys = {
            "total_seats",
            "min_booking_minutes",
            "max_booking_hours",
            "max_bookings_per_day",
            "max_booking_days_ahead",
            "cancellation_period",
            "waitlist_enabled",
        }
        has_limits = any(key in data for key in limit_keys)
        if not has_hours and not has_weekly and not has_closures and not has_limits and not has_zones:
            return {
                "message": "open_time, close_time, weekly_hours, holiday_closures, seat_zones or booking limits are required"
            }, 400

        new_open = settings.open_time
        new_close = settings.close_time

        if "open_time" in data:
            new_open = _parse_hhmm(data.get("open_time"))
            if new_open is None:
                return {"message": "open_time must be in HH:MM format"}, 400

        if "close_time" in data:
            new_close = _parse_hhmm(data.get("close_time"))
            if new_close is None:
                return {"message": "close_time must be in HH:MM format"}, 400

        if new_open and new_close and new_close <= new_open:
            return {"message": "close_time must be after open_time"}, 400

        if has_hours:
            settings.open_time = new_open
            settings.close_time = new_close

        if has_weekly:
            error, weekly_hours = _validate_weekly_hours(data.get("weekly_hours"))
            if error:
                return {"message": error}, 400
            settings.weekly_hours = json.dumps(weekly_hours)
            open_days = [day for day in weekly_hours if day["is_open"]]
            if open_days:
                settings.open_time = _parse_hhmm(open_days[0]["open_time"])
                settings.close_time = _parse_hhmm(open_days[0]["close_time"])

        if has_closures:
            error, holiday_closures = _validate_holiday_closures(data.get("holiday_closures"))
            if error:
                return {"message": error}, 400
            settings.holiday_closures = json.dumps(holiday_closures)

        if has_zones:
            error, seat_zones = _validate_seat_zones(data.get("seat_zones"))
            if error:
                return {"message": error}, 400
            settings.seat_zones = json.dumps(seat_zones)

        try:
            if "total_seats" in data:
                settings.total_seats = _parse_optional_int(data, "total_seats", minimum=1)
            if "min_booking_minutes" in data:
                settings.min_booking_minutes = _parse_optional_int(
                    data, "min_booking_minutes", minimum=1
                )
            if "max_booking_hours" in data:
                settings.max_booking_hours = _parse_optional_int(
                    data, "max_booking_hours", minimum=1
                )
            if "max_bookings_per_day" in data:
                settings.max_bookings_per_day = _parse_optional_int(
                    data, "max_bookings_per_day", minimum=1
                )
            if "max_booking_days_ahead" in data:
                settings.max_booking_days_ahead = _parse_optional_int(
                    data, "max_booking_days_ahead", minimum=0
                )
            if "cancellation_period" in data:
                settings.cancellation_period = _parse_optional_int(
                    data, "cancellation_period", minimum=0
                )
        except ValueError as exc:
            return {"message": str(exc)}, 400

        if (
            settings.min_booking_minutes
            and settings.max_booking_hours
            and settings.min_booking_minutes >= settings.max_booking_hours * 60
        ):
            return {"message": "Minimum booking duration must be less than the maximum"}, 400

        if "waitlist_enabled" in data:
            waitlist_enabled = data.get("waitlist_enabled")
            if not isinstance(waitlist_enabled, bool):
                return {"message": "waitlist_enabled must be true or false"}, 400
            settings.waitlist_enabled = waitlist_enabled

        settings.updated_by = int(get_jwt_identity())
        settings.updated_at = datetime.now(timezone.utc)

        db.session.commit()
        return {"message": "Settings updated", "settings": settings.to_dict()}, 200


class SeatZonesResource(Resource):

    @jwt_required()
    def get(self):
        settings = LibrarySettings.query.first()
        zones = settings.seat_zones_list() if settings else []
        return {
            "seat_zones": zones,
            "total_seats": settings.total_seats if settings else None,
        }, 200
