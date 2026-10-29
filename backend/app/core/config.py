import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
import datetime

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# settings
class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=f"{BASE_DIR}/.env")
    PROJECT_NAME: str = "C.O.M.P.L.I.S.C.A.N."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR}/storage/compliscan.db"
    )
    
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_PROJECT_ID: str = os.getenv("SUPABASE_PROJECT_ID", "")
    
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "storage" / "processed"
    REPORT_DIR: Path = BASE_DIR / "storage" / "reports"
    SAMPLES_DIR: Path = BASE_DIR / "storage" / "samples"
    
    CORS_ORIGINS: list[str] = [
        "https://prototype-complisca.vercel.app",
        "https://prototype-compliscan.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()

# timezone
IST_TIMEZONE = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

def get_ist_now() -> datetime.datetime:
    return datetime.datetime.now(IST_TIMEZONE)

def to_ist(dt) -> datetime.datetime:
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
    if dt is None:
        return None
    return to_ist(dt).isoformat()

settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORT_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
