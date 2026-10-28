import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=f"{BASE_DIR}/.env")
    PROJECT_NAME: str = "C.O.M.P.L.I.S.C.A.N."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Gemini API Key (Default provided by user, can be overridden via ENV)
    GEMINI_API_KEY: str = os.getenv(
        "GEMINI_API_KEY", 
        "AQ.Ab8RN6LKIYapKpDDcFouJYcl_-iXuzjFMHdkR6uoQe417JJPug"
    )
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR}/storage/compliscan.db"
    )
    
    # Supabase credentials (Cloud database & sync)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://ppqywvzogwuhdnrujrof.supabase.co")
    SUPABASE_KEY: str = os.getenv(
        "SUPABASE_KEY", 
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcXl3dnpvZ3d1aGRucnVqcm9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDEzNTc3NSwiZXhwIjoyMDk1NzExNzc1fQ.1wQ4bWERyaAbcSo4G5gIsd6OpIsvqg3l6hqWm9lUVog"
    )
    SUPABASE_ANON_KEY: str = os.getenv(
        "SUPABASE_ANON_KEY",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcXl3dnpvZ3d1aGRucnVqcm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzU3NzUsImV4cCI6MjA5NTcxMTc3NX0.vMNTbmykiGlTSb2481BIYAZaxS1FZBSiR5yhrfYJd0E"
    )
    SUPABASE_PROJECT_ID: str = os.getenv("SUPABASE_PROJECT_ID", "ppqywvzogwuhdnrujrof")
    
    # Storage directories
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "storage" / "processed"
    REPORT_DIR: Path = BASE_DIR / "storage" / "reports"
    SAMPLES_DIR: Path = BASE_DIR / "storage" / "samples"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "https://prototype-complisca.vercel.app",
        "https://prototype-compliscan.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    

settings = Settings()

# Indian Standard Time (IST - UTC+05:30) statutory timezone helpers
import datetime
IST_TIMEZONE = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

def get_ist_now() -> datetime.datetime:
    """Returns current datetime in Indian Standard Time (UTC+05:30)."""
    return datetime.datetime.now(IST_TIMEZONE)

def to_ist(dt) -> datetime.datetime:
    """Converts a naive or aware datetime/ISO-string to IST datetime."""
    if dt is None:
        return get_ist_now()
    if isinstance(dt, str):
        try:
            parsed = datetime.datetime.fromisoformat(dt.replace("Z", "+00:00"))
            return to_ist(parsed)
        except Exception:
            return get_ist_now()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt.astimezone(IST_TIMEZONE)

def to_ist_iso(dt) -> str | None:
    """Returns ISO 8601 formatted string with +05:30 IST timezone."""
    if dt is None:
        return None
    return to_ist(dt).isoformat()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORT_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
