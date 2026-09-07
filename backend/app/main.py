import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.api.v1 import scan, inspections, reports, rules, analytics
from backend.app.api.v1.rules import seed_default_rules

# Create Database tables
Base.metadata.create_all(bind=engine)

# Seed default rules
with SessionLocal() as db:
    seed_default_rules(db)

app = FastAPI(
    title="CompliScan — Legal Metrology Compliance Engine",
    description="Automated scanning and compliance verification system for Legal Metrology (Packaged Commodities) Rules, 2011.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file storage for images and reports
app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")

# Include API v1 Routers
app.include_router(scan.router, prefix=settings.API_V1_STR)
app.include_router(inspections.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(rules.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.api_route("/", methods=["GET", "HEAD", "POST"])
def root():
    return {
        "system": "CompliScan Legal Metrology Compliance Engine",
        "version": settings.VERSION,
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
