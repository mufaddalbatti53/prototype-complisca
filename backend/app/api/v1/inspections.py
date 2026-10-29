import os
import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from backend.app.core.database import get_db
from backend.app.core.config import settings, to_ist_iso
from backend.app.models.inspection import Inspection
from backend.app.models.declaration import ExtractedDeclaration
from backend.app.models.party import Party
from backend.app.schemas.inspection import (
    InspectionResponse,
    PartyReplyRequest,
    NoticeEscalateRequest
)

router = APIRouter(prefix="/inspections", tags=["Inspections Repository & Show-Cause Notice Management"])

@router.get("", response_model=List[InspectionResponse])
def list_inspections(
    search: Optional[str] = Query(None, description="Search by product name, brand, or store"),
    verdict: Optional[str] = Query(None, description="Filter by verdict: COMPLIANT, NON_COMPLIANT, WARNING"),
    category: Optional[str] = Query(None, description="Filter by product category"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Inspection)
    
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Inspection.product_name.ilike(term),
                Inspection.brand.ilike(term),
                Inspection.store_name.ilike(term),
                Inspection.notice_number.ilike(term)
            )
        )
    
    if verdict:
        query = query.filter(Inspection.compliance_verdict == verdict.upper())
        
    if category:
        query = query.filter(Inspection.category == category)
        
    inspections = query.order_by(desc(Inspection.created_at)).offset(skip).limit(limit).all()
    return inspections


@router.get("/aging-buckets")
def get_notice_aging_buckets(db: Session = Depends(get_db)):
    """
    Computes statutory Show-Cause Notice aging buckets under Section 15/18/36:
    - 0-15 Days: Active response window (15-day statutory show-cause timeline)
    - 16-30 Days: Overdue / Final warning issued
    - 31-60 Days: Non-compliant / Actionable Section 36 seizure & compounding penalty
    - 60+ Days: Prosecution lodged in Court of Judicial Magistrate
    """
    now = datetime.datetime.utcnow()
    notices = db.query(Inspection).filter(
        Inspection.compliance_verdict == "NON_COMPLIANT"
    ).all()

    buckets = {
        "active_0_15": {"count": 0, "title": "0 – 15 Days (Active Show-Cause Window)", "color": "emerald", "notices": []},
        "overdue_16_30": {"count": 0, "title": "16 – 30 Days (Overdue / Final Warning)", "color": "amber", "notices": []},
        "actionable_31_60": {"count": 0, "title": "31 – 60 Days (Actionable Seizure / Sec 36)", "color": "red", "notices": []},
        "prosecution_60_plus": {"count": 0, "title": "60+ Days (Prosecution Lodged)", "color": "purple", "notices": []}
    }

    for n in notices:
        created = n.created_at or now
        age_days = (now - created).days

        notice_summary = {
            "id": n.id,
            "notice_number": n.notice_number,
            "product_name": n.product_name,
            "brand": n.brand,
            "store_name": n.store_name,
            "location": n.location,
            "violations_count": n.violations_count,
            "created_at": to_ist_iso(created),
            "age_days": age_days,
            "notice_status": n.notice_status or "SHOW_CAUSE_ISSUED",
            "has_reply": bool(n.party_reply),
            "penalty_estimate_inr": min(50000, 25000 * max(1, n.violations_count))
        }

        if age_days <= 15:
            buckets["active_0_15"]["count"] += 1
            buckets["active_0_15"]["notices"].append(notice_summary)
        elif 16 <= age_days <= 30:
            buckets["overdue_16_30"]["count"] += 1
            buckets["overdue_16_30"]["notices"].append(notice_summary)
        elif 31 <= age_days <= 60:
            buckets["actionable_31_60"]["count"] += 1
            buckets["actionable_31_60"]["notices"].append(notice_summary)
        else:
            buckets["prosecution_60_plus"]["count"] += 1
            buckets["prosecution_60_plus"]["notices"].append(notice_summary)

    total_notices = len(notices)
    total_penalty_exposure = sum(
        min(50000, 25000 * max(1, n.violations_count)) for n in notices
    )

    return {
        "total_notices": total_notices,
        "total_penalty_exposure_inr": total_penalty_exposure,
        "buckets": buckets
    }


@router.post("/purge/all")
@router.delete("/purge/all")
def purge_all_inspections(db: Session = Depends(get_db)):
    """
    Purge all previous product scans, extracted declarations, and notice PDF reports.
    Preserves statutory rules, enterprise registered parties, and demo packaging images.
    """
    try:
        deleted_declarations = db.query(ExtractedDeclaration).delete()
        deleted_inspections = db.query(Inspection).delete()

        try:
            db.query(Party).update({Party.total_inspections: 0, Party.total_violations: 0})
        except Exception:
            pass

        db.commit()

        cleaned_files_count = 0
        for target_dir in [settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.REPORT_DIR]:
            if target_dir.exists():
                for item in target_dir.iterdir():
                    if item.is_file() and item.name != ".gitkeep":
                        try:
                            item.unlink()
                            cleaned_files_count += 1
                        except Exception:
                            pass

        return {
            "status": "success",
            "message": "All product reports, previous scans, and evidence records purged successfully.",
            "deleted_inspections": deleted_inspections,
            "deleted_declarations": deleted_declarations,
            "cleaned_files_count": cleaned_files_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to purge inspection records: {str(e)}")


@router.get("/{inspection_id}", response_model=InspectionResponse)
def get_inspection_detail(
    inspection_id: str,
    db: Session = Depends(get_db)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found")
    return inspection


@router.post("/{inspection_id}/reply", response_model=InspectionResponse)
def submit_party_reply(
    inspection_id: str,
    reply: PartyReplyRequest,
    db: Session = Depends(get_db)
):
    """
    Store Representative action: Submit an official legal explanation / remedy
    to the statutory Show-Cause Notice issued under Section 15 & 18.
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found")

    inspection.party_reply = reply.reply_text
    inspection.party_reply_date = datetime.datetime.utcnow()
    inspection.notice_status = "REPLIED"

    db.commit()
    db.refresh(inspection)
    return inspection


@router.post("/{inspection_id}/escalate", response_model=InspectionResponse)
def escalate_notice_action(
    inspection_id: str,
    req: NoticeEscalateRequest,
    db: Session = Depends(get_db)
):
    """
    Enforcement Officer / Superadmin action:
    Escalate notice (FINAL_WARNING, INITIATE_PROSECUTION, CLOSE_NOTICE).
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found")

    inspection.notice_status = req.action.upper()
    db.commit()
    db.refresh(inspection)
    return inspection


@router.delete("/{inspection_id}")
def delete_inspection(
    inspection_id: str,
    db: Session = Depends(get_db)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found")
    
    images = inspection.images or []
    for img in images:
        for key in ["original_path", "preprocessed_path", "annotated_path"]:
            path = img.get(key)
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

    pdf_filename = f"{inspection.notice_number or inspection.id}_report.pdf"
    pdf_path = str(settings.REPORT_DIR / pdf_filename)
    if os.path.exists(pdf_path):
        try:
            os.remove(pdf_path)
        except Exception:
            pass

    db.delete(inspection)
    db.commit()
    return {"status": "success", "message": f"Inspection {inspection_id} and associated legal files deleted successfully"}
