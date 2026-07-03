from fastapi import FastAPI
from app.api.v1.users import router as user_router

app = FastAPI(
    title="AI Resume Analyzer API",
    version="1.0.0"
)

app.include_router(user_router)

@app.get("/")
def root():
    return {
        "message": "AI Resume Analyzer Backend Running 🚀"
    }