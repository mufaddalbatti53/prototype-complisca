import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.core.database import get_db
from backend.app.models.party import Party
from backend.app.schemas.party import PartyCreate, PartyResponse, PartyStatusUpdate

router = APIRouter(prefix="/parties", tags=["Party & Entity Management"])

DEFAULT_PARTIES = [
    {
        "id": "party_metro_rohini",
        "name": "Metro Cash & Carry, Rohini",
        "entity_type": "Wholesale & Retailer",
        "gstin": "07AAACM1234F1Z5",
        "trade_license": "TL-MCD-2024-8841",
        "district": "North West Delhi",
        "state": "Delhi",
        "status": "APPROVED",
        "risk_rating": "LOW",
        "total_inspections": 12,
        "total_violations": 1
    },
    {
        "id": "party_reliance_smart",
        "name": "Reliance Smart Bazaar, Ghaziabad",
        "entity_type": "Supermarket Retailer",
        "gstin": "09AAACR5678G2Z1",
        "trade_license": "TL-GZB-2025-4102",
        "district": "Ghaziabad",
        "state": "Uttar Pradesh",
        "status": "APPROVED",
        "risk_rating": "LOW",
        "total_inspections": 8,
        "total_violations": 0
    },
    {
        "id": "party_itc_ltd",
        "name": "ITC Limited — Foods Division",
        "entity_type": "Manufacturer & Packer",
        "gstin": "19AAACI0123H1Z4",
        "trade_license": "LIC-FSSAI-10012026",
        "district": "Bengaluru Urban",
        "state": "Karnataka",
        "status": "APPROVED",
        "risk_rating": "LOW",
        "total_inspections": 24,
        "total_violations": 2
    },
    {
        "id": "party_delight_foods",
        "name": "Delight Nutrition Foods Pvt Ltd",
        "entity_type": "Packer & Manufacturer",
        "gstin": "07AAACD9981K1Z2",
        "trade_license": "TL-DL-2023-1192",
        "district": "South West Delhi",
        "state": "Delhi",
        "status": "SUSPENDED",
        "risk_rating": "HIGH",
        "total_inspections": 5,
        "total_violations": 4
    }
]

def seed_default_parties(db: Session):
    existing = db.query(Party).first()
    if not existing:
        for p in DEFAULT_PARTIES:
            party = Party(**p)
            db.add(party)
        db.commit()

@router.get("", response_model=List[PartyResponse])
def list_parties(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    seed_default_parties(db)
    query = db.query(Party)
    if search:
        term = f"%{search}%"
        query = query.filter(Party.name.ilike(term) | Party.gstin.ilike(term))
    if status:
        query = query.filter(Party.status == status.upper())
    return query.order_by(desc(Party.created_at)).all()

@router.post("", response_model=PartyResponse)
def create_party(party_in: PartyCreate, db: Session = Depends(get_db)):
    party_id = f"party_{uuid.uuid4().hex[:8]}"
    party = Party(
        id=party_id,
        **party_in.model_dump()
    )
    db.add(party)
    db.commit()
    db.refresh(party)
    return party

@router.get("/{party_id}", response_model=PartyResponse)
def get_party(party_id: str, db: Session = Depends(get_db)):
    party = db.query(Party).filter(Party.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party entity not found")
    return party

@router.patch("/{party_id}/status", response_model=PartyResponse)
def update_party_status(
    party_id: str,
    status_update: PartyStatusUpdate,
    db: Session = Depends(get_db)
):
    party = db.query(Party).filter(Party.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party entity not found")
    
    valid_statuses = {"APPROVED", "PENDING_REVIEW", "SUSPENDED", "REVOKED"}
    new_status = status_update.status.upper()
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    party.status = new_status
    if new_status == "SUSPENDED":
        party.risk_rating = "HIGH"
    elif new_status == "REVOKED":
        party.risk_rating = "CRITICAL"
    elif new_status == "APPROVED":
        party.risk_rating = "LOW"

    db.commit()
    db.refresh(party)
    return party
