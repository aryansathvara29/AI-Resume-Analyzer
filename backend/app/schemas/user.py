import re
from pydantic import BaseModel, EmailStr, field_validator

GMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@gmail\.com$", re.IGNORECASE)


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "user"

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


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str

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

    @field_validator("email")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        email_str = v.strip().lower()
        if not GMAIL_REGEX.match(email_str):
            raise ValueError("Only valid @gmail.com email addresses are allowed.")
        return email_str
