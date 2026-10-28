import os
import uuid
import shutil
import logging
import datetime
from pathlib import Path

logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.inspection import Inspection
from backend.app.models.declaration import ExtractedDeclaration
from backend.app.models.rule import ComplianceRule
from backend.app.models.party import Party
from backend.app.schemas.inspection import InspectionResponse, UrlScanRequest
from backend.app.services.preprocessor import ImagePreprocessor
from backend.app.services.gemini_service import GeminiService
from backend.app.services.compliance_engine import LegalMetrologyRuleEngine
from backend.app.services.ocr_engine import OCREngine
from backend.app.services.scraper_service import EcommerceScraperService
from backend.app.services.report_generator import InspectionReportGenerator

router = APIRouter(prefix="/scan", tags=["Scan & Verification"])

@router.post("/upload", response_model=InspectionResponse)
async def upload_and_analyze_packaging(
    file: UploadFile = File(...),
    product_name: str = Form(None),
    brand: str = Form(None),
    category: str = Form("Packaged Commodity"),
    store_name: str = Form("Retail Inspection Point"),
    location: str = Form("New Delhi, India"),
    inspector_id: str = Form("OFFICER-DL-2026-084"),
    inspector_name: str = Form("Enforcement Officer"),
    pdp_area_sqcm: float = Form(100.0),
    pdp_shape: str = Form("RECTANGULAR"),
    rules_config: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Core pipeline:
    1. Capture & Save uploaded image
    2. OpenCV Pre-processing (Auto-deskew, contrast enhancement, glare suppression)
    3. Gemini Flash AI Multimodal Declaration Extraction
    4. Deterministic LMPC 2011 Rule Verification (MRP, Units, Font Heights, Consumer Care)
    5. Generate Inspector Bounding Box Overlay
    6. Generate Statutory PDF Inspection Memo
    7. Save to Database
    """
    # 1. Save original file
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    settings.REPORT_DIR.mkdir(parents=True, exist_ok=True)

    file_id = f"insp_{uuid.uuid4().hex[:10]}"
    ext = Path(file.filename).suffix or ".jpg"
    orig_filename = f"{file_id}_original{ext}"
    orig_path = str(settings.UPLOAD_DIR / orig_filename)

    with open(orig_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. OpenCV Pre-processing
    prep_filename = f"{file_id}_preprocessed.jpg"
    prep_path = str(settings.PROCESSED_DIR / prep_filename)
    prep_meta = {"image_sha256": "raw_upload_fallback", "estimated_pdp_area_sqcm": pdp_area_sqcm}
    
    try:
        prep_meta = ImagePreprocessor.deskew_and_enhance(orig_path, prep_path)
    except Exception as e:
        logger.warning(f"Preprocessing fallback for {orig_path}: {e}")
        prep_path = orig_path # fallback to original if preprocessing hits unusual raw format

    # Prioritize user-provided / auto-filled PDP area; fallback to OpenCV estimate only if none given
    if pdp_area_sqcm and float(pdp_area_sqcm) > 0:
        calc_pdp_area = float(pdp_area_sqcm)
    else:
        calc_pdp_area = prep_meta.get("estimated_pdp_area_sqcm", 100.0)

    # 3. Local Deep-Learning OCR Extraction
    try:
        local_ocr_tokens = OCREngine.run_local_ocr(prep_path)
    except Exception:
        local_ocr_tokens = []

    # 4. State-of-the-Art Gemini 3.7 Flash Multimodal Reasoning
    try:
        analysis_raw = GeminiService.analyze_packaging_image(prep_path, local_ocr_tokens=local_ocr_tokens)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini AI Analysis failed: {str(e)}"
        )

    # Extract meta fields if not overridden by user
    det_product = product_name or analysis_raw.get("product_name") or "Packaged Commodity"
    det_brand = brand or analysis_raw.get("brand") or "Generic"
    det_category = category or analysis_raw.get("category") or "Packaged Commodity"
    executive_summary = analysis_raw.get("executive_summary", "")

    # Calculate font heights in mm from bounding box coordinates
    raw_declarations = analysis_raw.get("declarations", [])
    for d in raw_declarations:
        bbox = d.get("bounding_box", [])
        if bbox and len(bbox) == 4:
            d["measured_font_height_mm"] = ImagePreprocessor.calculate_font_height_mm(
                bbox, img_height=1000, pdp_height_cm=15.0
            )

    # Fetch active configurable rules: uses tester's local sandbox rules if provided, else universal DB defaults
    active_rules_config = []
    if rules_config:
        try:
            import json
            active_rules_config = json.loads(rules_config)
        except Exception:
            active_rules_config = []

    if not active_rules_config:
        db_rules = db.query(ComplianceRule).all()
        active_rules_config = [
            {
                "rule_code": r.rule_code,
                "is_active": r.is_active,
                "is_mandatory": r.is_mandatory,
                "parameters": r.parameters
            }
            for r in db_rules
        ]

    # 4. Deterministic Rule Engine Verification (100% in code, zero AI scoring)
    verified_decls, overall_score, verdict, violations_cnt, warnings_cnt = (
        LegalMetrologyRuleEngine.verify_all_declarations(
            raw_declarations,
            pdp_area_sqcm=calc_pdp_area,
            active_rules_config=active_rules_config
        )
    )

    # Deterministic statutory executive summary computed directly from rule engine
    if violations_cnt == 0:
        executive_summary = "All mandatory statutory declarations required under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011 are verified as compliant."
    else:
        viol_names = [d["field_name"] for d in verified_decls if d.get("compliance_status") == "VIOLATION"]
        viol_str = ", ".join(viol_names[:3])
        if len(viol_names) > 3:
            viol_str += f" (+{len(viol_names) - 3} more)"
        executive_summary = f"Statutory inspection identified {violations_cnt} non-compliance violation(s) under Legal Metrology Act, 2009: {viol_str}."

    logger.info(f"Scan {file_id}: Payload SHA-256 = {prep_meta.get('image_sha256')}, Verdict = {verdict}, Violations = {violations_cnt}")

    # 5. Generate Annotated Bounding Box Image
    annotated_filename = f"{file_id}_annotated.jpg"
    annotated_path = str(settings.PROCESSED_DIR / annotated_filename)
    try:
        OCREngine.draw_compliance_overlay(
            prep_path,
            verified_decls,
            annotated_path
        )
    except Exception as e:
        annotated_path = prep_path

    # Web-accessible URLs
    images_meta = [
        {
            "original_path": orig_path,
            "original_url": f"/storage/uploads/{orig_filename}",
            "preprocessed_path": prep_path,
            "preprocessed_url": f"/storage/processed/{prep_filename}",
            "annotated_path": annotated_path,
            "annotated_url": f"/storage/processed/{annotated_filename}",
            "panel_type": "front_pdp"
        }
    ]

    notice_no = f"LM-DEL-{uuid.uuid4().hex[:6].upper()}-2026"
    pdf_filename = f"{notice_no}_report.pdf"
    pdf_path = str(settings.REPORT_DIR / pdf_filename)

    # 6. Generate Statutory Form 1 Notice PDF
    report_dict = {
        "notice_number": notice_no,
        "inspector_id": inspector_id,
        "inspector_name": inspector_name,
        "store_name": store_name,
        "location": location,
        "product_name": det_product,
        "brand": det_brand,
        "category": det_category,
        "pdp_area_sqcm": calc_pdp_area,
        "overall_compliance_score": overall_score,
        "compliance_verdict": verdict,
        "declarations": verified_decls,
        "images": images_meta
    }

    try:
        InspectionReportGenerator.generate_pdf_report(report_dict, pdf_path)
        report_pdf_path = f"/storage/reports/{pdf_filename}"
    except Exception as e:
        report_pdf_path = None

    # 7. Persist to Database and link to Regulated Commercial Entity
    party_id = None
    try:
        party_filters = []
        if det_brand and det_brand not in ("Generic", "Packaged Commodity"):
            party_filters.append(Party.name.ilike(f"%{det_brand}%"))
        if store_name and store_name not in ("Retail Inspection Point", ""):
            party_filters.append(Party.name.ilike(f"%{store_name}%"))
        
        matched_party = db.query(Party).filter(or_(*party_filters)).first() if party_filters else None
        if matched_party:
            party_id = matched_party.id
            matched_party.total_inspections = (matched_party.total_inspections or 0) + 1
            if violations_cnt > 0:
                matched_party.total_violations = (matched_party.total_violations or 0) + 1
    except Exception as e:
        logger.warning(f"Party association warning: {e}")

    try:
        inspection = Inspection(
            id=file_id,
            product_name=det_product,
            brand=det_brand,
            category=det_category,
            inspector_id=inspector_id,
            inspector_name=inspector_name,
            store_name=store_name,
            location=location,
            status="COMPLETED",
            compliance_verdict=verdict,
            overall_compliance_score=overall_score,
            violations_count=violations_cnt,
            warnings_count=warnings_cnt,
            pdp_area_sqcm=calc_pdp_area,
            pdp_shape=pdp_shape,
            images=images_meta,
            source_type="IMAGE_UPLOAD",
            summary=executive_summary,
            notice_number=notice_no,
            report_pdf_path=report_pdf_path,
            party_id=party_id,
            notice_due_date=datetime.datetime.utcnow() + datetime.timedelta(days=15),
            notice_status="SHOW_CAUSE_ISSUED" if violations_cnt > 0 else "CLOSED"
        )
        db.add(inspection)
        db.flush()

        for decl_data in verified_decls:
            decl_model = ExtractedDeclaration(
                inspection_id=file_id,
                field_code=decl_data["field_code"],
                field_name=decl_data["field_name"],
                statutory_rule_ref=decl_data["statutory_rule_ref"],
                is_present=decl_data["is_present"],
                detected_value=decl_data["detected_value"],
                raw_ocr_text=decl_data.get("raw_ocr_text"),
                confidence_score=decl_data.get("confidence_score", 0.95),
                bounding_box=decl_data.get("bounding_box") or [],
                panel_side=decl_data.get("panel_side", "PDP"),
                measured_font_height_mm=decl_data.get("measured_font_height_mm"),
                minimum_prescribed_height_mm=decl_data.get("minimum_prescribed_height_mm"),
                compliance_status=decl_data.get("compliance_status", "COMPLIANT"),
                violation_code=decl_data.get("violation_code"),
                violation_title=decl_data.get("violation_title"),
                violation_description=decl_data.get("violation_description"),
                legal_remedy_recommendation=decl_data.get("legal_remedy_recommendation")
            )
            db.add(decl_model)

        db.commit()
        db.refresh(inspection)
        return inspection
    except Exception as e:
        db.rollback()
        logger.exception(f"Database persist error for scan {file_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record inspection in database: {str(e)}"
        )


@router.post("/url", response_model=InspectionResponse)
async def scan_ecommerce_url(
    req: UrlScanRequest,
    db: Session = Depends(get_db)
):
    """
    Extracts product image from e-commerce URL and performs automated compliance audit.
    """
    clean_url = (req.url or "").strip()
    if not clean_url:
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid product listing URL."
        )
    if not (clean_url.startswith("http://") or clean_url.startswith("https://")):
        raise HTTPException(
            status_code=400,
            detail="Invalid URL scheme. Please provide a complete URL starting with http:// or https://"
        )

    try:
        scraped = EcommerceScraperService.extract_product_from_url(clean_url)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Ecommerce scraping failed for {clean_url}: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Could not load product image from URL: {str(e)}"
        )

    file_id = f"insp_{uuid.uuid4().hex[:10]}"
    orig_path = scraped["local_image_path"]

    # Preprocess
    settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    settings.REPORT_DIR.mkdir(parents=True, exist_ok=True)
    prep_filename = f"{file_id}_preprocessed.jpg"
    prep_path = str(settings.PROCESSED_DIR / prep_filename)
    prep_meta = {"image_sha256": "raw_url_fallback", "estimated_pdp_area_sqcm": req.pdp_area_sqcm or 100.0}
    try:
        prep_meta = ImagePreprocessor.deskew_and_enhance(orig_path, prep_path)
    except Exception as e:
        logger.warning(f"Preprocessing fallback for URL {clean_url}: {e}")
        prep_path = orig_path

    # Prioritize user-provided / auto-filled PDP area; fallback to OpenCV estimate only if none given
    if req.pdp_area_sqcm and float(req.pdp_area_sqcm) > 0:
        calc_pdp_area = float(req.pdp_area_sqcm)
    else:
        calc_pdp_area = prep_meta.get("estimated_pdp_area_sqcm", 100.0)

    # 3. Local Deep-Learning OCR Extraction
    try:
        local_ocr_tokens = OCREngine.run_local_ocr(prep_path)
    except Exception:
        local_ocr_tokens = []

    # 4. State-of-the-Art Gemini Multimodal Reasoning
    try:
        analysis_raw = GeminiService.analyze_packaging_image(prep_path, local_ocr_tokens=local_ocr_tokens)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini AI Analysis failed on e-commerce image: {str(e)}"
        )

    det_product = analysis_raw.get("product_name") or scraped.get("title") or "E-Commerce Product"
    det_brand = analysis_raw.get("brand") or "Generic"
    det_category = req.category or analysis_raw.get("category") or "Packaged Commodity"
    executive_summary = analysis_raw.get("executive_summary", "")

    # Calculate font heights in mm
    raw_declarations = analysis_raw.get("declarations", [])
    for d in raw_declarations:
        bbox = d.get("bounding_box", [])
        if bbox and len(bbox) == 4:
            d["measured_font_height_mm"] = ImagePreprocessor.calculate_font_height_mm(
                bbox, img_height=1000, pdp_height_cm=15.0
            )

    active_rules_config = req.rules_config
    if not active_rules_config:
        db_rules = db.query(ComplianceRule).all()
        active_rules_config = [
            {
                "rule_code": r.rule_code,
                "is_active": r.is_active,
                "is_mandatory": r.is_mandatory,
                "parameters": r.parameters
            }
            for r in db_rules
        ]

    # Verify Rules deterministically in Python with DB active rules
    verified_decls, overall_score, verdict, violations_cnt, warnings_cnt = (
        LegalMetrologyRuleEngine.verify_all_declarations(
            raw_declarations,
            pdp_area_sqcm=calc_pdp_area,
            active_rules_config=active_rules_config
        )
    )

    if violations_cnt == 0:
        executive_summary = "All mandatory statutory declarations required under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011 are verified as compliant."
    else:
        viol_names = [d["field_name"] for d in verified_decls if d.get("compliance_status") == "VIOLATION"]
        viol_str = ", ".join(viol_names[:3])
        if len(viol_names) > 3:
            viol_str += f" (+{len(viol_names) - 3} more)"
        executive_summary = f"Statutory inspection identified {violations_cnt} non-compliance violation(s) under Legal Metrology Act, 2009: {viol_str}."

    # Annotated bounding box overlay
    annotated_filename = f"{file_id}_annotated.jpg"
    annotated_path = str(settings.PROCESSED_DIR / annotated_filename)
    try:
        OCREngine.draw_compliance_overlay(
            prep_path,
            verified_decls,
            annotated_path
        )
    except Exception:
        annotated_path = prep_path

    images_meta = [
        {
            "original_path": orig_path,
            "original_url": f"/storage/uploads/{Path(orig_path).name}",
            "preprocessed_path": prep_path,
            "preprocessed_url": f"/storage/processed/{prep_filename}",
            "annotated_path": annotated_path,
            "annotated_url": f"/storage/processed/{annotated_filename}",
            "panel_type": "ecom_listing"
        }
    ]

    notice_no = f"LM-ECOM-{uuid.uuid4().hex[:6].upper()}-2026"
    pdf_filename = f"{notice_no}_report.pdf"
    pdf_path = str(settings.REPORT_DIR / pdf_filename)

    report_dict = {
        "notice_number": notice_no,
        "inspector_id": "OFFICER-ECOM-AUDIT",
        "inspector_name": req.inspector_name or "E-Commerce Legal Cell",
        "store_name": req.store_name or "Marketplace Listing",
        "location": req.location or "Digital Commerce Portal",
        "product_name": det_product,
        "brand": det_brand,
        "category": det_category,
        "pdp_area_sqcm": calc_pdp_area,
        "overall_compliance_score": overall_score,
        "compliance_verdict": verdict,
        "declarations": verified_decls,
        "images": images_meta
    }

    try:
        InspectionReportGenerator.generate_pdf_report(report_dict, pdf_path)
        report_pdf_path = f"/storage/reports/{pdf_filename}"
    except Exception:
        report_pdf_path = None

    # Auto-link to matching regulated party entity if exists
    party_id = None
    try:
        party_filters = []
        if det_brand and det_brand not in ("Generic", "Packaged Commodity"):
            party_filters.append(Party.name.ilike(f"%{det_brand}%"))
        if req.store_name and req.store_name not in ("Marketplace Listing", ""):
            party_filters.append(Party.name.ilike(f"%{req.store_name}%"))
        
        matched_party = db.query(Party).filter(or_(*party_filters)).first() if party_filters else None
        if matched_party:
            party_id = matched_party.id
            matched_party.total_inspections = (matched_party.total_inspections or 0) + 1
            if violations_cnt > 0:
                matched_party.total_violations = (matched_party.total_violations or 0) + 1
    except Exception as e:
        logger.warning(f"Party matching warning: {e}")

    try:
        inspection = Inspection(
            id=file_id,
            product_name=det_product,
            brand=det_brand,
            category=det_category,
            inspector_id="OFFICER-ECOM-AUDIT",
            inspector_name=req.inspector_name or "E-Commerce Legal Cell",
            store_name=req.store_name or "Marketplace Listing",
            location=req.location or "Digital Commerce Portal",
            status="COMPLETED",
            compliance_verdict=verdict,
            overall_compliance_score=overall_score,
            violations_count=violations_cnt,
            warnings_count=warnings_cnt,
            pdp_area_sqcm=calc_pdp_area,
            images=images_meta,
            source_type="ECOMMERCE_URL",
            source_url=req.url,
            summary=executive_summary,
            notice_number=notice_no,
            report_pdf_path=report_pdf_path,
            party_id=party_id,
            notice_due_date=datetime.datetime.utcnow() + datetime.timedelta(days=15),
            notice_status="SHOW_CAUSE_ISSUED" if violations_cnt > 0 else "CLOSED"
        )
        db.add(inspection)
        db.flush()

        for decl_data in verified_decls:
            decl_model = ExtractedDeclaration(
                inspection_id=file_id,
                field_code=decl_data["field_code"],
                field_name=decl_data["field_name"],
                statutory_rule_ref=decl_data["statutory_rule_ref"],
                is_present=decl_data["is_present"],
                detected_value=decl_data["detected_value"],
                raw_ocr_text=decl_data.get("raw_ocr_text"),
                confidence_score=decl_data.get("confidence_score", 0.95),
                bounding_box=decl_data.get("bounding_box") or [],
                panel_side=decl_data.get("panel_side", "PDP"),
                measured_font_height_mm=decl_data.get("measured_font_height_mm"),
                minimum_prescribed_height_mm=decl_data.get("minimum_prescribed_height_mm"),
                compliance_status=decl_data.get("compliance_status", "COMPLIANT"),
                violation_code=decl_data.get("violation_code"),
                violation_title=decl_data.get("violation_title"),
                violation_description=decl_data.get("violation_description"),
                legal_remedy_recommendation=decl_data.get("legal_remedy_recommendation")
            )
            db.add(decl_model)

        db.commit()
        db.refresh(inspection)
        return inspection
    except Exception as e:
        db.rollback()
        logger.exception(f"Database persist error for scan {file_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record URL inspection in database: {str(e)}"
        )
