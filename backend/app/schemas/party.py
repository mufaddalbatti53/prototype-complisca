from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class PartyBase(BaseModel):
    name: str
    entity_type: Optional[str] = "Retailer"
    gstin: Optional[str] = None
    trade_license: Optional[str] = None
    district: Optional[str] = "North Delhi"
    state: Optional[str] = "Delhi"
    status: Optional[str] = "APPROVED"
    risk_rating: Optional[str] = "LOW"

class PartyCreate(PartyBase):
    pass

class PartyStatusUpdate(BaseModel):
    status: str # APPROVED, SUSPENDED, REVOKED, PENDING_REVIEW

class PartyResponse(PartyBase):
    id: str
    total_inspections: int = 0
    total_violations: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
