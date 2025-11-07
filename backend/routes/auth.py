from fastapi import APIRouter, HTTPException
from firebase_admin import auth
from pydantic import BaseModel
import firebase_config

ADMIN_EMAILS = {
    "sumanthnallandhigal@gmail.com": "super-admin",
    "venubhavana@gmail.com": "admin",
    "vgdarur@gmail.com": "admin",
}

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    token: str

@router.post("/login")
async def login(request: LoginRequest):
    try:
        decoded_token = auth.verify_id_token(request.token)
    except auth.InvalidIdTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid Firebase token") from exc
    except auth.ExpiredIdTokenError as exc:
        raise HTTPException(status_code=401, detail="Token has expired") from exc
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Authentication failed") from exc

    email = decoded_token.get("email")
    name = decoded_token.get("name") or (email.split("@")[0] if email else "")

    if not email:
        raise HTTPException(status_code=401, detail="Email not found in token")

    role = ADMIN_EMAILS.get(email, "employee")

    return {
        "email": email,
        "name": name,
        "role": role
    }

