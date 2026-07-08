from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# -------------------
# DATABASE ENGINE
# -------------------
engine = create_engine(DATABASE_URL, echo=True)

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