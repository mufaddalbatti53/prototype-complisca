import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(50), primary_key=True, index=True)
    product_name = Column(String(255), nullable=True)
    brand = Column(String(255), nullable=True)
    category = Column(String(100), default="Packaged Food & Beverage")
    barcode_gtin = Column(String(100), nullable=True)
    
    # Inspector & Enforcement context
    inspector_id = Column(String(100), default="OFFICER-DL-2026-084")
    inspector_name = Column(String(255), default="Enforcement Officer (North Zone)")
    store_name = Column(String(255), default="Retail Inspection Sample")
    location = Column(String(255), default="New Delhi, India")
    
    # Audit outcome
    status = Column(String(50), default="COMPLETED")  # COMPLETED, PENDING, FAILED
    compliance_verdict = Column(String(50), default="NON_COMPLIANT")  # COMPLIANT, NON_COMPLIANT, WARNING
    overall_compliance_score = Column(Float, default=0.0) # 0 to 100%
    violations_count = Column(Integer, default=0)
    warnings_count = Column(Integer, default=0)
    
    # Packaging Dimensions & PDP
    pdp_area_sqcm = Column(Float, default=100.0)
    pdp_shape = Column(String(50), default="RECTANGULAR")  # RECTANGULAR, CYLINDRICAL, SPECIAL
    package_weight_or_volume = Column(String(50), nullable=True)
    
    # Evidence & Media (JSON arrays)
    images = Column(JSON, default=list) # [{original: path, preprocessed: path, annotated: path, panel_type: "front_pdp"}]
    source_type = Column(String(50), default="IMAGE_UPLOAD")  # IMAGE_UPLOAD, LIVE_CAMERA, ECOMMERCE_URL
    source_url = Column(Text, nullable=True)
    
    # Summary of findings
    summary = Column(Text, nullable=True)
    executive_findings = Column(JSON, default=dict)
    
    # Statutory Notice Details
    notice_number = Column(String(100), nullable=True)
    report_pdf_path = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    declarations = relationship("ExtractedDeclaration", back_populates="inspection", cascade="all, delete-orphan")
