from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import (
    get_current_user,
    require_role,
)
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
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


@router.post(
    "/register",
    response_model=UserResponse,
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    role_value = user.role if user.role in ["student", "recruiter", "admin"] else "student"

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role=role_value,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=Token,
)
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        user.password,
        db_user.hashed_password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "role": db_user.role,
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