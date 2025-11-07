from fastapi import APIRouter, HTTPException, Depends
from database import users_collection, logs_collection
from auth_middleware import require_role
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/overview")
async def get_overview(current_user: dict = Depends(require_role("admin", "super-admin"))):
    students = await users_collection.count_documents({"role": "student"})
    
    pipeline = [
        {
            "$group": {
                "_id": None,
                "total_jobs": {"$sum": "$jobs_applied"},
                "total_submissions": {"$sum": "$submissions_done"}
            }
        }
    ]
    
    result = await logs_collection.aggregate(pipeline).to_list(1)
    stats = result[0] if result else {"total_jobs": 0, "total_submissions": 0}
    
    return {
        "success": True,
        "overview": {
            "active_students": students,
            "total_jobs_applied": stats.get("total_jobs", 0),
            "total_submissions": stats.get("total_submissions", 0)
        }
    }

@router.get("/students")
async def get_all_students(current_user: dict = Depends(require_role("admin", "super-admin"))):
    students = await users_collection.find({"role": "student"}).to_list(1000)
    
    student_data = []
    for student in students:
        latest_log = await logs_collection.find_one(
            {"user_id": str(student["_id"])},
            sort=[("date", -1)]
        )
        
        total_jobs_pipeline = [
            {"$match": {"user_id": str(student["_id"])}},
            {
                "$group": {
                    "_id": None,
                    "total_jobs": {"$sum": "$jobs_applied"},
                    "total_submissions": {"$sum": "$submissions_done"}
                }
            }
        ]
        
        totals = await logs_collection.aggregate(total_jobs_pipeline).to_list(1)
        total_stats = totals[0] if totals else {"total_jobs": 0, "total_submissions": 0}
        
        student_data.append({
            "id": str(student["_id"]),
            "name": student["name"],
            "email": student["email"],
            "total_jobs_applied": total_stats.get("total_jobs", 0),
            "total_submissions": total_stats.get("total_submissions", 0),
            "last_activity": latest_log["date"] if latest_log else None,
            "created_at": student["created_at"]
        })
    
    return {"success": True, "students": student_data}

@router.get("/student/{student_id}/logs")
async def get_student_logs(student_id: str, current_user: dict = Depends(require_role("admin", "super-admin"))):
    student = await users_collection.find_one({"_id": ObjectId(student_id)})
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    logs = await logs_collection.find({"user_id": student_id}).sort("date", -1).to_list(1000)
    
    return {
        "success": True,
        "student": {
            "id": str(student["_id"]),
            "name": student["name"],
            "email": student["email"]
        },
        "logs": [
            {
                "id": str(log["_id"]),
                "date": log["date"],
                "jobs_applied": log["jobs_applied"],
                "submissions_done": log["submissions_done"],
                "remarks": log.get("remarks", ""),
                "mood": log.get("mood", ""),
                "created_at": log["created_at"]
            }
            for log in logs
        ]
    }

@router.post("/manage-admin")
async def manage_admin(email: str, action: str, current_user: dict = Depends(require_role("super-admin"))):
    if action not in ["add", "remove"]:
        raise HTTPException(status_code=400, detail="Action must be 'add' or 'remove'")
    
    user = await users_collection.find_one({"email": email})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if action == "add":
        await users_collection.update_one(
            {"email": email},
            {"$set": {"role": "admin"}}
        )
        return {"success": True, "message": f"{email} is now an admin"}
    else:
        await users_collection.update_one(
            {"email": email},
            {"$set": {"role": "student"}}
        )
        return {"success": True, "message": f"{email} removed from admin"}

@router.get("/leaderboard")
async def get_leaderboard(current_user: dict = Depends(require_role("admin", "super-admin"))):
    pipeline = [
        {
            "$group": {
                "_id": "$user_id",
                "total_jobs": {"$sum": "$jobs_applied"},
                "total_submissions": {"$sum": "$submissions_done"}
            }
        },
        {"$sort": {"total_jobs": -1}},
        {"$limit": 20}
    ]
    
    results = await logs_collection.aggregate(pipeline).to_list(20)
    
    leaderboard = []
    for result in results:
        user = await users_collection.find_one({"_id": ObjectId(result["_id"])})
        if user:
            leaderboard.append({
                "id": result["_id"],
                "name": user["name"],
                "email": user["email"],
                "total_jobs_applied": result["total_jobs"],
                "total_submissions": result["total_submissions"]
            })
    
    return {"success": True, "leaderboard": leaderboard}

