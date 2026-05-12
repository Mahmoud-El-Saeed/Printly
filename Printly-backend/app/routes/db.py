from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core import get_settings

settings = get_settings()
engine = create_engine(settings.DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
