from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, logs

app = FastAPI(title="Student Progress Tracker API")

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

app.include_router(auth.router)
app.include_router(logs.router)

@app.get("/")
async def root():
    return {"message": "Student Progress Tracker API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

