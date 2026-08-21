from datetime import date, datetime, time, timedelta
from flask import request
from flask_restful import Resource
from models import db, Booking, Seat, Student, LibrarySettings, Payment, MembershipPlan
from utils import admin_required

ACTIVE_BOOKING_STATUSES = ("Confirmed", "Checked-In")
HOUR_BUCKETS = (8, 10, 12, 14, 16, 18, 20, 22)
WEEKDAY_LABELS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")


def _format_hour_label(hour):
    if hour == 0:
        return "12am"
    if hour < 12:
        return f"{hour}am"
    if hour == 12:
        return "12pm"
    return f"{hour - 12}pm"


def _range_window(range_key):
    today = date.today()
    if range_key == "today":
        return today, today
    if range_key == "month":
        return today - timedelta(days=29), today
    if range_key == "quarter":
        return today - timedelta(days=89), today
    return today - timedelta(days=6), today


def _active_seat_count():
    settings = LibrarySettings.query.first()
    counted = Seat.query.filter_by(is_active=True).count()
    if settings and settings.total_seats:
        return max(int(settings.total_seats), counted or 0)
    return counted


def _occupied_at(booking_date, point):
    return Booking.query.filter(
        Booking.booking_date == booking_date,
        Booking.status.in_(ACTIVE_BOOKING_STATUSES),
        Booking.start_time <= point,
        Booking.end_time > point,
    ).count()


def _occupancy_by_hour(start_date, end_date, active_seats):
    if active_seats <= 0:
        return [{"label": _format_hour_label(hour), "value": 0} for hour in HOUR_BUCKETS]

    day_count = (end_date - start_date).days + 1
    result = []
    for hour in HOUR_BUCKETS:
        point = time(hour, 0)
        total_pct = 0
        day = start_date
        while day <= end_date:
            occupied = _occupied_at(day, point)
            total_pct += round((occupied / active_seats) * 100)
            day += timedelta(days=1)
        result.append({
            "label": _format_hour_label(hour),
            "value": round(total_pct / day_count) if day_count else 0,
        })
    return result


def _payment_day(payment):
    value = payment.payment_date
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value)
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date()
    except ValueError:
        try:
            return datetime.strptime(text[:10], "%Y-%m-%d").date()
        except ValueError:
            return None


def _payments_in_range(start_date, end_date):
    start_dt = datetime.combine(start_date, time.min)
    end_dt = datetime.combine(end_date, time.max)
    return Payment.query.filter(
        Payment.payment_date >= start_dt,
        Payment.payment_date <= end_dt,
    ).all()


def _sum_amount(payments):
    return round(sum(float(payment.amount or 0) for payment in payments), 2)


def _revenue_trend(range_key, start_date, end_date, payments):
    by_day = {}
    for payment in payments:
        day = _payment_day(payment)
        if day is None:
            continue
        by_day[day] = by_day.get(day, 0.0) + float(payment.amount or 0)

    if range_key in ("week", "today"):
        trend = []
        day = start_date
        while day <= end_date:
            trend.append({
                "label": WEEKDAY_LABELS[day.weekday()],
                "value": round(by_day.get(day, 0.0)),
            })
            day += timedelta(days=1)
        return trend

    if range_key == "month":
        trend = []
        for week_index in range(4):
            week_start = start_date + timedelta(days=week_index * 7)
            week_end = min(week_start + timedelta(days=6), end_date)
            if week_start > end_date:
                break
            total = 0.0
            day = week_start
            while day <= week_end:
                total += by_day.get(day, 0.0)
                day += timedelta(days=1)
            trend.append({"label": f"Wk {week_index + 1}", "value": round(total)})
        return trend

    trend = []
    for month_index in range(3):
        month_start = start_date + timedelta(days=month_index * 30)
        month_end = min(month_start + timedelta(days=29), end_date)
        if month_start > end_date:
            break
        total = 0.0
        day = month_start
        while day <= month_end:
            total += by_day.get(day, 0.0)
            day += timedelta(days=1)
        trend.append({"label": f"Month {month_index + 1}", "value": round(total)})
    return trend


