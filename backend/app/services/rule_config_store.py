"""Database-backed configuration used by API requests and scheduled checks."""

from __future__ import annotations

import copy
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from backend.app.models.governance import RuleConfiguration
from backend.app.services.compliance_engine import APH_DEFAULT_CONFIG, AICTEWorkflowRuleEngine

CONFIG_ID = "AICTE_APH_PROTOTYPE"


def _snapshot() -> dict[str, Any]:
    return copy.deepcopy(APH_DEFAULT_CONFIG)


def get_rule_configuration(db: Session) -> RuleConfiguration:
    # The Render cron imports this module without running FastAPI startup.
    RuleConfiguration.__table__.create(bind=db.get_bind(), checkfirst=True)
    record = db.get(RuleConfiguration, CONFIG_ID)
    if record is None:
        configuration = _snapshot()
        record = RuleConfiguration(
            id=CONFIG_ID,
            configuration=configuration,
            version=str(configuration["rule_version"]),
            updated_by="SYSTEM",
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    return record


def get_rule_engine(db: Session) -> AICTEWorkflowRuleEngine:
    return AICTEWorkflowRuleEngine(get_rule_configuration(db).configuration)


def save_rule_configuration(db: Session, configuration: dict[str, Any], *, updated_by: str = "CONFIG_ADMIN") -> RuleConfiguration:
    record = get_rule_configuration(db)
    record.configuration = copy.deepcopy(configuration)
    record.version = str(configuration.get("rule_version") or APH_DEFAULT_CONFIG["rule_version"])
    record.updated_by = updated_by
    record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record


def reset_rule_configuration(db: Session, *, updated_by: str = "CONFIG_ADMIN") -> RuleConfiguration:
    return save_rule_configuration(db, _snapshot(), updated_by=updated_by)
