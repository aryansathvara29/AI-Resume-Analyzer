from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime

from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(String(255), unique=True, index=True, nullable=False)

    hashed_password = Column(String(255), nullable=True)

    role = Column(String(50), default="user")

    auth_provider = Column(String(50), default="email")


class OTPRecord(Base):
    __tablename__ = "otp_records"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String(255), index=True, nullable=False)

    otp_code = Column(String(10), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)