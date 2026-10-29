import logging
import base64
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.aicte import (
    Institution,
    Application,
    StageEvent,
    EvcVisit,
    Undertaking,
    Document,
    Notification,
)
from backend.app.services.gemini_service import GeminiService
from backend.app.services.compliance_engine import AICTEWorkflowRuleEngine

logger = logging.getLogger("compliscan.aicte")

router = APIRouter(prefix="/aicte", tags=["AICTE Approval Workflow (PS 26262)"])
rule_engine = AICTEWorkflowRuleEngine()

@router.post("/scan-document", summary="AI Multimodal Vision Extraction for Statutory Legal Documents")
async def scan_aicte_document(
    file: Optional[UploadFile] = File(None),
    doc_hint: Optional[str] = Form(""),
    sample_id: Optional[str] = Form(None)
):
    """
    Scans a Land Lease Deed, Building Safety Certificate, Fire Safety NOC, or Trust Deed
    using Google Gemini Multimodal Vision + OCR.
    Extracts registration number, issuing authority, issued date, expiry date, validity period,
    authenticity score, and statutory clauses.
    """
    try:
        if sample_id:
            # demo certificates
            sample_catalog = {
                "sample_lease_deed": {
                    "doc_type": "Land Lease Deed (30-Year Registered)",
                    "issuing_authority": "Sub-Registrar Office, Haveli Taluka, District Pune",
                    "registration_no": "MH-PUN-HAV-2008-88192-REG",
                    "issued_on": "2008-04-12",
                    "expiry_date": "2038-04-11",
                    "validity_years": 30,
                    "lessor_party": "Maharashtra Industrial Development Corporation (MIDC)",
                    "lessee_party": "Sunrise Educational & Charitable Trust, Pune",
                    "legibility_score": 98,
                    "tampering_risk": "LOW",
                    "key_clauses": [
                        "Irrevocable 30-year statutory lease period valid up to 11 April 2038",
                        "Continuous unencumbered possession granted for Technical Education campus",
                        "Total demarcated land parcel area: 7.50 Acres (exceeds AICTE Western Region norm of 5.0 Acres)",
                        "Government revenue e-Challan registration verified (GRN-MH-992104)"
                    ],
                    "ai_summary": "Official 30-year registered lease deed authenticated via Gemini Vision. Unencumbered land area (7.5 acres) fully satisfies AICTE Approval Process Handbook norms for Western Region."
                },
                "sample_building_safety": {
                    "doc_type": "Building Safety & Structural Stability Certificate",
                    "issuing_authority": "Executive Engineer, Division III, Public Works Department (PWD), Delhi",
                    "registration_no": "PWD-DEL-STR-2023-4109",
                    "issued_on": "2023-09-30",
                    "expiry_date": "2026-09-30",
                    "validity_years": 3,
                    "lessor_party": "Executive Engineer, PWD Division III",
                    "lessee_party": "Delhi Institute of Polytechnic & Technology",
                    "legibility_score": 93,
                    "tampering_risk": "LOW",
                    "key_clauses": [
                        "Structural stability assessed in compliance with National Building Code (NBC-2016)",
                        "Seismic Zone IV earthquake resistance load-bearing capacity certified",
                        "Mandatory structural renewal due on 30 Sept 2026"
                    ],
                    "ai_summary": "PWD Structural stability certificate inspected. Visual stamps match PWD Division III seal; document expired on 30 Sept 2026 requiring fresh triennial renewal."
                },
                "sample_fire_noc": {
                    "doc_type": "Fire & Life Safety Clearance Certificate (NOC)",
                    "issuing_authority": "West Bengal Fire & Emergency Services Directorate",
                    "registration_no": "WB-FES-NOC-2025-1194",
                    "issued_on": "2025-11-18",
                    "expiry_date": "2026-11-17",
                    "validity_years": 1,
                    "lessor_party": "Divisional Fire Officer, Kolkata South Division",
                    "lessee_party": "Bengal College of Pharmacy & Allied Sciences",
                    "legibility_score": 95,
                    "tampering_risk": "LOW",
                    "key_clauses": [
                        "Automated wet-riser hydrant and down-comer fire fighting systems functional",
                        "Emergency fire escape stairways (width 2.0m) clear of encroachments",
                        "Annual renewal required before 17 Nov 2026 (T-20 days advance alert active)"
                    ],
                    "ai_summary": "Fire NOC verified authentic with active QR code and divisional seal. Certificate enters mandatory 30-day renewal window on 18 Oct 2026."
                }
            }
            if sample_id in sample_catalog:
                return sample_catalog[sample_id]

        if not file:
            raise HTTPException(status_code=400, detail="Either a file upload or a sample_id must be provided.")

        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        mime_type = file.content_type or "image/jpeg"
        result = GeminiService.extract_aicte_document(
            image_bytes=contents,
            mime_type=mime_type,
            doc_hint=doc_hint or file.filename or ""
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("AICTE document scan failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Gemini Document Vision failed: {str(e)}")

@router.post("/scan-evidence", summary="AI Vision Verification for Compliance Undertaking Evidence")
async def scan_undertaking_evidence(
    file: Optional[UploadFile] = File(None),
    condition_text: Optional[str] = Form(""),
    sample_id: Optional[str] = Form(None)
):
    """
    Inspects geo-tagged photos, equipment invoices, or pollution clearance certificates
    to verify compliance with time-bound undertakings imposed during conditional approval.
    """
    try:
        if sample_id:
            sample_evidence = {
                "sample_cad_lab": {
                    "evidence_type": "GEO_TAGGED_LAB_PHOTO_AND_GST_INVOICE",
                    "geo_tagged": True,
                    "verified_count_or_spec": "40 Licensed BIM/CAD HP Workstations + 1 Server R750 verified",
                    "authenticity_score": 97,
                    "recommendation": "VERIFY_COMPLIANT",
                    "ai_observations": "Geo-coordinates (Lat 30.7046° N, Long 76.7179° E) authenticate on-campus CAD laboratory in Mohali. GST tax invoice (INV-HP-99120) matches OEM hardware serials."
                },
                "sample_stp_plant": {
                    "evidence_type": "POLLUTION_CONTROL_BOARD_CLEARANCE_AND_PHOTO",
                    "geo_tagged": True,
                    "verified_count_or_spec": "50 KLD Sewage Treatment Plant with Consent to Operate (CTO)",
                    "authenticity_score": 96,
                    "recommendation": "VERIFY_COMPLIANT",
                    "ai_observations": "MPPCB Consent Order #CTO-5591 verified authentic valid through 2031. Geo-tagged aeration tank photos match campus utilities layout."
                }
            }
            if sample_id in sample_evidence:
                return sample_evidence[sample_id]

        if not file:
            raise HTTPException(status_code=400, detail="Either a file upload or a sample_id must be provided.")

        contents = await file.read()
        mime_type = file.content_type or "image/jpeg"
        result = GeminiService.extract_undertaking_evidence(
            image_bytes=contents,
            mime_type=mime_type,
            condition_text=condition_text or ""
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Undertaking evidence verification failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Gemini Evidence Vision failed: {str(e)}")

@router.post("/case-summary", summary="AI Executive Case Brief (Module A Requirement)")
async def get_case_summary(app_data: Dict[str, Any]):
    """
    Generates a high-authority 5-bullet AI Executive Case Brief for the
    Standing Appellate Committee (SAC) and Regional Officer reviewing an application.
    Fulfills official PS 26262 Module A:
    'Automate routine administrative activities, standardised communications and electronic case summaries.'
    """
    try:
        result = GeminiService.generate_aicte_case_summary(app_data)
        return result
    except Exception as e:
        logger.exception("AI case summary generation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Case brief generation failed: {str(e)}")


@router.get("/institutions", summary="List All Approved & Monitored Institutions")
def list_institutions(db: Session = Depends(get_db)):
    """Returns all institutions from SQLite database."""
    return db.query(Institution).all()


@router.get("/applications", summary="List Applications with Optional Institution Isolation")
def list_applications(institution_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns applications, optionally filtered by institution for college dashboard isolation."""
    q = db.query(Application)
    if institution_id:
        q = q.filter(Application.institution_id == institution_id)
    return q.all()


@router.get("/undertakings", summary="List Time-Bound Undertakings")
def list_undertakings(db: Session = Depends(get_db)):
    """Returns all conditional approval undertakings with escalation levels."""
    return db.query(Undertaking).all()


@router.get("/documents", summary="List Statutory Documents in Repository")
def list_documents(institution_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns statutory documents (Lease Deeds, Fire NOCs, PWD Stability)."""
    q = db.query(Document)
    if institution_id:
        q = q.filter(Document.institution_id == institution_id)
    return q.all()


@router.get("/notifications", summary="List Real-Time Regulatory Alerts")
def list_notifications(db: Session = Depends(get_db)):
    """Returns real-time SLA breach and escalation notifications."""
    return db.query(Notification).order_by(Notification.created_at.desc()).all()

