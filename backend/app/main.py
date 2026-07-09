from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import engine, Base
from app.models.user import User
from app.models.resume import Resume

# -----------------------
# CREATE TABLES ON STARTUP
# -----------------------
Base.metadata.create_all(bind=engine)

from app.api.v1.users import router as user_router
from app.api.v1.resumes import router as resume_router
from app.api.v1.ai import router as ai_router
from app.api.v1.job_match import router as job_match_router
from app.api.v1.history import router as history_router
from app.api.v1.dashboard import router as dashboard_router

app = FastAPI(
    title="AI Resume Analyzer API",
    version="1.0.0"
)

# -----------------------
# CORS MIDDLEWARE
# -----------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# ROUTES
# -----------------------
app.include_router(user_router)
app.include_router(resume_router)
app.include_router(ai_router)
app.include_router(job_match_router)
app.include_router(history_router)
app.include_router(dashboard_router)

# -----------------------
# ROOT ENDPOINT
# -----------------------
@app.get("/")
def root():
    return {
        "message": "AI Resume Analyzer Backend Running 🚀"
    }