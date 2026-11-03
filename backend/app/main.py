"""CompliScan FastAPI service for SIH 26262 AICTE workflows."""

import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.core.database import Base, SessionLocal, engine
from backend.app import models  # noqa: F401 - register AICTE SQLAlchemy models
from backend.app.api.v1 import aicte, rules
from backend.app.api.v1.rules import seed_default_rules
from backend.app.core.seed_aicte import seed_default_aicte_data

logger = logging.getLogger("compliscan")

for directory in (settings.STORAGE_DIR, settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.REPORT_DIR, settings.SAMPLES_DIR):
    directory.mkdir(parents=True, exist_ok=True)

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    seed_default_rules(db)
    seed_default_aicte_data(db)

app = FastAPI(
    title="C.O.M.P.L.I.S.C.A.N. — AICTE Approval Workflow and Compliance Platform",
    description="SIH 26262 institutional approval workflow automation, compliance monitoring, AI document review, and escalation management.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true"},
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception on %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")
app.include_router(rules.router, prefix=settings.API_V1_STR)
app.include_router(aicte.router, prefix=settings.API_V1_STR)

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "CompliScan SIH 26262 Backend",
        "version": settings.VERSION,
        "database": engine.dialect.name,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "supabase_configured": bool(settings.SUPABASE_URL),
    }

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to CompliScan SIH 26262 API", "docs": "/docs", "version": settings.VERSION}
