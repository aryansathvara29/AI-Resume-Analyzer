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

    # Personal Info
    phone = Column(String(50), nullable=True)
    dob = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)

    # Education
    college = Column(String(255), nullable=True)
    degree = Column(String(100), nullable=True)
    branch = Column(String(100), nullable=True)
    current_semester = Column(String(50), nullable=True)
    graduation_year = Column(String(50), nullable=True)
    cgpa = Column(String(50), nullable=True)

    # Professional Info
    current_role = Column(String(100), nullable=True)
    about_me = Column(String(1000), nullable=True)
    experience_years = Column(String(50), nullable=True)
    preferred_role = Column(String(100), nullable=True)
    preferred_work_mode = Column(String(50), nullable=True)

    # Skills
    skills_tech = Column(String(500), nullable=True)
    skills_programming = Column(String(500), nullable=True)
    skills_frameworks = Column(String(500), nullable=True)
    skills_databases = Column(String(500), nullable=True)
    skills_tools = Column(String(500), nullable=True)

    # Social Links
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    leetcode_url = Column(String(255), nullable=True)
    hackerrank_url = Column(String(255), nullable=True)


class OTPRecord(Base):
    __tablename__ = "otp_records"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String(255), index=True, nullable=False)

    otp_code = Column(String(10), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)