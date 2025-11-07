from motor.motor_asyncio import AsyncIOMotorClient
from os import getenv
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = getenv("MONGODB_URI")
client = AsyncIOMotorClient(MONGODB_URI)
db = client.student_tracker

users_collection = db.users
logs_collection = db.daily_logs

