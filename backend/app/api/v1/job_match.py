from fastapi import APIRouter, HTTPException

from app.schemas.job_match import JobMatchRequest
from app.ai.gemini_service import match_resume_job

router = APIRouter(
    prefix="/job",
    tags=["Job Matching"],
)


@router.post("/match")
def match_job(request: JobMatchRequest):
    try:
        result = match_resume_job(
            request.resume_text,
            request.job_description,
        )

        return {
            "success": True,
            "analysis": result,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )