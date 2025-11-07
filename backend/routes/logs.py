from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv
import boto3
import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from auth_middleware import verify_token

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET = os.getenv("S3_BUCKET")
ATTACHMENTS_BUCKET = os.getenv("ATTACHMENTS_BUCKET")

if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, ATTACHMENTS_BUCKET]):
    raise RuntimeError("Missing required AWS environment variables.")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
)

router = APIRouter(prefix="/logs", tags=["logs"])


class LogEntry(BaseModel):
    email: EmailStr
    topic_learned: str = Field(..., min_length=1)
    day: str = Field(..., min_length=1)
    jobs_applied: int = 0
    submissions_done: int = 0
    what_you_learned: str = Field(..., min_length=1)
    recruiter_name: str = Field(..., min_length=1)


def upload_log_to_s3_sync(key: str, data: Dict[str, Any]) -> None:
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=json.dumps(data).encode("utf-8"),
        ContentType="application/json",
    )


def upload_attachment_to_s3_sync(key: str, data: bytes, content_type: Optional[str]) -> None:
    s3_client.put_object(
        Bucket=ATTACHMENTS_BUCKET,
        Key=key,
        Body=data,
        ContentType=content_type or "application/octet-stream",
    )


def list_daily_logs_objects_sync(prefix: str) -> List[Dict[str, Any]]:
    paginator = s3_client.get_paginator("list_objects_v2")
    objects: List[Dict[str, Any]] = []
    for page in paginator.paginate(Bucket=S3_BUCKET, Prefix=prefix):
        contents = page.get("Contents", [])
        objects.extend(contents)
    return objects


def get_object_body_sync(key: str) -> Dict[str, Any]:
    response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
    raw_body = response["Body"].read().decode("utf-8")
    return json.loads(raw_body)


def generate_presigned_url_sync(bucket: str, key: str) -> str:
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=3600,
    )


async def upload_log_to_s3(key: str, data: Dict[str, Any]) -> None:
    await run_in_threadpool(upload_log_to_s3_sync, key, data)


async def upload_attachment_to_s3(key: str, file: UploadFile) -> None:
    data = await file.read()
    await run_in_threadpool(upload_attachment_to_s3_sync, key, data, file.content_type)


async def list_daily_logs_objects(prefix: str) -> List[Dict[str, Any]]:
    return await run_in_threadpool(list_daily_logs_objects_sync, prefix)


async def get_object_body(key: str) -> Dict[str, Any]:
    return await run_in_threadpool(get_object_body_sync, key)


async def generate_presigned_url(bucket: str, key: str) -> str:
    return await run_in_threadpool(generate_presigned_url_sync, bucket, key)


@router.post("", summary="Create a daily log entry")
async def create_log(
    payload: str = Form(...),
    attachment: UploadFile = File(...),
    current_user: dict = Depends(verify_token),
):
    try:
        entry = LogEntry(**json.loads(payload))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc

    if entry.email.lower() != current_user["email"].lower():
        raise HTTPException(status_code=403, detail="You can only submit logs for your own account.")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    log_key = f"daily_logs/{today}/{entry.email}.json"

    log_payload = {
        "email": entry.email,
        "topic_learned": entry.topic_learned,
        "day": entry.day,
        "jobs_applied": entry.jobs_applied,
        "submissions_done": entry.submissions_done,
        "what_you_learned": entry.what_you_learned,
        "recruiter_name": entry.recruiter_name,
        "date": today,
    }

    attachment_url = None
    filename = (attachment.filename or "").replace(" ", "_")
    extension = os.path.splitext(filename)[1].lower()
    allowed_extensions = {".pdf", ".docx"}
    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Attachment must be a PDF or DOCX file.")

    attachment_key = f"attachments/{today}/{entry.email}/{filename}"
    try:
        await upload_attachment_to_s3(attachment_key, attachment)
        attachment_url = await generate_presigned_url(ATTACHMENTS_BUCKET, attachment_key)
        log_payload.update(
            {
                "attachment_key": attachment_key,
                "attachment_filename": filename,
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to upload attachment") from exc

    try:
        await upload_log_to_s3(log_key, log_payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to store log entry") from exc

    return {
        "message": "Log stored successfully",
        "path": log_key,
        "attachment_url": attachment_url,
        "attachment_filename": filename,
    }


@router.get("/me", summary="Get logs for current user")
async def get_my_logs(current_user: dict = Depends(verify_token)):
    prefix = "daily_logs/"
    try:
        objects = await list_daily_logs_objects(prefix)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to list log entries") from exc

    user_logs: List[Dict[str, Any]] = []
    for obj in objects:
        key = obj.get("Key")
        if not key or not key.endswith(f"/{current_user['email']}.json"):
            continue
        try:
            log = await get_object_body(key)
        except Exception:
            continue

        attachment_key = log.get("attachment_key")
        attachment_url = None
        if attachment_key:
            try:
                attachment_url = await generate_presigned_url(ATTACHMENTS_BUCKET, attachment_key)
            except Exception:
                attachment_url = None
        log["attachment_url"] = attachment_url
        log["attachment_filename"] = log.get("attachment_filename")
        user_logs.append(log)

    user_logs.sort(key=lambda item: item.get("date", ""), reverse=True)
    return {"logs": user_logs}


@router.get("/analytics", summary="Get aggregated analytics")
async def get_analytics():
    prefix = "daily_logs/"
    try:
        objects = await list_daily_logs_objects(prefix)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to list log entries") from exc

    aggregated: Dict[str, Dict[str, Any]] = {}
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    top_performer: Optional[Dict[str, Any]] = None

    for obj in objects:
        key = obj.get("Key")
        if not key or not key.endswith(".json"):
            continue
        try:
            log = await get_object_body(key)
        except Exception:
            continue

        email = log.get("email")
        if not email:
            continue

        jobs = int(log.get("jobs_applied") or 0)
        submissions = int(log.get("submissions_done") or 0)
        topic = log.get("topic_learned") or ""
        day = log.get("day") or ""
        reflection = log.get("what_you_learned") or ""
        recruiter = log.get("recruiter_name") or ""
        date_str = log.get("date") or today
        attachment_key = log.get("attachment_key")
        attachment_filename = log.get("attachment_filename")
        attachment_url = None
        if attachment_key:
            try:
                attachment_url = await generate_presigned_url(ATTACHMENTS_BUCKET, attachment_key)
            except Exception:
                attachment_url = None

        record = aggregated.setdefault(
            email,
            {
                "email": email,
                "total_jobs": 0,
                "total_submissions": 0,
                "latest_topic_learned": "",
                "current_day": "",
                "last_reflection": "",
                "last_recruiter": "",
                "last_attachment_url": None,
                "last_attachment_filename": None,
                "last_update": "1970-01-01",
                "daily_logs": [],
            },
        )

        record["total_jobs"] += jobs
        record["total_submissions"] += submissions
        record["daily_logs"].append(
            {
                "date": date_str,
                "day": day,
                "topic_learned": topic,
                "what_you_learned": reflection,
                "jobs_applied": jobs,
                "submissions_done": submissions,
                "recruiter_name": recruiter,
                "attachment_url": attachment_url,
                "attachment_filename": attachment_filename,
            }
        )

        if date_str >= record["last_update"]:
            record["latest_topic_learned"] = topic
            record["current_day"] = day
            record["last_reflection"] = reflection
            record["last_recruiter"] = recruiter
            record["last_update"] = date_str
            record["last_attachment_url"] = attachment_url
            record["last_attachment_filename"] = attachment_filename

        if date_str == today:
            if not top_performer or submissions > top_performer["submissions_done"]:
                top_performer = {
                    "email": email,
                    "submissions_done": submissions,
                    "jobs_applied": jobs,
                    "topic_learned": topic,
                    "what_you_learned": reflection,
                    "recruiter_name": recruiter,
                    "day": day,
                    "date": date_str,
                    "attachment_url": attachment_url,
                    "attachment_filename": attachment_filename,
                }

    for record in aggregated.values():
        record["daily_logs"].sort(key=lambda item: item.get("date", ""), reverse=True)

    sorted_records = sorted(
        aggregated.values(),
        key=lambda item: item["last_update"],
        reverse=True,
    )

    return {"top_performer": top_performer, "analytics": sorted_records}
