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


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


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
