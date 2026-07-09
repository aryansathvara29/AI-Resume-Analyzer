from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.resume import Resume
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).count()

    average_ats = (
        db.query(func.avg(Resume.ats_score))
        .filter(Resume.user_id == current_user.id)
        .scalar()
    )

    highest_ats = (
        db.query(func.max(Resume.ats_score))
        .filter(Resume.user_id == current_user.id)
        .scalar()
    )

    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .first()
    )

    return {
        "total_resumes": total_resumes,
        "average_ats_score": round(average_ats or 0, 2),
        "highest_ats_score": highest_ats or 0,
        "latest_resume": {
            "id": latest_resume.id,
            "file_name": latest_resume.file_name,
            "ats_score": latest_resume.ats_score,
            "uploaded_at": latest_resume.uploaded_at,
        } if latest_resume else None,
    }