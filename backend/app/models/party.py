import datetime
from sqlalchemy import Column, String, Integer, DateTime
from backend.app.core.database import Base

class Party(Base):
    __tablename__ = "parties"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), index=True)
    entity_type = Column(String(100), default="Retailer") # Retailer, Manufacturer, Packer, Importer, E-Commerce Platform
    gstin = Column(String(50), nullable=True)
    trade_license = Column(String(100), nullable=True)
    district = Column(String(100), default="North Delhi")
    state = Column(String(100), default="Delhi")
    
    # Lifecycle & Compliance Status: APPROVED, PENDING_REVIEW, SUSPENDED, REVOKED
    status = Column(String(50), default="APPROVED", index=True)
    risk_rating = Column(String(50), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    
    total_inspections = Column(Integer, default=0)
    total_violations = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
