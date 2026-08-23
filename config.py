# gaurav: fix - no env/config support at all, secrets and DB url were hardcoded
import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _required_in_production(name, default):
    value = os.environ.get(name, default)
    if os.environ.get("FLASK_ENV") == "production" and value == default:
        raise RuntimeError(
            f"{name} must be set to a secure value via environment variable in production"
        )
    return value


class Config:
    ENV = os.environ.get("FLASK_ENV", "development")
    DEBUG = ENV != "production"

    SECRET_KEY = _required_in_production("SECRET_KEY", "change-me-in-production")
    JWT_SECRET_KEY = _required_in_production("JWT_SECRET_KEY", "jwt-change-me-in-production")

    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_HOURS", 8))
    )

    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
