from app.database.session import engine, Base

# Import ALL models before create_all()
from app.models.user import User
from app.models.resume import Resume

print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("✅ All database tables created successfully!")