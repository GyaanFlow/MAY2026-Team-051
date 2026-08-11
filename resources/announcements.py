from flask import request
from flask_restful import Resource
from models import db, Announcement
from utils import admin_required
from flask_jwt_extended import jwt_required


class AdminAnnouncementListCreateResource(Resource):
    @admin_required
    def post(self):
        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        title = data.get("title")
        content = data.get("content")

        if not title or not content:
            return {"message": "title and content are required"}, 400

        ann = Announcement(title=title, content=content, is_active=True)
        db.session.add(ann)
        db.session.commit()

        return {"message": "Announcement created", "announcement": ann.to_dict()}, 201


class AnnouncementListResource(Resource):
    @jwt_required()
    def get(self):
        anns = Announcement.query.filter_by(is_active=True).order_by(Announcement.created_at.desc()).all()
        return [a.to_dict() for a in anns], 200


class AdminAnnouncementDetailResource(Resource):
    @admin_required
    def put(self, announcement_id):
        ann = db.session.get(Announcement, announcement_id)
        if not ann:
            return {"message": "Announcement not found"}, 404

        data = request.get_json(silent=True)
        if data is None:
            return {"message": "Request body must be JSON"}, 400

        if "title" in data:
            ann.title = data["title"] or ann.title
        if "content" in data:
            ann.content = data["content"] or ann.content
        if "is_active" in data:
            ann.is_active = bool(data["is_active"])

        db.session.commit()
        return {"message": "Announcement updated", "announcement": ann.to_dict()}, 200

    @admin_required
    def delete(self, announcement_id):
        ann = db.session.get(Announcement, announcement_id)
        if not ann:
            return {"message": "Announcement not found"}, 404

        db.session.delete(ann)
        db.session.commit()
        return {"message": "Announcement deleted"}, 200