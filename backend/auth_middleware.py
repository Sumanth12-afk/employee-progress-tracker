from fastapi import Header, HTTPException, Depends
from firebase_admin import auth
import firebase_config

ADMIN_EMAILS = {
    "sumanthnallandhigal@gmail.com": "super-admin",
    "venubhavana@gmail.com": "admin",
    "vgdarur@gmail.com": "admin",
}

async def verify_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = authorization.replace("Bearer ", "")
    try:
        decoded_token = auth.verify_id_token(token)
    except auth.InvalidIdTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    except auth.ExpiredIdTokenError as exc:
        raise HTTPException(status_code=401, detail="Token expired") from exc
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

def require_role(*allowed_roles):
    async def role_checker(current_user: dict = Depends(verify_token)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

