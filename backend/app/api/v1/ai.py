from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ai.gemini_service import (
    analyze_resume,
    generate_career_advisor_response,
    evaluate_interview_answer,
    generate_career_roadmap,
)

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


class ResumeAnalysisRequest(BaseModel):
    resume_text: str


class CareerChatRequest(BaseModel):
    chat_history: list
    message: str
    resume_text: str = ""


class InterviewFeedbackRequest(BaseModel):
    question: str
    answer: str
    resume_text: str = ""


class CareerRoadmapRequest(BaseModel):
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


@router.post("/chatbot")
def chatbot_advisor_api(request: CareerChatRequest):
    try:
        result = generate_career_advisor_response(
            request.chat_history,
            request.message,
            request.resume_text,
        )

        return {
            "success": True,
            "response": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/interview/feedback")
def interview_feedback_api(request: InterviewFeedbackRequest):
    try:
        result = evaluate_interview_answer(
            request.question,
            request.answer,
            request.resume_text,
        )

        return {
            "success": True,
            "feedback": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/career-roadmap")
def career_roadmap_api(request: CareerRoadmapRequest):
    try:
        result = generate_career_roadmap(request.resume_text)

        return {
            "success": True,
            "roadmap": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )