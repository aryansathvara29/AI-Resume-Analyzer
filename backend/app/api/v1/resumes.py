import os
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeResponse
from app.utils.resume_parser import extract_resume_text
from app.services.ats_service import calculate_ats_score
from app.dependencies.auth import get_current_user, require_role

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
    current_user: User = Depends(get_current_user),
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
        user_id=current_user.id,
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


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
)
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Resume).filter(Resume.id == resume_id)
    if current_user.role not in ["admin", "recruiter"]:
        query = query.filter(Resume.user_id == current_user.id)
        
    resume = query.first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    return resume


@router.get(
    "/admin/all",
)
def get_all_resumes_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "recruiter"])),
):
    results = db.query(Resume, User).join(User, Resume.user_id == User.id).order_by(Resume.uploaded_at.desc()).all()
    
    data = []
    for resume, user in results:
        data.append({
            "id": resume.id,
            "user_id": resume.user_id,
            "candidate_name": user.full_name,
            "candidate_email": user.email,
            "file_name": resume.file_name,
            "file_path": resume.file_path,
            "ats_score": resume.ats_score,
            "uploaded_at": resume.uploaded_at,
            "extracted_text": resume.extracted_text
        })
    return data


@router.get(
    "/{resume_id}/export",
)
def export_resume_report(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi.responses import PlainTextResponse
    
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id)
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    # Restrict export to owner or recruiter/admin
    if resume.user_id != current_user.id and current_user.role not in ["admin", "recruiter"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    # Detect skills & suggestions using local checker (re-calculated or retrieved)
    from app.services.ats_service import calculate_ats_score
    ats_result = calculate_ats_score(resume.extracted_text or "")

    skills_str = ", ".join(ats_result["skills"])
    suggestions_str = "\n".join([f"- {s}" for s in ats_result["suggestions"]])

    report = f"""==================================================
        AI RESUME ANALYZER EVALUATION REPORT
==================================================

[BASIC DETAILS]
File Name: {resume.file_name}
Upload Date: {resume.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}
Owner: {current_user.full_name} ({current_user.email})

--------------------------------------------------
[ATS ANALYSIS METRICS]
Overall ATS Compatibility Score: {resume.ats_score or 0}%

[KEYWORD TAGS FOUND]
{skills_str if skills_str else 'No core keywords identified.'}

--------------------------------------------------
[IMPROVEMENT SUGGESTIONS]
{suggestions_str if suggestions_str else 'No suggestions. Excellent keyword mapping!'}

==================================================
Generated by AI Resume Analyzer
==================================================
"""
    return PlainTextResponse(
        content=report,
        headers={
            "Content-Disposition": f"attachment; filename=Resume_Evaluation_{resume_id}.txt"
        }
    )