import os
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeResponse
from app.utils.resume_parser import extract_resume_text, validate_resume_document
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
    # Enforce Single Resume Limit Per Profile
    # -------------------------
    existing_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if existing_resume:
        raise HTTPException(
            status_code=400,
            detail="You can only upload 1 resume per profile. If you want to upload a new resume, please delete your existing resume first.",
        )

    # -------------------------
    # Validate File for Mobile & Desktop
    # -------------------------
    original_filename = file.filename or "resume.pdf"
    clean_filename = original_filename.split("?")[0].strip()
    ext = os.path.splitext(clean_filename)[1].lower()

    content_type = (file.content_type or "").lower()
    is_pdf = "pdf" in content_type or ext == ".pdf"
    is_docx = (
        "word" in content_type
        or "officedocument" in content_type
        or "msword" in content_type
        or ext in [".docx", ".doc"]
    )

    if not (is_pdf or is_docx):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed.",
        )

    # Ensure filename has extension for mobile uploads
    if not clean_filename.lower().endswith((".pdf", ".docx", ".doc")):
        clean_filename += ".pdf" if is_pdf else ".docx"

    # -------------------------
    # Save File
    # -------------------------
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = clean_filename.replace(" ", "_")
    filename = f"{timestamp}_{safe_name}"

    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    # -------------------------
    # Extract Resume Text
    # -------------------------
    extracted_text = extract_resume_text(file_path)

    # -------------------------
    # Validate Document is standard Resume/CV
    # -------------------------
    is_valid_resume, error_reason = validate_resume_document(extracted_text, clean_filename)
    if not is_valid_resume:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        raise HTTPException(
            status_code=400,
            detail=error_reason,
        )

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
    from app.models.skill_verification import SkillVerification
    from app.services.ats_service import detect_skills

    results = db.query(Resume, User).join(User, Resume.user_id == User.id).order_by(Resume.uploaded_at.desc()).all()
    
    # Pre-fetch all verified skill records to avoid N+1 queries
    verifications = db.query(SkillVerification).filter(
        SkillVerification.status.in_(["verified_certificate", "verified_ai_test"])
    ).all()
    
    verifications_by_resume = {}
    verifications_by_user = {}
    for v in verifications:
        v_data = {
            "id": v.id,
            "skill_name": v.skill_name,
            "status": v.status,
            "score": v.score
        }
        if v.resume_id:
            verifications_by_resume.setdefault(v.resume_id, []).append(v_data)
        verifications_by_user.setdefault(v.user_id, []).append(v_data)

    data = []
    for resume, user in results:
        detected = detect_skills(resume.extracted_text or "")
        
        # Pick resume-scoped verifications if present, otherwise user-level
        verified = verifications_by_resume.get(resume.id)
        if verified is None:
            verified = verifications_by_user.get(user.id, [])

        data.append({
            "id": resume.id,
            "user_id": resume.user_id,
            "candidate_name": user.full_name,
            "candidate_email": user.email,
            "candidate_phone": user.phone or "",
            "candidate_city": user.city or "",
            "candidate_state": user.state or "",
            "candidate_college": user.college or "",
            "candidate_degree": user.degree or "",
            "candidate_branch": user.branch or "",
            "candidate_experience": user.experience_years or "Fresher",
            "candidate_role": user.preferred_role or user.current_role or "",
            "candidate_about": user.about_me or "",
            "github_url": user.github_url or "",
            "linkedin_url": user.linkedin_url or "",
            "portfolio_url": user.portfolio_url or "",
            "file_name": resume.file_name,
            "file_path": resume.file_path,
            "ats_score": resume.ats_score or 0,
            "uploaded_at": resume.uploaded_at,
            "extracted_text": resume.extracted_text or "",
            "detected_skills": detected,
            "verified_skills": verified,
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


@router.delete(
    "/{resume_id}",
)
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    # Restrict deletion to owner or recruiter/admin
    if resume.user_id != current_user.id and current_user.role not in ["admin", "recruiter"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    # Remove physical file if it exists
    if resume.file_path and os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception as e:
            print(f"Error removing physical resume file: {e}")

    db.delete(resume)
    db.commit()

    return {"message": "Resume deleted successfully", "id": resume_id}