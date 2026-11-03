"""CompliScan SIH 26262 application workflow and compliance rule engine."""

from __future__ import annotations

import copy
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

IST = timezone(timedelta(hours=5, minutes=30))

APH_DEFAULT_CONFIG: Dict[str, Any] = {
    "rule_version": "APH-2024-2027-v1.0",
    "protected": True,
    "simulated_day_offset": 0,
    "stage_sla_days": {
        "SCRUTINY": 15,
        "RE_SCRUTINY": 10,
        "EVC_QUEUE_STANDARD": 30,
        "EVC_QUEUE_NEW_INSTITUTION": 21,
        "EVC_SCHEDULED": 14,
        "SAC_REVIEW": 30,
        "DECISION": 7,
    },
    "routes": {
        "ONLY_SCRUTINY": ["SUBMITTED", "SCRUTINY", "DECISION", "ACTIVE_MONITORING", "CLOSED"],
        "SCRUTINY_EVC": ["SUBMITTED", "SCRUTINY", "EVC_QUEUE", "EVC_SCHEDULED", "EVC_DONE", "DECISION", "ACTIVE_MONITORING", "CLOSED"],
        "EVC_SAC": ["SUBMITTED", "EVC_QUEUE", "EVC_SCHEDULED", "EVC_DONE", "SAC_REVIEW", "DECISION", "ACTIVE_MONITORING", "CLOSED"],
        "ONLY_EVC": ["SUBMITTED", "EVC_QUEUE", "EVC_SCHEDULED", "EVC_DONE", "DECISION", "ACTIVE_MONITORING", "CLOSED"],
        "SCRUTINY_EVC_SAC": ["SUBMITTED", "SCRUTINY", "EVC_QUEUE", "EVC_SCHEDULED", "EVC_DONE", "SAC_REVIEW", "DECISION", "ACTIVE_MONITORING", "CLOSED"],
    },
    "application_type_route_map": {
        "NEW_INSTITUTION": "SCRUTINY_EVC_SAC",
        "EXTENSION_OF_APPROVAL": "ONLY_SCRUTINY",
        "INCREASE_IN_INTAKE": "SCRUTINY_EVC",
        "NEW_PROGRAM": "SCRUTINY_EVC",
        "NEW_COURSE_OR_INTAKE": "SCRUTINY_EVC",
        "INFRASTRUCTURE_VERIFICATION": "ONLY_EVC",
        "APPEAL_AGAINST_DEFICIENCY": "SCRUTINY_EVC_SAC",
        "CLOSURE_OR_MERGER": "EVC_SAC",
        "CLOSURE_OR_NAME_CHANGE": "ONLY_SCRUTINY",
    },
    "valid_revert_reasons": ["DEFICIENT_DOCUMENTS", "CLARIFICATION_REQUIRED", "FURTHER_VERIFICATION", "LEASE_DEED_MISMATCH", "FACULTY_CADRE_SHORTFALL"],
    "doc_expiry_alerts_days": [90, 60, 30, 7],
    "undertaking_default_due_days": 90,
    "aging_buckets_days": [
        {"id": "BUCKET_1", "label": "0–15 Days (Fresh / Due Soon)", "min": 0, "max": 15},
        {"id": "BUCKET_2", "label": "16–30 Days (Awaiting Action)", "min": 16, "max": 30},
        {"id": "BUCKET_3", "label": "31–60 Days (Bureau Escalation)", "min": 31, "max": 60},
        {"id": "BUCKET_4", "label": "60+ Days (Critical / Revocation Risk)", "min": 61, "max": 9999},
    ],
    "escalation_ladder": [
        {"days_from_due": -7, "level": 1, "target_role": "INSTITUTION", "severity": "info", "action": "ADVANCE_REMINDER"},
        {"days_from_due": 0, "level": 2, "target_role": "REGIONAL_OFFICER", "severity": "warning", "action": "SLA_DUE_ALERT"},
        {"days_from_due": 7, "level": 3, "target_role": "BUREAU_OFFICER", "severity": "critical", "action": "BUREAU_ESCALATION"},
        {"days_from_due": 15, "level": 4, "target_role": "MEMBER_SECRETARY", "severity": "critical", "action": "DG_SHOW_CAUSE_FLAG"},
    ],
}


