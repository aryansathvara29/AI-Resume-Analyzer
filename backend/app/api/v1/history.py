from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.resume import Resume
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/history",
    tags=["History"],
)


@router.get("/resumes")
def get_resume_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
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