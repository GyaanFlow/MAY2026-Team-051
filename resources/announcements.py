from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models import db, Announcement, User
from utils import admin_required

VALID_AUDIENCES = ("all", "students", "staff")
VALID_PRIORITIES = ("Normal", "Important", "Urgent")


def _user_display_name(user):
    if not user:
        return None
    return user.full_name or user.username


def _announcement_payload(announcement):
    data = announcement.to_dict()
    creator = db.session.get(User, announcement.created_by) if announcement.created_by else None
    data["created_by_name"] = _user_display_name(creator)
    return data


def _validate_audience(value, required=False):
    if value is None:
        return None if not required else False
    audience = str(value).strip().lower()
    if audience not in VALID_AUDIENCES:
        return False
    return audience


def _validate_priority(value, required=False):
    if value is None:
        return None if not required else False
    if value not in VALID_PRIORITIES:
        return False
    return value


class AdminAnnouncementListCreateResource(Resource):
    @admin_required
    def get(self):
        announcements = Announcement.query.order_by(Announcement.created_at.desc()).all()
        result = [_announcement_payload(announcement) for announcement in announcements]
        return {"total_announcements": len(result), "announcements": result}, 200

    @admin_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        title = (data.get("title") or "").strip()
        content = (data.get("content") or data.get("message") or "").strip()
        if not title or not content:
            return {"message": "title and content are required"}, 400
        if len(title) > 200:
            return {"message": "title must be 200 characters or fewer"}, 400

        audience = _validate_audience(data.get("audience", "all"), required=True)
        if audience is False:
            return {"message": "audience must be one of: all, students, staff"}, 400

        priority = _validate_priority(data.get("priority", "Normal"), required=True)
        if priority is False:
            return {"message": "priority must be one of: Normal, Important, Urgent"}, 400

        announcement = Announcement(
            title=title,
            content=content,
            audience=audience,
            priority=priority,
            is_active=True,
            created_by=int(get_jwt_identity()),
        )
        db.session.add(announcement)
        db.session.commit()
        return {
            "message": "Announcement created",
            "announcement": _announcement_payload(announcement),
        }, 201


class AnnouncementListResource(Resource):
    @jwt_required()
    def get(self):
        role = get_jwt().get("role")
        query = Announcement.query.filter_by(is_active=True)
        if role == "Student":
            query = query.filter(Announcement.audience.in_(("all", "students")))
        elif role == "Staff":
            query = query.filter(Announcement.audience.in_(("all", "staff")))

        announcements = query.order_by(Announcement.created_at.desc()).all()
        result = [_announcement_payload(announcement) for announcement in announcements]
        return {"total_announcements": len(result), "announcements": result}, 200


class AdminAnnouncementDetailResource(Resource):
    @admin_required
    def put(self, announcement_id):
        announcement = db.session.get(Announcement, announcement_id)
        if not announcement:
            return {"message": "Announcement not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        if "title" in data:
            title = (data.get("title") or "").strip()
            if not title:
                return {"message": "title cannot be empty"}, 400
            if len(title) > 200:
                return {"message": "title must be 200 characters or fewer"}, 400
            announcement.title = title

        if "content" in data or "message" in data:
            content = (data.get("content") or data.get("message") or "").strip()
            if not content:
                return {"message": "content cannot be empty"}, 400
            announcement.content = content

        if "audience" in data:
            audience = _validate_audience(data.get("audience"), required=True)
            if audience is False:
                return {"message": "audience must be one of: all, students, staff"}, 400
            announcement.audience = audience

        if "priority" in data:
            priority = _validate_priority(data.get("priority"), required=True)
            if priority is False:
                return {"message": "priority must be one of: Normal, Important, Urgent"}, 400
            announcement.priority = priority

        if "is_active" in data:
            announcement.is_active = bool(data["is_active"])

        db.session.commit()
        return {
            "message": "Announcement updated",
            "announcement": _announcement_payload(announcement),
        }, 200

    @admin_required
    def delete(self, announcement_id):
        announcement = db.session.get(Announcement, announcement_id)
        if not announcement:
            return {"message": "Announcement not found"}, 404

        db.session.delete(announcement)
        db.session.commit()
        return {"message": "Announcement deleted"}, 200
