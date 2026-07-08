from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ai.gemini_service import analyze_resume

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


class ResumeAnalysisRequest(BaseModel):
    resume_text: str


@router.post("/analyze")
def analyze_resume_api(request: ResumeAnalysisRequest):
    try:
        result = analyze_resume(request.resume_text)

        return {
            "success": True,
            "analysis": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )