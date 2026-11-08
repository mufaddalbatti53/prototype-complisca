import logging
import base64
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.config import settings
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
from backend.app.services import supabase_storage

logger = logging.getLogger("compliscan.aicte")

router = APIRouter(prefix="/aicte", tags=["AICTE Approval Workflow (PS 26262)"])
rule_engine = AICTEWorkflowRuleEngine()
ALLOWED_UPLOAD_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


async def _read_valid_upload(file: UploadFile) -> bytes:
    mime_type = (file.content_type or "").lower()
    if mime_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, WebP, or PDF file.")
    content = await file.read(settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024 + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB} MB upload limit.")
    signatures = {
        "image/jpeg": content.startswith(b"\xff\xd8\xff"),
        "image/png": content.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": content.startswith(b"RIFF") and content[8:12] == b"WEBP",
        "application/pdf": content.startswith(b"%PDF-"),
    }
    if not signatures.get(mime_type, False):
        raise HTTPException(status_code=415, detail="The file contents do not match the declared upload type.")
    return content


def _store_upload(content: bytes, filename: str, mime_type: str) -> str:
    suffix = Path(filename or "upload").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".pdf"}:
        suffix = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf"}[mime_type]
    object_name = f"{uuid.uuid4().hex}{suffix}"
    if supabase_storage.is_configured():
        return supabase_storage.upload_bytes(f"evidence/{object_name}", content, mime_type)
    local_path = settings.UPLOAD_DIR / object_name
    local_path.write_bytes(content)
    return f"/storage/uploads/{object_name}"


def _disclose_assessment(result: Dict[str, Any], *, synthetic: bool = False) -> Dict[str, Any]:
    result.update({
        "assessment_type": "illustrative_ai_assessment",
        "human_review_required": True,
        "confidence_source": "not provided",
        "data_status": "synthetic_demo_data" if synthetic or result.get("data_status") == "synthetic_demo_data" else "unverified_extraction",
        "notice": "AI output is an illustrative extraction or assessment. It does not authenticate a document, establish compliance or legal validity, or constitute an authorized decision.",
    })
    for field in ("authenticity_score", "ai_confidence_score", "confidence_score", "confidence", "tampering_risk"):
        result.pop(field, None)
    return result

@router.post("/scan-document", summary="AI Multimodal Vision Extraction for Statutory Legal Documents")
async def scan_aicte_document(
    file: Optional[UploadFile] = File(None),
    doc_hint: Optional[str] = Form(""),
    sample_id: Optional[str] = Form(None),
    document_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Scans a Land Lease Deed, Building Safety Certificate, Fire Safety NOC, or Trust Deed
    using Google Gemini Multimodal Vision + OCR.
    Extracts apparent text markers and dates for human review. The scan does not authenticate a document.
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
                    "legibility_score": None,
                    "tampering_risk": "not assessed",
                    "key_clauses": [
                        "Irrevocable 30-year statutory lease period valid up to 11 April 2038",
                        "Continuous unencumbered possession granted for Technical Education campus",
                        "Total demarcated land parcel area: 7.50 Acres (exceeds AICTE Western Region norm of 5.0 Acres)",
                        "Sample text contains a government revenue e-Challan reference (GRN-MH-992104); not checked."
                    ],
                    "ai_summary": "Synthetic sample: a 30-year lease and 7.50-acre parcel are mentioned. Source records and applicable requirements require human review."
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
                    "legibility_score": None,
                    "tampering_risk": "not assessed",
                    "key_clauses": [
                        "Sample text refers to the National Building Code (NBC-2016); not validated",
                        "Sample text mentions Seismic Zone IV; not validated",
                        "Sample text shows an expiry date of 30 September 2026; confirm against the source"
                    ],
                    "ai_summary": "Synthetic sample: a 30 September 2026 expiry date is shown. Confirm the date and renewal requirements against source records."
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
                    "legibility_score": None,
                    "tampering_risk": "not assessed",
                    "key_clauses": [
                        "Sample text describes fire suppression systems; not independently inspected",
                        "Sample text describes fire escape routes; not independently inspected",
                        "Sample text lists 17 November 2026; confirm the applicable renewal window manually"
                    ],
                    "ai_summary": "Synthetic sample: a certificate expiry date is shown. Confirm the document, date, and applicable renewal window manually."
                }
            }
            if sample_id in sample_catalog:
                return _disclose_assessment(sample_catalog[sample_id], synthetic=True)

        if not file:
            raise HTTPException(status_code=400, detail="Either a file upload or a sample_id must be provided.")

        contents = await _read_valid_upload(file)
        mime_type = file.content_type or ""
        result = GeminiService.extract_aicte_document(
            image_bytes=contents,
            mime_type=mime_type,
            doc_hint=doc_hint or file.filename or ""
        )
        stored_url = _store_upload(contents, file.filename or "upload", mime_type)
        if document_id:
            document = db.query(Document).filter(Document.id == document_id).first()
            if not document:
                raise HTTPException(status_code=404, detail="Document record was not found.")
            document.file_url = stored_url
            db.commit()
        result["storage_url"] = stored_url
        return _disclose_assessment(result)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("AICTE document scan failed: %s", e)
        raise HTTPException(status_code=502, detail="Document analysis or storage is temporarily unavailable.")

@router.post("/scan-evidence", summary="AI Vision Verification for Compliance Undertaking Evidence")
async def scan_undertaking_evidence(
    file: Optional[UploadFile] = File(None),
    condition_text: Optional[str] = Form(""),
    sample_id: Optional[str] = Form(None),
    undertaking_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
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
                    "geo_tagged": None,
                    "verified_count_or_spec": "Sample description: 40 CAD workstations and one server (unverified)",
                    "authenticity_score": None,
                    "recommendation": "HUMAN_REVIEW_REQUIRED",
                    "ai_observations": "Illustrative sample text mentions coordinates and an invoice reference. These details are not independently checked."
                },
                "sample_stp_plant": {
                    "evidence_type": "POLLUTION_CONTROL_BOARD_CLEARANCE_AND_PHOTO",
                    "geo_tagged": None,
                    "verified_count_or_spec": "Sample description: 50 KLD sewage treatment plant (unverified)",
                    "authenticity_score": None,
                    "recommendation": "HUMAN_REVIEW_REQUIRED",
                    "ai_observations": "Illustrative sample text mentions an order reference and treatment plant. These details are not independently checked."
                }
            }
            if sample_id in sample_evidence:
                return _disclose_assessment(sample_evidence[sample_id], synthetic=True)

        if not file:
            raise HTTPException(status_code=400, detail="Either a file upload or a sample_id must be provided.")

        contents = await _read_valid_upload(file)
        mime_type = file.content_type or ""
        result = GeminiService.extract_undertaking_evidence(
            image_bytes=contents,
            mime_type=mime_type,
            condition_text=condition_text or ""
        )
        stored_url = _store_upload(contents, file.filename or "upload", mime_type)
        if undertaking_id:
            undertaking = db.query(Undertaking).filter(Undertaking.id == undertaking_id).first()
            if not undertaking:
                raise HTTPException(status_code=404, detail="Undertaking record was not found.")
            undertaking.evidence_url = stored_url
            db.commit()
        result["storage_url"] = stored_url
        return _disclose_assessment(result)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Undertaking evidence verification failed: %s", e)
        raise HTTPException(status_code=502, detail="Evidence analysis or storage is temporarily unavailable.")

@router.post("/case-summary", summary="AI Executive Case Brief (Module A Requirement)")
async def get_case_summary(app_data: Dict[str, Any]):
    """
    Generates a high-authority 5-bullet AI Executive Case Brief for the
    Standing Appellate Committee (SAC) and Regional Officer reviewing an application.
    Prototype support for the administrative case-summary workflow described in
    PS 26262 Module A. This endpoint is not an official AICTE service or decision.
    """
    try:
        result = GeminiService.generate_aicte_case_summary(app_data)
        return _disclose_assessment(result)
    except Exception as e:
        logger.exception("AI case summary generation failed: %s", e)
        raise HTTPException(status_code=502, detail="Case summary generation is temporarily unavailable.")


@router.post("/documents/{document_id}/upload", summary="Store a document file for human review")
async def upload_document_file(document_id: str, file: UploadFile = File(...), renewal: bool = Form(False), db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document record was not found.")
    content = await _read_valid_upload(file)
    url = _store_upload(content, file.filename or "upload", file.content_type or "")
    if renewal:
        document.renewal_file_url = url
    else:
        document.file_url = url
    db.commit()
    return {"storage_url": url, "data_status": "unverified_upload", "human_review_required": True}


@router.post("/undertakings/{undertaking_id}/evidence", summary="Store undertaking evidence for human review")
async def upload_undertaking_file(undertaking_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    undertaking = db.query(Undertaking).filter(Undertaking.id == undertaking_id).first()
    if not undertaking:
        raise HTTPException(status_code=404, detail="Undertaking record was not found.")
    content = await _read_valid_upload(file)
    url = _store_upload(content, file.filename or "upload", file.content_type or "")
    undertaking.evidence_url = url
    db.commit()
    return {"storage_url": url, "data_status": "unverified_upload", "human_review_required": True}


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

