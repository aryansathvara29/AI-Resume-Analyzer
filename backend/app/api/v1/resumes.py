import os
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse
from app.utils.resume_parser import extract_resume_text
from app.services.ats_service import calculate_ats_score

router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post(
    "/upload",
    response_model=ResumeResponse,
)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    # -------------------------
    # Validate File
    # -------------------------
    allowed_extensions = (".pdf", ".docx")

    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed.",
        )

    # -------------------------
    # Save File
    # -------------------------
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    filename = f"{timestamp}_{file.filename}"

    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    # -------------------------
    # Extract Resume Text
    # -------------------------
    extracted_text = extract_resume_text(file_path)

    # -------------------------
    # Calculate ATS Score
    # -------------------------
    ats_result = calculate_ats_score(extracted_text)

    # -------------------------
    # Save to Database
    # -------------------------
    resume = Resume(
        user_id=1,          # JWT integration later
        file_name=file.filename,
        file_path=file_path,
        extracted_text=extracted_text,
        ats_score=ats_result["ats_score"],
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    # -------------------------
    # Return Response
    # -------------------------
    return {
        "id": resume.id,
        "file_name": resume.file_name,
        "file_path": resume.file_path,
        "extracted_text": resume.extracted_text,
        "ats_score": resume.ats_score,
        "uploaded_at": resume.uploaded_at,
    }