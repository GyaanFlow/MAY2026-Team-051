from functools import wraps
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        if get_jwt().get("role") != "Admin":
            return {"message": "Admin access required"}, 403
        return fn(*args, **kwargs)
    return wrapper


def staff_or_admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        if get_jwt().get("role") not in ("Staff", "Admin"):
            return {"message": "Staff or Admin access required"}, 403
        return fn(*args, **kwargs)
    return wrapper


def student_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        if get_jwt().get("role") != "Student":
            return {"message": "Student access required"}, 403
        return fn(*args, **kwargs)
    return wrapper