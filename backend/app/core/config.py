import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "CompliScan"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Gemini API Key (Default provided by user, can be overridden via ENV)
    GEMINI_API_KEY: str = os.getenv(
        "GEMINI_API_KEY", 
        "AQ.Ab8RN6LKIYapKpDDcFouJYcl_-iXuzjFMHdkR6uoQe417JJPug"
    )
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    
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
    
    class Config:
        case_sensitive = True
        env_file = f"{BASE_DIR}/.env"

settings = Settings()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORT_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
