from pydantic import BaseModel
from datetime import datetime


class ResumeResponse(BaseModel):
    id: int
    file_name: str
    file_path: str
    extracted_text: str | None = None
    ats_score: int | None = None
    uploaded_at: datetime

    class Config:
        from_attributes = True