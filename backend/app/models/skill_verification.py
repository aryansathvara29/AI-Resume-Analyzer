from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Float
from app.database.session import Base

class SkillVerification(Base):
    __tablename__ = "skill_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=True, index=True)
    skill_name = Column(String(100), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="not_verified") # verified_certificate, verified_ai_test, certificate_rejected, learning_recommended, not_verified, verifying
    score = Column(Integer, nullable=True) # e.g. 5 for 5/5
    certificate_file_name = Column(String(255), nullable=True)
    certificate_file_path = Column(String(500), nullable=True)
    certificate_title = Column(String(255), nullable=True)
    issuer = Column(String(255), nullable=True)
    detected_skill = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)
    verification_reason = Column(Text, nullable=True)
    learning_resources = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
