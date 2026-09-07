from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from backend.app.core.database import get_db
from backend.app.models.inspection import Inspection
from backend.app.schemas.inspection import InspectionResponse

router = APIRouter(prefix="/inspections", tags=["Inspections Repository"])

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


@router.get("/{inspection_id}", response_model=InspectionResponse)
def get_inspection_detail(
    inspection_id: str,
    db: Session = Depends(get_db)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found")
    return inspection


@router.delete("/{inspection_id}")
def delete_inspection(
    inspection_id: str,
    db: Session = Depends(get_db)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found")
    db.delete(inspection)
    db.commit()
    return {"status": "success", "message": f"Inspection {inspection_id} deleted successfully"}
