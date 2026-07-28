import os
import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.skill_verification import SkillVerification
from app.core.security import get_current_user
from app.ai.gemini_service import generate_skill_mcq_test, generate_learning_resources

router = APIRouter()

UPLOAD_DIR = "uploads/certificates"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


class GenerateTestRequest(BaseModel):
    skill_name: str


class SubmitTestRequest(BaseModel):
    skill_name: str
    score: int
    total: int = 10


@router.get("/verifications")
def get_user_skill_verifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = db.query(SkillVerification).filter(SkillVerification.user_id == current_user.id).all()
    return records


@router.post("/verify/certificate")
async def verify_skill_by_certificate(
    skill_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only PDF, PNG, JPG, JPEG allowed."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum limit of 5 MB."
        )

    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Upsert verification record
    record = db.query(SkillVerification).filter(
        SkillVerification.user_id == current_user.id,
        SkillVerification.skill_name.ilike(skill_name)
    ).first()

    if not record:
        record = SkillVerification(
            user_id=current_user.id,
            skill_name=skill_name,
            status="verified_certificate",
            certificate_file_name=file.filename,
            certificate_file_path=file_path,
        )
        db.add(record)
    else:
        record.status = "verified_certificate"
        record.certificate_file_name = file.filename
        record.certificate_file_path = file_path

    db.commit()
    db.refresh(record)

    return {
        "message": "Certificate uploaded successfully!",
        "status": "verified_certificate",
        "skill_name": skill_name,
        "record": {
            "id": record.id,
            "skill_name": record.skill_name,
            "status": record.status,
            "certificate_file_name": record.certificate_file_name
        }
    }


@router.post("/generate-test")
def generate_test(
    body: GenerateTestRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        raw_json = generate_skill_mcq_test(body.skill_name)
        questions = json.loads(raw_json)
        return {
            "skill_name": body.skill_name,
            "questions": questions
        }
    except Exception as e:
        print("Error generating MCQ test:", e)
        # Fallback 10 MCQs for popular skills if AI response parse fails
        fallback_q = [
            {
                "id": i + 1,
                "question": f"Question {i+1}: What is a core concept in {body.skill_name}?",
                "options": [f"Standard Option A", f"Core Feature B", f"Best Practice C", f"Advanced Mechanism D"],
                "correct_index": 1
            }
            for i in range(10)
        ]
        return {
            "skill_name": body.skill_name,
            "questions": fallback_q
        }


@router.post("/submit-test")
def submit_test(
    body: SubmitTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    passed = body.score >= 6
    status_str = "verified_ai_test" if passed else "learning_recommended"
    resources = None

    if not passed:
        try:
            raw_resources = generate_learning_resources(body.skill_name)
            resources = json.loads(raw_resources)
        except Exception as e:
            print("Error generating learning resources:", e)
            resources = [
                {
                    "title": f"Official {body.skill_name} Documentation",
                    "type": "Documentation",
                    "url": f"https://www.google.com/search?q={body.skill_name}+official+documentation",
                    "difficulty": "Beginner to Advanced",
                    "estimated_time": "10 Hours"
                },
                {
                    "title": f"FreeCodeCamp {body.skill_name} Full Course",
                    "type": "Course",
                    "url": f"https://www.youtube.com/results?search_query=freecodecamp+{body.skill_name}",
                    "difficulty": "Beginner",
                    "estimated_time": "5 Hours"
                }
            ]

    # Upsert verification record
    record = db.query(SkillVerification).filter(
        SkillVerification.user_id == current_user.id,
        SkillVerification.skill_name.ilike(body.skill_name)
    ).first()

    if not record:
        record = SkillVerification(
            user_id=current_user.id,
            skill_name=body.skill_name,
            status=status_str,
            score=body.score,
            learning_resources=resources
        )
        db.add(record)
    else:
        record.status = status_str
        record.score = body.score
        if not passed:
            record.learning_resources = resources

    db.commit()
    db.refresh(record)

    return {
        "skill_name": body.skill_name,
        "score": body.score,
        "total": body.total,
        "passed": passed,
        "status": status_str,
        "learning_resources": resources
    }
