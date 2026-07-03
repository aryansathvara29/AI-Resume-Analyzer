from app.database.session import engine
from app.models.user import Base

print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("✅ Users table created successfully!")