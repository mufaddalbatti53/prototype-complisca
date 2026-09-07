import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.inspection import Inspection
from backend.app.services.report_generator import InspectionReportGenerator

router = APIRouter(prefix="/reports", tags=["Reports & Notices"])

@router.get("/{inspection_id}/pdf")
def download_pdf_report(
    inspection_id: str,
    db: Session = Depends(get_db)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    pdf_filename = f"{inspection.notice_number or inspection.id}_report.pdf"
    pdf_path = str(settings.REPORT_DIR / pdf_filename)

    # Regenerate if file missing
    if not os.path.exists(pdf_path):
        declarations_list = [
            {
                "field_name": d.field_name,
                "statutory_rule_ref": d.statutory_rule_ref,
                "detected_value": d.detected_value,
                "measured_font_height_mm": d.measured_font_height_mm,
                "compliance_status": d.compliance_status,
                "violation_description": d.violation_description
            }
            for d in inspection.declarations
        ]
        report_dict = {
            "notice_number": inspection.notice_number,
            "inspector_id": inspection.inspector_id,
            "inspector_name": inspection.inspector_name,
            "store_name": inspection.store_name,
            "location": inspection.location,
            "product_name": inspection.product_name,
            "brand": inspection.brand,
            "category": inspection.category,
            "pdp_area_sqcm": inspection.pdp_area_sqcm,
            "overall_compliance_score": inspection.overall_compliance_score,
            "compliance_verdict": inspection.compliance_verdict,
            "declarations": declarations_list,
            "images": inspection.images
        }
        InspectionReportGenerator.generate_pdf_report(report_dict, pdf_path)

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=pdf_filename
    )


@router.get("/{inspection_id}/json")
def export_json_report(
    inspection_id: str,
    db: Session = Depends(get_db)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    data = {
        "inspection_id": inspection.id,
        "notice_number": inspection.notice_number,
        "product_name": inspection.product_name,
        "brand": inspection.brand,
        "category": inspection.category,
        "inspector": {
            "id": inspection.inspector_id,
            "name": inspection.inspector_name,
            "store_audited": inspection.store_name,
            "location": inspection.location
        },
        "audit_summary": {
            "status": inspection.status,
            "compliance_verdict": inspection.compliance_verdict,
            "overall_compliance_score": inspection.overall_compliance_score,
            "violations_count": inspection.violations_count,
            "warnings_count": inspection.warnings_count,
            "pdp_area_sqcm": inspection.pdp_area_sqcm
        },
        "declarations": [
            {
                "field_code": d.field_code,
                "field_name": d.field_name,
                "statutory_rule": d.statutory_rule_ref,
                "is_present": d.is_present,
                "detected_value": d.detected_value,
                "compliance_status": d.compliance_status,
                "measured_font_height_mm": d.measured_font_height_mm,
                "violation_code": d.violation_code,
                "violation_title": d.violation_title,
                "violation_description": d.violation_description,
                "remedy": d.legal_remedy_recommendation
            }
            for d in inspection.declarations
        ],
        "created_at": inspection.created_at.isoformat() if inspection.created_at else None
    }
    return JSONResponse(content=data)
