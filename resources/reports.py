from collections import Counter
from datetime import date, timedelta
from flask_restful import Resource
from models import db, Booking, Student, MembershipPlan
from utils import admin_required


class OccupancyReportResource(Resource):
    @admin_required
    def get(self):
        # simple last 7 days occupancy: number of confirmed bookings per day
        today = date.today()
        start_date = today - timedelta(days=6)

        rows = (
            db.session.query(Booking.booking_date, db.func.count(Booking.booking_id))
            .filter(
                Booking.booking_date >= start_date,
                Booking.booking_date <= today,
                Booking.status == "Confirmed",
            )
            .group_by(Booking.booking_date)
            .order_by(Booking.booking_date)
            .all()
        )

        data = [
            {"date": str(d), "bookings": int(count)}
            for d, count in rows
        ]

        return {"start_date": str(start_date), "end_date": str(today), "occupancy": data}, 200


class PeakHoursReportResource(Resource):
    @admin_required
    def get(self):
        # group by hour of start_time
        rows = (
            db.session.query(db.func.strftime("%H", Booking.start_time), db.func.count(Booking.booking_id))
            .filter(Booking.status == "Confirmed")
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
        # very simple: sum plan.price for Active students by plan
        rows = (
            db.session.query(MembershipPlan.plan_name, db.func.count(Student.student_id), db.func.sum(MembershipPlan.price))
            .join(Student, Student.plan_id == MembershipPlan.plan_id)
            .filter(Student.membership_status == "Active")
            .group_by(MembershipPlan.plan_name)
            .all()
        )

        data = []
        total_revenue = 0.0
        for plan_name, count, sum_price in rows:
            plan_revenue = float(sum_price or 0.0)
            total_revenue += plan_revenue
            data.append({
                "plan_name": plan_name,
                "active_members": int(count),
                "revenue": plan_revenue,
            })

        return {"total_revenue": total_revenue, "by_plan": data}, 200


class MembershipStatsReportResource(Resource):
    @admin_required
    def get(self):
        # count students by membership_status
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