from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.resume import Resume

router = APIRouter(
    prefix="/history",
    tags=["History"],
)


@router.get("/resumes")
def get_resume_history(
    db: Session = Depends(get_db),
):
    resumes = (
        db.query(Resume)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )

    data = []

    for resume in resumes:
        data.append({
            "id": resume.id,
            "file_name": resume.file_name,
            "ats_score": resume.ats_score,
            "uploaded_at": resume.uploaded_at,
        })

    return {
        "total_resumes": len(data),
        "history": data,
    }