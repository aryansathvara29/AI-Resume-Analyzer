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
from app.dependencies.auth import get_current_user
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


import re


def validate_certificate_content(file_path: str, filename: str, skill_name: str) -> tuple[bool, str]:
    clean_skill = skill_name.strip().lower()
    clean_filename = filename.strip()

    # Skill keywords dictionary with exact target skill terms
    skill_keywords = {
        "java": ["java", "j2ee", "spring", "hibernate", "jdk", "oracle java", "java se", "java ee", "core java", "advanced java"],
        "python": ["python", "django", "flask", "fastapi", "numpy", "pandas", "python3", "pytest"],
        "javascript": ["javascript", "ecmascript", "node", "nodejs", "expressjs"],
        "react": ["react", "reactjs", "react.js", "jsx"],
        "sql": ["sql", "mysql", "postgresql", "postgres", "sqlite", "oracle sql", "t-sql", "pl/sql"],
        "docker": ["docker", "containerization", "kubernetes", "k8s", "dockerfile"],
        "aws": ["aws", "amazon web services", "ec2", "s3", "lambda", "cloudfront"],
    }

    target_keywords = skill_keywords.get(clean_skill, [clean_skill])

    # Helper function to check exact word boundaries
    def matches_skill(search_text: str) -> bool:
        if not search_text:
            return False
        for kw in target_keywords:
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, search_text, re.IGNORECASE):
                return True
        return False

    # 1. Check filename with exact word boundaries
    filename_matched = matches_skill(clean_filename)

    # 2. Extract text if PDF
    extracted_text = ""
    if file_path.lower().endswith(".pdf"):
        try:
            from app.utils.resume_parser import extract_resume_text
            extracted_text = extract_resume_text(file_path)
        except Exception as e:
            print(f"[WARNING] Certificate text extraction error: {e}")

    text_matched = matches_skill(extracted_text)

    # Reject if neither filename nor text matches target skill
    if not (filename_matched or text_matched):
        return False, f"Verification Failed: Uploaded document does not mention '{skill_name}'. Please upload a valid certificate for {skill_name}."

    return True, "Certificate validated successfully."


@router.post("/verify/certificate")
async def verify_skill_by_certificate(
    skill_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    original_filename = file.filename or f"{skill_name}_certificate.pdf"
    clean_filename = original_filename.strip()
    ext = os.path.splitext(clean_filename)[1].lower()
    content_type = (file.content_type or "").lower()

    is_valid_ext = ext in ALLOWED_EXTENSIONS
    is_valid_mime = any(m in content_type for m in ["pdf", "image", "png", "jpeg", "jpg"])

    if not (is_valid_ext or is_valid_mime):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only PDF, PNG, JPG, JPEG allowed."
        )

    if not ext:
        ext = ".pdf" if "pdf" in content_type else ".png"

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

    # Validate that certificate text or filename actually pertains to skill_name
    is_valid_cert, error_reason = validate_certificate_content(file_path, clean_filename, skill_name)
    if not is_valid_cert:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        raise HTTPException(
            status_code=400,
            detail=error_reason
        )

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
    passed = body.score >= 5
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
