import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

from backend.app.core.config import get_ist_now

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(50), primary_key=True, index=True)
    product_name = Column(String(255), nullable=True)
    brand = Column(String(255), nullable=True)
    category = Column(String(100), default="Packaged Food & Beverage")
    barcode_gtin = Column(String(100), nullable=True)
    
    inspector_id = Column(String(100), default="OFFICER-DL-2026-084")
    inspector_name = Column(String(255), default="Enforcement Officer (North Zone)")
    store_name = Column(String(255), default="Retail Inspection Sample")
    location = Column(String(255), default="New Delhi, India")
    
    status = Column(String(50), default="COMPLETED")
    compliance_verdict = Column(String(50), default="NON_COMPLIANT")
    overall_compliance_score = Column(Float, default=0.0)
    violations_count = Column(Integer, default=0)
    warnings_count = Column(Integer, default=0)
    
    pdp_area_sqcm = Column(Float, default=100.0)
    pdp_shape = Column(String(50), default="RECTANGULAR")
    package_weight_or_volume = Column(String(50), nullable=True)
    
    images = Column(JSON, default=list)
    source_type = Column(String(50), default="IMAGE_UPLOAD")
    source_url = Column(Text, nullable=True)
    
    summary = Column(Text, nullable=True)
    executive_findings = Column(JSON, default=dict)
    
    notice_number = Column(String(100), nullable=True)
    report_pdf_path = Column(String(255), nullable=True)
    party_id = Column(String(50), nullable=True, index=True)
    notice_due_date = Column(DateTime, nullable=True)
    notice_status = Column(String(50), default="SHOW_CAUSE_ISSUED")
    party_reply = Column(Text, nullable=True)
    party_reply_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)

    declarations = relationship("ExtractedDeclaration", back_populates="inspection", cascade="all, delete-orphan")
