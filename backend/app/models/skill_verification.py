from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from app.database.session import Base

class SkillVerification(Base):
    __tablename__ = "skill_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="not_verified") # verified_certificate, verified_ai_test, learning_recommended, not_verified
    score = Column(Integer, nullable=True) # e.g. 8 for 8/10
    certificate_file_name = Column(String(255), nullable=True)
    certificate_file_path = Column(String(500), nullable=True)
    learning_resources = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
