"""Persistent daily compliance checks over AICTE workflow records."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session

from backend.app.models.aicte import Application, Document, Notification, Undertaking
from backend.app.services.compliance_engine import AICTEWorkflowRuleEngine
from backend.app.services.rule_config_store import get_rule_engine

IST = timezone(timedelta(hours=5, minutes=30))


def _as_date(value: Any) -> date:
    if isinstance(value, datetime):
        return value.date()
    return value


def _notify_once(db: Session, *, kind: str, audience: str, ref_type: str, ref_id: str, message: str, severity: str) -> bool:
    existing = db.query(Notification.id).filter(
        Notification.acknowledged.is_(False),
        Notification.type == kind,
        Notification.ref_type == ref_type,
        Notification.ref_id == ref_id,
    ).first()
    if existing:
        return False
    db.add(Notification(
        id=f"NOTIF-{uuid.uuid4().hex[:12]}", type=kind, severity=severity,
        audience_role=audience, ref_type=ref_type, ref_id=ref_id,
        message=message, acknowledged=False,
    ))
    return True


def run_daily_compliance_check(db: Session, *, today: date | None = None, engine: AICTEWorkflowRuleEngine | None = None) -> dict[str, Any]:
    """Update SLA/expiry state and create deduplicated notices; always flags human review."""
    today = today or datetime.now(IST).date()
    rule_engine = engine or get_rule_engine(db)
    created = {"application_sla_breaches": 0, "overdue_undertakings": 0, "expiring_documents": 0}
    updated = {"applications": 0, "undertakings": 0, "documents": 0}
    scanned = {"applications": 0, "undertakings": 0, "documents": 0}

    applications = db.query(Application).filter(Application.status.in_(["IN_PROGRESS", "RE_SCRUTINY"])).all()
    scanned["applications"] = len(applications)
    for app in applications:
        entered = _as_date(app.stage_entered_at or app.created_at)
        age = max(0, (today - entered).days)
        sla = rule_engine._stage_sla(app.current_stage or "", app.app_type or "")
        app.days_in_stage = age
        if sla and age > sla:
            if not app.is_breached:
                app.is_breached = True
                updated["applications"] += 1
            if _notify_once(db, kind="OVERDUE", audience="REGIONAL_OFFICER", ref_type="APPLICATION", ref_id=app.ref_no, severity="critical", message=f"Application {app.ref_no} is {age - sla} day(s) past its {sla}-day prototype SLA at stage {app.current_stage}. Human review is required."):
                created["application_sla_breaches"] += 1
        elif app.is_breached:
            app.is_breached = False
            updated["applications"] += 1

    undertakings = db.query(Undertaking).filter(Undertaking.status.in_(["OPEN", "SUBMITTED"])).all()
    scanned["undertakings"] = len(undertakings)
    for undertaking in undertakings:
        due = _as_date(undertaking.due_date)
        if due < today:
            undertaking.status = "OVERDUE"
            updated["undertakings"] += 1
            if _notify_once(db, kind="OVERDUE", audience="REGIONAL_OFFICER", ref_type="UNDERTAKING", ref_id=undertaking.id, severity="warning", message=f"Undertaking {undertaking.id} is overdue by {(today - due).days} day(s). Human review is required."):
                created["overdue_undertakings"] += 1

    documents = db.query(Document).filter(Document.status.notin_(["RENEWED", "RENEWAL_SUBMITTED"])).all()
    scanned["documents"] = len(documents)
    for document in documents:
        days_left = (_as_date(document.expiry_date) - today).days
        window = max(1, int(document.renewal_lead_days or 60))
        if days_left <= window:
            if days_left < 0:
                document.status = "EXPIRED"
            else:
                document.status = "EXPIRING_SOON"
            updated["documents"] += 1
            if _notify_once(db, kind="DOC_EXPIRY", audience="INSTITUTION", ref_type="DOCUMENT", ref_id=document.id, severity="critical" if days_left < 0 else "warning", message=f"Document {document.doc_type} for {document.institution_name} expires in {days_left} day(s). Human review is required."):
                created["expiring_documents"] += 1

    db.commit()
    return {"checked_at": datetime.now(IST).isoformat(), "counts": {"applications_scanned": scanned["applications"], "undertakings_scanned": scanned["undertakings"], "documents_scanned": scanned["documents"], "notifications_created": sum(created.values()), **created}, "updated": updated, "human_review_required": True, "assessment_type": "deterministic_prototype_compliance_check"}
