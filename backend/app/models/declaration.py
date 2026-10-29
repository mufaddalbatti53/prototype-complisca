from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class ExtractedDeclaration(Base):
    __tablename__ = "extracted_declarations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    inspection_id = Column(String(50), ForeignKey("inspections.id"), index=True)
    
    field_code = Column(String(100), index=True)
    field_name = Column(String(255))
    statutory_rule_ref = Column(String(100))
    
    is_present = Column(Boolean, default=False)
    detected_value = Column(Text, nullable=True)
    raw_ocr_text = Column(Text, nullable=True)
    confidence_score = Column(Float, default=1.0)
    
    bounding_box = Column(JSON, default=list)
    panel_side = Column(String(50), default="PDP")
    
    measured_font_height_mm = Column(Float, nullable=True)
    minimum_prescribed_height_mm = Column(Float, nullable=True)
    contrast_ratio = Column(Float, nullable=True)
    
    compliance_status = Column(String(50), default="COMPLIANT")
    violation_code = Column(String(100), nullable=True)
    violation_title = Column(String(255), nullable=True)
    violation_description = Column(Text, nullable=True)
    legal_remedy_recommendation = Column(Text, nullable=True)
    
    inspection = relationship("Inspection", back_populates="declarations")
