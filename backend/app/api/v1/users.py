import os
import re
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
    clean_name = body.full_name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=400,
            detail="Full name cannot be empty.",
        )
    if any(char.isdigit() for char in clean_name):
        raise HTTPException(
            status_code=400,
            detail="Name cannot contain numbers. Only letters are allowed.",
        )
    if not re.match(r"^[a-zA-Z\s]+$", clean_name):
        raise HTTPException(
            status_code=400,
            detail="Name can only contain letters and spaces.",
        )

    email = body.email.strip().lower()

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered. Please login instead.",
        )

    role_value = body.role if body.role in ["user", "recruiter", "admin"] else "user"

    if len(body.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long.",
        )
    if not body.password[0].isupper():
        raise HTTPException(
            status_code=400,
            detail="First character of password must be capital (A-Z).",
        )
    if not any(char.isdigit() for char in body.password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number (0-9).",
        )

    new_user = User(
        full_name=clean_name,
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

    if body.role:
        selected_role = body.role.strip().lower()
        user_role = (user.role or "user").strip().lower()
        if selected_role in ["user", "recruiter"] and user_role != "admin":
            if selected_role == "user" and user_role == "recruiter":
                raise HTTPException(
                    status_code=400,
                    detail="This account is registered as a Recruiter. Please select the Recruiter tab to sign in.",
                )
            elif selected_role == "recruiter" and user_role == "user":
                raise HTTPException(
                    status_code=400,
                    detail="This account is registered as a Job Seeker. Please select the Job Seeker tab to sign in.",
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
    if "full_name" in update_data and update_data["full_name"] is not None:
        clean_name = update_data["full_name"].strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Full name cannot be empty.")
        if any(char.isdigit() for char in clean_name):
            raise HTTPException(status_code=400, detail="Name cannot contain numbers. Only letters are allowed.")
        if not re.match(r"^[a-zA-Z\s]+$", clean_name):
            raise HTTPException(status_code=400, detail="Name can only contain letters and spaces.")
        update_data["full_name"] = clean_name

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
    
    if len(body.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 6 characters long.",
        )
    if not body.new_password[0].isupper():
        raise HTTPException(
            status_code=400,
            detail="First character of new password must be capital (A-Z).",
        )
    if not any(char.isdigit() for char in body.new_password):
        raise HTTPException(
            status_code=400,
            detail="New password must contain at least one number (0-9).",
        )

    current_user.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password updated successfully!"}


@router.delete(
    "/me",
)
def delete_current_user_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.skill_verification import SkillVerification
    from app.models.user import OTPRecord

    # Delete skill verifications associated with the user
    db.query(SkillVerification).filter(SkillVerification.user_id == current_user.id).delete()

    # Delete resumes and remove physical files
    user_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    for resume in user_resumes:
        if resume.file_path and os.path.exists(resume.file_path):
            try:
                os.remove(resume.file_path)
            except Exception:
                pass
        db.delete(resume)

    # Delete OTP records associated with user's email
    db.query(OTPRecord).filter(OTPRecord.email == current_user.email).delete()

    # Delete the user record
    db.delete(current_user)
    db.commit()

    return {"message": "Account and all associated data deleted successfully."}


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