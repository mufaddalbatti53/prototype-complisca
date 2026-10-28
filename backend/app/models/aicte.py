from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.core.database import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    aishe_code = Column(String(50), unique=True, index=True)
    region = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    institution_type = Column(String(100), nullable=False)
    established_year = Column(Integer, default=2010)
    compliance_score = Column(Integer, default=85)
    risk_flag = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH
    status = Column(String(50), default="ACTIVE") # ACTIVE, UNDER_REVIEW, SUSPENDED
    intake_capacity = Column(Integer, default=480)
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("Application", back_populates="institution")
    documents = relationship("Document", back_populates="institution")

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(50), primary_key=True, index=True)
    ref_no = Column(String(50), unique=True, index=True) # APH-2026-XXXX
    institution_id = Column(String(50), ForeignKey("institutions.id"), nullable=False)
    app_type = Column(String(100), nullable=False) # NEW_INSTITUTION, EXTENSION_OF_APPROVAL, NEW_COURSE_OR_INTAKE, CLOSURE_OR_MERGER
    route = Column(String(50), nullable=False) # ONLY_SCRUTINY, SCRUTINY_EVC, SCRUTINY_EVC_SAC, EVC_SAC
    current_stage = Column(String(50), default="SCRUTINY")
    status = Column(String(50), default="IN_PROGRESS") # IN_PROGRESS, APPROVED, CONDITIONAL, REVERTED, REJECTED
    assigned_officer = Column(String(100), nullable=True)
    course_details = Column(Text, nullable=True)
    deficiency_reason = Column(String(200), nullable=True)
    deficiency_note = Column(Text, nullable=True)
    resubmission_count = Column(Integer, default=0)
    decision = Column(String(50), nullable=True)
    days_in_stage = Column(Integer, default=0)
    is_breached = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    stage_entered_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    institution = relationship("Institution", back_populates="applications")
    stage_events = relationship("StageEvent", back_populates="application")
    evc_visits = relationship("EvcVisit", back_populates="application")
    undertakings = relationship("Undertaking", back_populates="application")

class StageEvent(Base):
    __tablename__ = "stage_events"

    id = Column(String(50), primary_key=True, index=True)
    application_id = Column(String(50), ForeignKey("applications.id"), nullable=False)
    actor_role = Column(String(50), nullable=False)
    actor_name = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    from_stage = Column(String(50), nullable=True)
    to_stage = Column(String(50), nullable=True)
    reason = Column(String(200), nullable=True)
    note = Column(Text, nullable=True)
    attachment_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="stage_events")

class EvcVisit(Base):
    __tablename__ = "evc_visits"

    id = Column(String(50), primary_key=True, index=True) # EVC-XXXX
    application_id = Column(String(50), ForeignKey("applications.id"), nullable=False)
    ref_no = Column(String(50), nullable=False)
    institution_name = Column(String(200), nullable=False)
    region = Column(String(100), nullable=False)
    status = Column(String(50), default="QUEUED") # QUEUED, SCHEDULED, COMPLETED, CANCELLED
    urgency_window_days = Column(Integer, default=30)
    scheduled_date = Column(DateTime, nullable=True)
    convener = Column(String(150), nullable=True)
    members = Column(JSON, default=list) # List of member names
    mode = Column(String(50), default="PHYSICAL") # PHYSICAL, HYBRID
    observations = Column(Text, nullable=True)
    report_url = Column(String(255), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="evc_visits")

class Undertaking(Base):
    __tablename__ = "undertakings"

    id = Column(String(50), primary_key=True, index=True) # UT-2026-XXX
    application_id = Column(String(50), ForeignKey("applications.id"), nullable=False)
    ref_no = Column(String(50), nullable=False)
    institution_name = Column(String(200), nullable=False)
    condition_text = Column(Text, nullable=False)
    evidence_required = Column(Text, nullable=False)
    imposed_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="OPEN") # OPEN, SUBMITTED, VERIFIED, REJECTED, OVERDUE, ESCALATED
    escalation_level = Column(Integer, default=1) # 1=Institution, 2=Regional Officer, 3=Bureau Officer, 4=Member Secretary
    evidence_url = Column(String(255), nullable=True)
    evidence_note = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="undertakings")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(50), primary_key=True, index=True) # DOC-XXX
    institution_id = Column(String(50), ForeignKey("institutions.id"), nullable=False)
    institution_name = Column(String(200), nullable=False)
    doc_type = Column(String(150), nullable=False)
    issuing_authority = Column(String(200), nullable=False)
    issued_on = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime, nullable=False)
    renewal_lead_days = Column(Integer, default=60)
    status = Column(String(50), default="ACTIVE") # ACTIVE, EXPIRING_SOON, EXPIRED, RENEWAL_SUBMITTED, RENEWED
    file_url = Column(String(255), nullable=True)
    renewal_file_url = Column(String(255), nullable=True)
    renewal_note = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="documents")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True, index=True) # NOTIF-XXX
    type = Column(String(50), nullable=False) # REMINDER, OVERDUE, ESCALATION, DOC_EXPIRY, EVC_DUE
    severity = Column(String(20), default="info") # info, warning, critical
    audience_role = Column(String(50), nullable=False)
    ref_type = Column(String(50), nullable=False)
    ref_id = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
