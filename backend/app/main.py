from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from app.database.session import engine, Base
from app.models.user import User
from app.models.resume import Resume

# -----------------------
# CREATE TABLES ON STARTUP
# -----------------------
Base.metadata.create_all(bind=engine)

profile_columns = [
    "auth_provider VARCHAR(50) DEFAULT 'email'",
    "phone VARCHAR(50)",
    "dob VARCHAR(50)",
    "gender VARCHAR(50)",
    "city VARCHAR(100)",
    "state VARCHAR(100)",
    "country VARCHAR(100)",
    "college VARCHAR(255)",
    "degree VARCHAR(100)",
    "branch VARCHAR(100)",
    "current_semester VARCHAR(50)",
    "graduation_year VARCHAR(50)",
    "cgpa VARCHAR(50)",
    "current_role VARCHAR(100)",
    "about_me VARCHAR(1000)",
    "experience_years VARCHAR(50)",
    "preferred_role VARCHAR(100)",
    "preferred_work_mode VARCHAR(50)",
    "skills_tech VARCHAR(500)",
    "skills_programming VARCHAR(500)",
    "skills_frameworks VARCHAR(500)",
    "skills_databases VARCHAR(500)",
    "skills_tools VARCHAR(500)",
    "github_url VARCHAR(255)",
    "linkedin_url VARCHAR(255)",
    "portfolio_url VARCHAR(255)",
    "leetcode_url VARCHAR(255)",
    "hackerrank_url VARCHAR(255)",
]

try:
    with engine.connect() as conn:
        for col_def in profile_columns:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_def};"))
                conn.commit()
            except Exception:
                pass
except Exception as e:
    print(f"[INFO] Migration check info: {e}")

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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-resume-analyzer-nine-dun.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
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