class AICTEWorkflowRuleEngine:
    """Deterministic APH workflow, document validity, and daily compliance checker."""

    def __init__(self, custom_config: Optional[Dict[str, Any]] = None):
        self.config = copy.deepcopy(APH_DEFAULT_CONFIG)
        if custom_config:
            self._merge(self.config, custom_config)

    @staticmethod
    def _merge(target: Dict[str, Any], source: Dict[str, Any]) -> None:
        for key, value in source.items():
            if isinstance(value, dict) and isinstance(target.get(key), dict):
                AICTEWorkflowRuleEngine._merge(target[key], value)
            else:
                target[key] = value

    def now_ist(self) -> datetime:
        return datetime.now(IST) + timedelta(days=int(self.config.get("simulated_day_offset", 0)))

    def advance_simulated_clock(self, days: int) -> Dict[str, Any]:
        if days < 0:
            raise ValueError("The simulated clock cannot move backwards.")
        self.config["simulated_day_offset"] = int(self.config.get("simulated_day_offset", 0)) + days
        return {"simulated_day_offset": self.config["simulated_day_offset"], "effective_ist_time": self.now_ist().isoformat()}

    def reset_defaults(self) -> Dict[str, Any]:
        self.config = copy.deepcopy(APH_DEFAULT_CONFIG)
        return self.config

    def determine_route(self, app_type: str, override_route: Optional[str] = None) -> Dict[str, Any]:
        route = override_route if override_route in self.config["routes"] else self.config["application_type_route_map"].get(app_type, "SCRUTINY_EVC")
        stages = self.config["routes"][route]
        stage = stages[1] if len(stages) > 1 else stages[0]
        now = self.now_ist()
        sla = self._stage_sla(stage, app_type)
        return {
            "route": route,
            "prescribed_stages": stages,
            "current_stage": stage,
            "status": "IN_PROGRESS",
            "assigned_officer_role": self._responsible_role(stage),
            "stage_entered_at": now.isoformat(),
            "sla_due_at": (now + timedelta(days=sla)).isoformat(),
            "sla_days_allocated": sla,
            "audit_event": self._event("SYSTEM_ROUTER", "APH-AUTO-ROUTER", "AUTO_ROUTED", "SUBMITTED", stage, "APH route assignment", f"Routed to {route}; SLA {sla} days."),
        }

    def advance_stage(self, application: Dict[str, Any], actor_role: str, actor_id: str, note: str = "Stage requirements verified.", require_sac_appeal: bool = False) -> Dict[str, Any]:
        route = application["route"]
        stages = list(self.config["routes"].get(route, []))
        if require_sac_appeal and "SAC_REVIEW" not in stages and "DECISION" in stages:
            stages.insert(stages.index("DECISION"), "SAC_REVIEW")
        current = application["current_stage"]
        if current not in stages:
            raise ValueError(f"Current stage {current!r} is not in route {route!r}.")
        index = stages.index(current)
        next_stage = stages[index + 1] if index + 1 < len(stages) else "CLOSED"
        status = "COMPLETED" if next_stage == "CLOSED" else ("APPROVED_MONITORING" if next_stage == "ACTIVE_MONITORING" else "IN_PROGRESS")
        now = self.now_ist()
        sla = self._stage_sla(next_stage, application.get("app_type", ""))
        return {
            "current_stage": next_stage,
            "status": status,
            "assigned_officer_role": self._responsible_role(next_stage),
            "stage_entered_at": now.isoformat(),
            "sla_due_at": (now + timedelta(days=sla)).isoformat() if sla else None,
            "evc_auto_queued": next_stage == "EVC_QUEUE",
            "audit_event": self._event(actor_role, actor_id, "STAGE_ADVANCED", current, next_stage, "Stage requirements verified", note),
        }

    def revert_for_deficiency(self, application: Dict[str, Any], actor_role: str, actor_id: str, reason_code: str, deficiency_note: str) -> Dict[str, Any]:
        if reason_code not in self.config["valid_revert_reasons"]:
            raise ValueError(f"Invalid deficiency reason code: {reason_code}")
        if not deficiency_note or len(deficiency_note.strip()) < 5:
            raise ValueError("A detailed deficiency observation note is mandatory.")
        now = self.now_ist()
        days = int(self.config["stage_sla_days"].get("RE_SCRUTINY", 10))
        ref = application.get("ref_no")
        return {
            "current_stage": "REVERTED", "status": "DEFICIENCY_REVERTED", "assigned_officer_role": "INSTITUTION",
            "stage_entered_at": now.isoformat(), "sla_due_at": (now + timedelta(days=days)).isoformat(),
            "audit_event": self._event(actor_role, actor_id, "REVERTED_FOR_DEFICIENCY", application.get("current_stage", ""), "REVERTED", reason_code, deficiency_note),
            "notification": {"type": "DEFICIENCY_REVERT", "severity": "warning", "audience_role": "INSTITUTION", "ref_id": ref, "message": f"Application {ref} returned for {reason_code}: {deficiency_note}"},
        }

    def resubmit_after_revert(self, application: Dict[str, Any], actor_id: str, note: str) -> Dict[str, Any]:
        count = int(application.get("resubmission_count", 0)) + 1
        now = self.now_ist()
        days = int(self.config["stage_sla_days"].get("RE_SCRUTINY", 10))
        return {"current_stage": "SCRUTINY", "status": "RE_SCRUTINY", "resubmission_count": count, "assigned_officer_role": "REGIONAL_OFFICER", "stage_entered_at": now.isoformat(), "sla_due_at": (now + timedelta(days=days)).isoformat(), "audit_event": self._event("INSTITUTION", actor_id, "RESUBMITTED_FOR_RE_SCRUTINY", "REVERTED", "SCRUTINY", f"Resubmission {count}", note)}

    def get_aging_bucket(self, age_days: int) -> str:
        if age_days <= 15:
            return "0-15_DAYS"
        if age_days <= 30:
            return "16-30_DAYS"
        if age_days <= 60:
            return "31-60_DAYS"
        return "60_PLUS_DAYS"

    def evaluate_document_validity(self, document: Dict[str, Any], ocr_extracted_expiry: Optional[str] = None) -> Dict[str, Any]:
        now = self.now_ist()
        expiry = self._parse_iso(document.get("expiry_date") or document.get("expiryDate") or now.isoformat())
        remaining = (expiry.date() - now.date()).days
        windows = sorted(self.config["doc_expiry_alerts_days"])
        alert = next((f"T-{window}" for window in windows if 0 <= remaining <= window), None)
        if remaining < 0:
            alert = f"OVERDUE_+{abs(remaining)}D"
        mismatch = bool(ocr_extracted_expiry and abs((self._parse_iso(ocr_extracted_expiry).date() - expiry.date()).days) > 1)
        if document.get("renewal_verified") or document.get("status") == "RENEWED":
            status = "RENEWED"
        elif document.get("renewal_submitted") or document.get("status") == "RENEWAL_SUBMITTED":
            status = "RENEWAL_SUBMITTED"
        elif remaining < -7:
            status = "ESCALATED"
        elif remaining < 0:
            status = "EXPIRED"
        elif alert:
            status = "EXPIRING_SOON"
        else:
            status = "ACTIVE"
        escalation = self._escalation(-remaining)
        return {"doc_id": document.get("id") or document.get("doc_id"), "doc_type": document.get("doc_type") or document.get("docType", "INSTITUTIONAL_DOCUMENT"), "status": status, "days_remaining": remaining, "triggered_alert_window": alert, "ocr_date_mismatch": mismatch, "escalation_level": escalation["level"], "escalation_target": escalation["target_role"], "aging_bucket": self.get_aging_bucket(max(0, -remaining))}

    def evaluate_undertaking(self, undertaking: Dict[str, Any]) -> Dict[str, Any]:
        now = self.now_ist()
        due = self._parse_iso(undertaking.get("due_date") or undertaking.get("dueDate") or now.isoformat())
        overdue = (now.date() - due.date()).days
        status = undertaking.get("status", "OPEN")
        if status == "VERIFIED":
            return {**undertaking, "days_overdue": 0, "escalation_level": 0, "aging_bucket": "COMPLIANT", "severity": "info", "escalation_target": "NONE"}
        escalation = self._escalation(overdue)
        if status != "SUBMITTED":
            if overdue >= 7:
                status = "ESCALATED"
            elif overdue > 0:
                status = "OVERDUE"
        imposed = self._parse_iso(undertaking.get("imposed_at") or undertaking.get("imposedAt") or now.isoformat())
        age = max(0, (now.date() - imposed.date()).days)
        return {"undertaking_id": undertaking.get("id"), "status": status, "days_overdue": overdue, "age_days": age, "aging_bucket": self.get_aging_bucket(age), "escalation_level": escalation["level"], "escalation_target": escalation["target_role"], "severity": escalation["severity"]}

    def run_daily_sweep(self, applications: List[Dict[str, Any]], undertakings: List[Dict[str, Any]], documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        now = self.now_ist()
        notices: List[Dict[str, Any]] = []
        app_results = []
        for app in applications:
            if app.get("current_stage") in ("CLOSED", "ACTIVE_MONITORING"):
                continue
            entered = self._parse_iso(app.get("stage_entered_at") or app.get("stageEnteredAt") or now.isoformat())
            due = self._parse_iso(app.get("sla_due_at") or app.get("slaDueAt") or now.isoformat())
            dwell = max(0, (now.date() - entered.date()).days)
            overdue = (now.date() - due.date()).days
            escalation = self._escalation(overdue)
            ref = app.get("ref_no") or app.get("refNo")
            stage = app.get("current_stage") or app.get("currentStage")
            app_results.append({"ref_no": ref, "current_stage": stage, "dwell_days": dwell, "days_overdue": overdue, "sla_breached": overdue > 0, "aging_bucket": self.get_aging_bucket(dwell), "escalation_level": escalation["level"]})
            if escalation["level"] >= 2:
                notices.append({"type": "EVC_DUE" if "EVC" in str(stage) else "OVERDUE", "severity": escalation["severity"], "audience_role": escalation["target_role"], "ref_type": "APPLICATION", "ref_id": ref, "escalation_level": f"L{escalation['level']}", "message": f"[L{escalation['level']}] Application {ref} in {stage} is {overdue} day(s) past SLA.", "created_at": now.isoformat()})
        undertaking_results = [self.evaluate_undertaking(item) for item in undertakings]
        for item in undertaking_results:
            if item.get("escalation_level", 0) >= 1:
                notices.append({"type": "ESCALATION" if item["escalation_level"] >= 3 else "REMINDER", "severity": item["severity"], "audience_role": item["escalation_target"], "ref_type": "UNDERTAKING", "ref_id": str(item.get("undertaking_id")), "escalation_level": f"L{item['escalation_level']}", "message": f"[L{item['escalation_level']}] Undertaking {item.get('undertaking_id')} is {item['days_overdue']} day(s) past due.", "created_at": now.isoformat()})
        document_results = [self.evaluate_document_validity(item) for item in documents]
        for item in document_results:
            if item.get("triggered_alert_window"):
                notices.append({"type": "DOC_EXPIRY", "severity": "critical" if item["days_remaining"] < 0 else "warning", "audience_role": item["escalation_target"] or "INSTITUTION", "ref_type": "DOCUMENT", "ref_id": str(item.get("doc_id")), "escalation_level": f"L{max(1, item['escalation_level'])}", "message": f"Institution document {item['doc_type']} is {item['status']} ({item['triggered_alert_window']}).", "created_at": now.isoformat()})
        return {"sweep_timestamp_ist": now.isoformat(), "simulated_day_offset": self.config.get("simulated_day_offset", 0), "applications_evaluated": app_results, "undertakings_evaluated": undertaking_results, "documents_evaluated": document_results, "notifications_emitted": notices}

    def _stage_sla(self, stage: str, app_type: str) -> int:
        slas = self.config["stage_sla_days"]
        key = stage.upper()
        if key in ("REVERTED", "RE_SCRUTINY"):
            return int(slas.get("RE_SCRUTINY", 10))
        if key == "EVC_QUEUE":
            return int(slas.get("EVC_QUEUE_NEW_INSTITUTION", 21) if app_type == "NEW_INSTITUTION" else slas.get("EVC_QUEUE_STANDARD", 30))
        return int(slas.get(key, 0))

    @staticmethod
    def _responsible_role(stage: str) -> str:
        return {"SUBMITTED": "REGIONAL_OFFICER", "SCRUTINY": "REGIONAL_OFFICER", "REVERTED": "INSTITUTION", "EVC_QUEUE": "COMMITTEE_EVC", "EVC_SCHEDULED": "COMMITTEE_EVC", "EVC_DONE": "BUREAU_OFFICER", "SAC_REVIEW": "COMMITTEE_SAC", "DECISION": "BUREAU_OFFICER", "ACTIVE_MONITORING": "REGIONAL_OFFICER", "CLOSED": "BUREAU_OFFICER"}.get(stage, "REGIONAL_OFFICER")

    def _escalation(self, days_overdue: int) -> Dict[str, Any]:
        matched = {"level": 0, "target_role": "NONE", "severity": "info", "action": "WITHIN_SLA"}
        for rung in sorted(self.config["escalation_ladder"], key=lambda entry: entry["days_from_due"]):
            if days_overdue >= rung["days_from_due"]:
                matched = rung
        return matched

    def _event(self, actor_role: str, actor_id: str, action: str, from_stage: str, to_stage: str, reason: str, note: str) -> Dict[str, Any]:
        return {"actor_role": actor_role, "actor_id": actor_id, "action": action, "from_stage": from_stage, "to_stage": to_stage, "reason": reason, "note": note, "timestamp_ist": self.now_ist().isoformat()}

    @staticmethod
    def _parse_iso(value: str) -> datetime:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=IST)
        return parsed.astimezone(IST)
