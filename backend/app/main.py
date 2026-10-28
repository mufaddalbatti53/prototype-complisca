import os
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.api.v1 import scan, inspections, reports, rules, analytics, parties
from backend.app.api.v1.rules import seed_default_rules
from backend.app.api.v1.parties import seed_default_parties

logger = logging.getLogger("compliscan")

# Ensure required storage directories exist immediately on server startup
for directory in [
    settings.STORAGE_DIR,
    settings.UPLOAD_DIR,
    settings.PROCESSED_DIR,
    settings.REPORT_DIR,
    settings.SAMPLES_DIR,
]:
    directory.mkdir(parents=True, exist_ok=True)

# Create Database tables
Base.metadata.create_all(bind=engine)

# Auto-migrate SQLite schema if new columns are missing in existing tables
def auto_migrate_schema():
    needed_cols = [
        ("party_id", "VARCHAR(50)"),
        ("notice_due_date", "DATETIME"),
        ("notice_status", "VARCHAR(50) DEFAULT 'SHOW_CAUSE_ISSUED'"),
        ("party_reply", "TEXT"),
        ("party_reply_date", "DATETIME"),
    ]
    # 1. Direct SQLite connection migration
    try:
        db_path = settings.STORAGE_DIR / "compliscan.db"
        if db_path.exists():
            import sqlite3
            conn = sqlite3.connect(str(db_path))
            cur = conn.cursor()
            cur.execute("PRAGMA table_info(inspections)")
            existing_cols = {row[1] for row in cur.fetchall()}
            for col_name, col_type in needed_cols:
                if col_name not in existing_cols:
                    cur.execute(f"ALTER TABLE inspections ADD COLUMN {col_name} {col_type}")
                    logger.info(f"Direct SQLite migration: added column {col_name} to inspections")
            conn.commit()
            conn.close()
    except Exception as e:
        logger.warning(f"Direct SQLite migration notice: {e}")

    # 2. SQLAlchemy engine.begin() migration
    try:
        with engine.begin() as conn:
            result = conn.exec_driver_sql("PRAGMA table_info(inspections)")
            existing_cols = {row[1] for row in result.fetchall()}
            for col_name, col_type in needed_cols:
                if col_name not in existing_cols:
                    conn.exec_driver_sql(f"ALTER TABLE inspections ADD COLUMN {col_name} {col_type}")
                    logger.info(f"Engine migration: added column {col_name} to inspections")
    except Exception as e:
        logger.warning(f"Engine migration notice: {e}")

auto_migrate_schema()

# Seed default rules and parties
with SessionLocal() as db:
    seed_default_rules(db)
    seed_default_parties(db)

app = FastAPI(
    title="CompliScan — Legal Metrology Compliance Engine",
    description="Automated scanning and compliance verification system for Legal Metrology (Packaged Commodities) Rules, 2011.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware with dynamic origin regex matching for all Vercel and local environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global CORS-enforced Exception Handlers:
# Guarantees that any 4xx or 500 error response returns full Access-Control headers,
# preventing browsers from masking internal server errors as CORS failures.
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    origin = request.headers.get("origin") or "*"
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception on %s %s: %s", request.method, request.url, exc)
    origin = request.headers.get("origin") or "*"
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Mount static file storage for images and reports
app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")

# Include API v1 Routers
app.include_router(scan.router, prefix=settings.API_V1_STR)
app.include_router(inspections.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(rules.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(parties.router, prefix=settings.API_V1_STR)

@app.api_route("/", methods=["GET", "HEAD", "POST"])
def root():
    return {
        "system": "CompliScan Legal Metrology Compliance Engine",
        "version": settings.VERSION,
        "build": "2026.10.28.01",
        "status": "OPERATIONAL",
        "jurisdiction": "Legal Metrology Act, 2009 & LMPC Rules, 2011 (India)",
        "docs": "/docs"
    }

@app.api_route("/api/health", methods=["GET", "HEAD", "POST"])
def health_check():
    return {
        "status": "healthy",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "database": "connected"
    }