class OccupancyReportResource(Resource):
    @admin_required
    def get(self):
        range_key = (request.args.get("range") or "week").strip().lower()
        if range_key not in ("today", "week", "month", "quarter"):
            return {"message": "range must be one of: today, week, month, quarter"}, 400

        start_date, end_date = _range_window(range_key)
        active_seats = _active_seat_count()
        now = datetime.now()
        occupied_now = _occupied_at(now.date(), now.time().replace(second=0, microsecond=0))
        current_occupancy_pct = (
            round((occupied_now / active_seats) * 100) if active_seats else 0
        )

        occupancy_by_hour = _occupancy_by_hour(start_date, end_date, active_seats)
        avg_occupancy_pct = (
            round(sum(item["value"] for item in occupancy_by_hour) / len(occupancy_by_hour))
            if occupancy_by_hour
            else 0
        )

        total_bookings = Booking.query.filter(
            Booking.booking_date >= start_date,
            Booking.booking_date <= end_date,
            Booking.status.in_(("Confirmed", "Checked-In", "Completed", "No-Show")),
        ).count()

        return {
            "range": range_key,
            "start_date": str(start_date),
            "end_date": str(end_date),
            "active_seats": active_seats,
            "occupied_now": occupied_now,
            "current_occupancy_pct": current_occupancy_pct,
            "avg_occupancy_pct": avg_occupancy_pct,
            "occupancy_by_hour": occupancy_by_hour,
            "total_bookings": total_bookings,
        }, 200


class PeakHoursReportResource(Resource):
    @admin_required
    def get(self):
        rows = (
            db.session.query(
                db.func.strftime("%H", Booking.start_time),
                db.func.count(Booking.booking_id),
            )
            .filter(Booking.status.in_(ACTIVE_BOOKING_STATUSES))
            .group_by(db.func.strftime("%H", Booking.start_time))
            .order_by(db.func.strftime("%H", Booking.start_time))
            .all()
        )

        data = [
            {"hour": hour, "bookings": int(count)}
            for hour, count in rows
        ]
        return {"peak_hours": data}, 200


class RevenueReportResource(Resource):
    @admin_required
    def get(self):
        range_key = (request.args.get("range") or "week").strip().lower()
        if range_key not in ("today", "week", "month", "quarter"):
            return {"message": "range must be one of: today, week, month, quarter"}, 400

        start_date, end_date = _range_window(range_key)
        payments = _payments_in_range(start_date, end_date)
        total_revenue = _sum_amount(payments)
        paying_students = {payment.student_id for payment in payments}

        by_mode = {}
        for payment in payments:
            mode = payment.payment_mode or "Other"
            by_mode[mode] = by_mode.get(mode, 0.0) + float(payment.amount or 0)

        plan_rows = (
            db.session.query(
                MembershipPlan.plan_name,
                db.func.count(Student.student_id),
                db.func.sum(MembershipPlan.price),
            )
            .join(Student, Student.plan_id == MembershipPlan.plan_id)
            .filter(Student.membership_status == "Active")
            .group_by(MembershipPlan.plan_name)
            .all()
        )
        by_plan = []
        for plan_name, count, sum_price in plan_rows:
            by_plan.append({
                "plan_name": plan_name,
                "active_members": int(count),
                "revenue": float(sum_price or 0.0),
            })

        return {
            "range": range_key,
            "start_date": str(start_date),
            "end_date": str(end_date),
            "total_revenue": total_revenue,
            "payment_count": len(payments),
            "new_memberships": len(paying_students),
            "revenue_trend": _revenue_trend(range_key, start_date, end_date, payments),
            "by_mode": [
                {"payment_mode": mode, "revenue": round(amount, 2)}
                for mode, amount in sorted(by_mode.items())
            ],
            "by_plan": by_plan,
        }, 200


class MembershipStatsReportResource(Resource):
    @admin_required
    def get(self):
        rows = (
            db.session.query(Student.membership_status, db.func.count(Student.student_id))
            .group_by(Student.membership_status)
            .all()
        )

        data = [
            {"status": status, "count": int(count)}
            for status, count in rows
        ]
        total = sum(d["count"] for d in data)
        return {"total_students": total, "by_status": data}, 200
