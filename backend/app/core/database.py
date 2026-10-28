import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Engine configuration: Normalize postgresql connection strings and support psycopg2 / psycopg
raw_db_url = settings.DATABASE_URL
db_url = raw_db_url

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        echo=False
    )
    # Test connection
    with engine.connect() as conn:
        pass
    logger.info("Database connection established successfully")
except Exception as e:
    logger.warning(f"Primary database connection failed ({e}). Falling back to local persistent SQLite storage.")
    fallback_url = f"sqlite:///{settings.STORAGE_DIR}/compliscan.db"
    engine = create_engine(
        fallback_url,
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
