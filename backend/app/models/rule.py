import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, JSON, DateTime
from backend.app.core.database import Base

class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(String(50), primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, index=True) # e.g. "LMPC_RULE_6_1_A"
    rule_name = Column(String(255))
    statutory_reference = Column(String(100)) # e.g. "Rule 6(1)(a), LMPC Rules 2011"
    category = Column(String(100)) # e.g. "Manufacturer Info", "Pricing", "Quantity", "Dimensions"
    is_mandatory = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    
    # Configurable parameters as JSON (thresholds, allowed units, required components)
    parameters = Column(JSON, default=dict)
    
    description = Column(Text, nullable=True)
    statutory_penalty_summary = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
