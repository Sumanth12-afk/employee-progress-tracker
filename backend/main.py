import asyncio
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import auth, logs

app = FastAPI(title="Employee Progress Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://employee-progress-tracker-b4u.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def log_uptime():
    while True:
        print(f"Server alive at {datetime.utcnow().isoformat()}")
        await asyncio.sleep(60)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(log_uptime())


app.include_router(auth.router)
app.include_router(logs.router)


@app.get("/")
async def root():
    return {"message": "Employee Progress Tracker API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "OK", "time": datetime.utcnow().isoformat()}

