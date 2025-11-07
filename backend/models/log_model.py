from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LogCreate(BaseModel):
    date: str
    jobs_applied: int
    submissions_done: int
    remarks: Optional[str] = ""
    mood: Optional[str] = ""

class LogUpdate(BaseModel):
    jobs_applied: Optional[int] = None
    submissions_done: Optional[int] = None
    remarks: Optional[str] = None
    mood: Optional[str] = None

class LogResponse(BaseModel):
    id: str
    user_id: str
    date: str
    jobs_applied: int
    submissions_done: int
    remarks: str
    mood: str
    created_at: datetime

