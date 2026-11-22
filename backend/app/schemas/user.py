import re
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

GMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@gmail\.com$", re.IGNORECASE)
NAME_REGEX = re.compile(r"^[a-zA-Z\s]+$")


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "user"

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        name_str = v.strip()
        if not name_str:
            raise ValueError("Full name cannot be empty.")
        if any(char.isdigit() for char in name_str):
            raise ValueError("Name cannot contain numbers. Only letters are allowed.")
        if not NAME_REGEX.match(name_str):
            raise ValueError("Name can only contain letters and spaces.")
        return name_str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        if not v[0].isupper():
            raise ValueError("First character of password must be capital (A-Z).")
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain at least one number (0-9).")
        return v

    @field_validator("email")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        email_str = v.strip().lower()
        if not GMAIL_REGEX.match(email_str):
            raise ValueError("Only valid @gmail.com email addresses are allowed.")
        return email_str


from typing import Optional


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    current_semester: Optional[str] = None
    graduation_year: Optional[str] = None
    cgpa: Optional[str] = None
    current_role: Optional[str] = None
    about_me: Optional[str] = None
    experience_years: Optional[str] = None
    preferred_role: Optional[str] = None
    preferred_work_mode: Optional[str] = None
    skills_tech: Optional[str] = None
    skills_programming: Optional[str] = None
    skills_frameworks: Optional[str] = None
    skills_databases: Optional[str] = None
    skills_tools: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    hackerrank_url: Optional[str] = None

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    current_semester: Optional[str] = None
    graduation_year: Optional[str] = None
    cgpa: Optional[str] = None
    current_role: Optional[str] = None
    about_me: Optional[str] = None
    experience_years: Optional[str] = None
    preferred_role: Optional[str] = None
    preferred_work_mode: Optional[str] = None
    skills_tech: Optional[str] = None
    skills_programming: Optional[str] = None
    skills_frameworks: Optional[str] = None
    skills_databases: Optional[str] = None
    skills_tools: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    hackerrank_url: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        name_str = v.strip()
        if not name_str:
            raise ValueError("Full name cannot be empty.")
        if any(char.isdigit() for char in name_str):
            raise ValueError("Name cannot contain numbers. Only letters are allowed.")
        if not NAME_REGEX.match(name_str):
            raise ValueError("Name can only contain letters and spaces.")
        return name_str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("New password must be at least 6 characters long.")
        if not v[0].isupper():
            raise ValueError("First character of new password must be capital (A-Z).")
        if not any(char.isdigit() for char in v):
            raise ValueError("New password must contain at least one number (0-9).")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        email_str = v.strip().lower()
        if not GMAIL_REGEX.match(email_str):
            raise ValueError("Only valid @gmail.com email addresses are allowed.")
        return email_str


class Token(BaseModel):
    access_token: str
    token_type: str


class SendOTPRequest(BaseModel):
    email: EmailStr
    mode: str = "register"

    @field_validator("email")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        email_str = v.strip().lower()
        if not GMAIL_REGEX.match(email_str):
            raise ValueError("Only valid @gmail.com email addresses are allowed.")
        return email_str



class VerifyOTPRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = "OTP_USER"
    role: str = "user"
    otp_code: str

    @field_validator("email")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        email_str = v.strip().lower()
        if not GMAIL_REGEX.match(email_str):
            raise ValueError("Only valid @gmail.com email addresses are allowed.")
        return email_str


class VerifyOTPLoginRequest(BaseModel):
    email: EmailStr
    otp_code: str
    role: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        email_str = v.strip().lower()
        if not GMAIL_REGEX.match(email_str):
            raise ValueError("Only valid @gmail.com email addresses are allowed.")
        return email_str

