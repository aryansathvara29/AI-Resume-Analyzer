from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# -------------------
# DATABASE ENGINE WITH FALLBACK TO SQLITE
# -------------------
# -------------------
# DATABASE ENGINE CONFIGURATION
# -------------------
is_sqlite = False

if not DATABASE_URL:
    is_sqlite = True
elif DATABASE_URL.startswith("sqlite"):
    is_sqlite = True

if is_sqlite:
    # Resolve absolute path to backend directory to prevent multiple DB files in different folders
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    db_path = os.path.join(backend_dir, "resume_analyzer.db")
    DATABASE_URL = f"sqlite:///{db_path}"
    print(f"[INFO] Using SQLite database at: {db_path}")
    connect_args = {"check_same_thread": False}
    try:
        engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=True)
        with engine.connect() as conn:
            pass
    except Exception as e:
        print(f"[ERROR] Failed to initialize SQLite database: {e}")
        raise e
else:
    # Safely print database endpoint by stripping password if present
    db_info = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL
    print(f"[INFO] Connecting to database: {db_info}")
    connect_args = {}
    try:
        engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=True)
        # Test connection
        with engine.connect() as conn:
            pass
        print("[SUCCESS] Connected to database successfully.")
    except Exception as e:
        print("\n" + "="*80)
        print(f"[ERROR] DATABASE CONNECTION FAILED: Could not connect to {db_info}")
        print("Please verify the following:")
        print("  1. Your PostgreSQL server is running.")
        print("  2. The database 'ai_resume_analyzer' has been created.")
        print("  3. The username and password in backend/.env are correct.")
        print("  4. If you want to use SQLite instead, comment out DATABASE_URL in backend/.env.")
        print("="*80 + "\n")
        raise e

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