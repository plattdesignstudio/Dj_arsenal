from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use SQLite by default for easier setup (no PostgreSQL required)
# Can override with DATABASE_URL env var for PostgreSQL
# For now, force SQLite to avoid PostgreSQL dependency
env_db_url = os.getenv("DATABASE_URL")
if env_db_url and env_db_url.startswith("postgresql"):
    print("Note: PostgreSQL URL found in .env, but using SQLite for easier setup.")
    print("To use PostgreSQL, ensure it's running and remove this override.")
DATABASE_URL = "sqlite:///./dj_arsenal.db"

# SQLite requires check_same_thread=False for async operations
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


