from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_serializer
from backend.app.core.config import to_ist_iso

class BoundingBox(BaseModel):
    # Normalized coordinates [ymin, xmin, ymax, xmax] (0-1000) or pixel values
    box_2d: List[int] = Field(default_factory=list)
    label: Optional[str] = None

class ExtractedDeclarationSchema(BaseModel):
    field_code: str
    field_name: str
    statutory_rule_ref: str
    is_present: bool = False
    detected_value: Optional[str] = None
    raw_ocr_text: Optional[str] = None
    confidence_score: float = 1.0
    bounding_box: Optional[List[int]] = Field(default_factory=list)
    panel_side: str = "PDP"
    measured_font_height_mm: Optional[float] = None
    minimum_prescribed_height_mm: Optional[float] = None
    compliance_status: str = "COMPLIANT" # COMPLIANT, VIOLATION, WARNING
    violation_code: Optional[str] = None
    violation_title: Optional[str] = None
    violation_description: Optional[str] = None
    legal_remedy_recommendation: Optional[str] = None

    class Config:
        from_attributes = True

class ImageEvidence(BaseModel):
    original_url: str
    preprocessed_url: Optional[str] = None
    annotated_url: Optional[str] = None
    panel_type: str = "front_pdp"

class InspectionResponse(BaseModel):
    id: str
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = "Packaged Commodity"
    barcode_gtin: Optional[str] = None
    inspector_id: str
    inspector_name: str
    store_name: str
    location: str
    status: str
    compliance_verdict: str
    overall_compliance_score: float
    violations_count: int
    warnings_count: int
    pdp_area_sqcm: float
    pdp_shape: str
    package_weight_or_volume: Optional[str] = None
    images: List[Dict[str, Any]] = Field(default_factory=list)
    source_type: str
    source_url: Optional[str] = None
    summary: Optional[str] = None
    notice_number: Optional[str] = None
    report_pdf_path: Optional[str] = None
    party_id: Optional[str] = None
    notice_due_date: Optional[datetime] = None
    notice_status: Optional[str] = "SHOW_CAUSE_ISSUED"
    party_reply: Optional[str] = None
    party_reply_date: Optional[datetime] = None
    created_at: datetime
    declarations: List[ExtractedDeclarationSchema] = Field(default_factory=list)

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info):
        return to_ist_iso(dt)

    @field_serializer("notice_due_date")
    def serialize_due_date(self, dt: Optional[datetime], _info):
        return to_ist_iso(dt)

    @field_serializer("party_reply_date")
    def serialize_reply_date(self, dt: Optional[datetime], _info):
        return to_ist_iso(dt)

    class Config:
        from_attributes = True

class PartyReplyRequest(BaseModel):
    reply_text: str
    rectification_evidence: Optional[str] = None

class NoticeEscalateRequest(BaseModel):
    action: str # FINAL_WARNING, INITIATE_PROSECUTION, CLOSE_NOTICE
    notes: Optional[str] = None

class UrlScanRequest(BaseModel):
    url: str
    category: Optional[str] = "General Packaged Commodity"
    inspector_name: Optional[str] = "Officer (Enforcement Division)"
    store_name: Optional[str] = "E-Commerce Inspection"
    location: Optional[str] = "Online / Marketplace"
    pdp_area_sqcm: Optional[float] = 120.0
    rules_config: Optional[List[Dict[str, Any]]] = None
