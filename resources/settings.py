from datetime import datetime, time
from flask import request
from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity
from models import db, LibrarySettings
from utils import admin_required


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

        if "open_time" not in data and "close_time" not in data:
            return {"message": "open_time or close_time is required"}, 400

        new_open = settings.open_time
        new_close = settings.close_time

        if "open_time" in data:
            try:
                new_open = time.fromisoformat(data.get("open_time"))
            except (TypeError, ValueError):
                return {"message": "open_time must be in HH:MM format"}, 400

        if "close_time" in data:
            try:
                new_close = time.fromisoformat(data.get("close_time"))
            except (TypeError, ValueError):
                return {"message": "close_time must be in HH:MM format"}, 400

        if new_open and new_close and new_close <= new_open:
            return {"message": "close_time must be after open_time"}, 400

        settings.open_time = new_open
        settings.close_time = new_close
        settings.updated_by = int(get_jwt_identity())
        settings.updated_at = datetime.utcnow()

        db.session.commit()
        return {"message": "Operating hours updated", "settings": settings.to_dict()}, 200
