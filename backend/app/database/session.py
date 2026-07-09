from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# -------------------
# DATABASE ENGINE WITH FALLBACK TO SQLITE
# -------------------
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./resume_analyzer.db"

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=True)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"⚠️ Database connection failed to {DATABASE_URL}. Error: {e}")
    print("🔄 Falling back to SQLite...")
    DATABASE_URL = "sqlite:///./resume_analyzer.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# -------------------
# BASE (FIX HERE 🔥)
# -------------------
Base = declarative_base()


# -------------------
# DB DEPENDENCY
# -------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()