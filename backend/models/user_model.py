from pydantic import BaseModel, EmailStr
from typing import Literal
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: Literal["admin", "super-admin", "student"]

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime

