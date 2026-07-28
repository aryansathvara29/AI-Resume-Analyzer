import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import (
    get_current_user,
    require_role,
)
from app.models.user import User
from app.models.resume import Resume
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    UserProfileUpdate,
    PasswordChangeRequest,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.post("/register", response_model=Token)
def register_user(
    body: UserCreate,
    db: Session = Depends(get_db),
):
    email = body.email.strip().lower()

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered. Please login instead.",
        )

    role_value = body.role if body.role in ["user", "recruiter", "admin"] else "user"

    new_user = User(
        full_name=body.full_name,
        email=email,
        hashed_password=hash_password(body.password),
        role=role_value,
        auth_provider="email",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={
            "sub": new_user.email,
            "role": new_user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/login", response_model=Token)
def login_user(
    body: UserLogin,
    db: Session = Depends(get_db),
):
    email = body.email.strip().lower()

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password.",
        )

    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_logged_in_user(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
)
def update_logged_in_user(
    body: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = body.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put(
    "/change-password",
)
def change_password(
    body: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.hashed_password or not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect.",
        )
    
    current_user.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password updated successfully!"}


@router.get(
    "/me/resume-stats",
)
def get_user_resume_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).all()
    
    total_uploads = len(resumes)
    latest_resume = resumes[0] if resumes else None
    
    latest_ats_score = latest_resume.ats_score if latest_resume else 0
    latest_ai_score = (latest_ats_score + 5) if latest_resume else 0
    if latest_ai_score > 100:
        latest_ai_score = 100

    return {
        "current_resume_name": latest_resume.file_name if latest_resume else "No resume uploaded yet",
        "resume_upload_date": latest_resume.uploaded_at.strftime("%d/%m/%Y") if latest_resume and latest_resume.uploaded_at else "N/A",
        "latest_ats_score": latest_ats_score,
        "latest_ai_score": latest_ai_score,
        "total_resume_uploads": total_uploads,
    }


@router.get(
    "/all",
    response_model=list[UserResponse],
)
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["admin"])
    ),
):
    users = db.query(User).all()
    return users