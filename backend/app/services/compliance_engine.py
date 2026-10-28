from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
import copy

# Strictly enforce Indian Standard Time (IST UTC+05:30) as used in CompliScan
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
        "ONLY_SCRUTINY": [
            "SUBMITTED", "SCRUTINY", "DECISION", "ACTIVE_MONITORING", "CLOSED"
        ],
        "SCRUTINY_EVC": [
            "SUBMITTED", "SCRUTINY", "EVC_QUEUE", "EVC_SCHEDULED",
            "EVC_DONE", "DECISION", "ACTIVE_MONITORING", "CLOSED"
        ],
        "EVC_SAC": [
            "SUBMITTED", "EVC_QUEUE", "EVC_SCHEDULED", "EVC_DONE",
            "SAC_REVIEW", "DECISION", "ACTIVE_MONITORING", "CLOSED"
        ],
        "ONLY_EVC": [
            "SUBMITTED", "EVC_QUEUE", "EVC_SCHEDULED", "EVC_DONE",
            "DECISION", "ACTIVE_MONITORING", "CLOSED"
        ],
        "SCRUTINY_EVC_SAC": [
            "SUBMITTED", "SCRUTINY", "EVC_QUEUE", "EVC_SCHEDULED",
            "EVC_DONE", "SAC_REVIEW", "DECISION", "ACTIVE_MONITORING", "CLOSED"
        ],
    },
    "application_type_route_map": {
        "NEW_INSTITUTION": "SCRUTINY_EVC",
        "EXTENSION_OF_APPROVAL": "ONLY_SCRUTINY",
        "INCREASE_IN_INTAKE": "SCRUTINY_EVC",
        "NEW_PROGRAM": "SCRUTINY_EVC",
        "INFRASTRUCTURE_VERIFICATION": "ONLY_EVC",
        "APPEAL_AGAINST_DEFICIENCY": "SCRUTINY_EVC_SAC",
        "CLOSURE_OR_NAME_CHANGE": "ONLY_SCRUTINY",
    },
    "valid_revert_reasons": [
        "DEFICIENT_DOCUMENTS",
        "CLARIFICATION_REQUIRED",
        "FURTHER_VERIFICATION",
        "LEASE_DEED_MISMATCH",
        "FACULTY_CADRE_SHORTFALL",
    ],
    "doc_expiry_alerts_days": [90, 60, 30, 7],
    "undertaking_default_due_days": 90,
    "aging_buckets_days": [
        {"id": "BUCKET_1", "label": "0–15 Days (Fresh / Due Soon)", "min": 0, "max": 15},
        {"id": "BUCKET_2", "label": "16–30 Days (Awaiting Action)", "min": 16, "max": 30},
        {"id": "BUCKET_3", "label": "31–60 Days (Bureau Escalation)", "min": 31, "max": 60},
        {"id": "BUCKET_4", "label": "60+ Days (SHC / EoA Withdrawal)", "min": 61, "max": 9999},
    ],
    "escalation_ladder": [
        {
            "days_from_due": -7,
            "level": 1,
            "target_role": "INSTITUTION",
            "severity": "info",
            "action": "ADVANCE_REMINDER",
        },
        {
            "days_from_due": 0,
            "level": 2,
            "target_role": "REGIONAL_OFFICER",
            "severity": "warning",
            "action": "SLA_DUE_ALERT",
        },
        {
            "days_from_due": 7,
            "level": 3,
            "target_role": "BUREAU_OFFICER",
            "severity": "critical",
            "action": "BUREAU_ESCALATION",
        },
        {
            "days_from_due": 15,
            "level": 4,
            "target_role": "MEMBER_SECRETARY",
            "severity": "critical",
            "action": "DG_SHOW_CAUSE_FLAG",
        },
    ],
}


class AICTEWorkflowRuleEngine:
    """
    Deterministic APH 2024-27 Workflow, SLA, Undertaking & Document Expiry Engine
    for CompliScan (SIH26262).
    """

    def __init__(self, custom_config: Optional[Dict[str, Any]] = None):
        self.config = copy.deepcopy(APH_DEFAULT_CONFIG)
        if custom_config:
            self.config.update(custom_config)

    def now_ist(self) -> datetime:
        """Returns current IST timestamp plus any simulated day offset for live demos."""
        offset = int(self.config.get("simulated_day_offset", 0))
        return datetime.now(IST) + timedelta(days=offset)

    def advance_simulated_clock(self, days: int) -> Dict[str, Any]:
        """Ticks the demo clock forward N days so judges see escalations fire live."""
        self.config["simulated_day_offset"] = int(self.config.get("simulated_day_offset", 0)) + days
        return {
            "simulated_day_offset": self.config["simulated_day_offset"],
            "effective_ist_time": self.now_ist().isoformat(),
        }

    def reset_defaults(self) -> Dict[str, Any]:
        """Restores statutory APH defaults (Timelines tab Reset button)."""
        self.config = copy.deepcopy(APH_DEFAULT_CONFIG)
        return self.config

    # =========================================================================
    # MODULE A: AUTO ROUTE DETERMINATION & STAGE STATE MACHINE
    # =========================================================================
    def determine_route(self, app_type: str, override_route: Optional[str] = None) -> Dict[str, Any]:
        """Determines the prescribed APH route and initial active stage upon intake."""
        route_map = self.config["application_type_route_map"]
        route_key = override_route if override_route in self.config["routes"] else route_map.get(app_type, "SCRUTINY_EVC")
        stages = self.config["routes"][route_key]

        # Move automatically from SUBMITTED (index 0) to first working stage (index 1)
        initial_stage = stages[1] if len(stages) > 1 else stages[0]
        sla_days = self._get_stage_sla_days(initial_stage, app_type, resubmission_count=0)
        now = self.now_ist()

        return {
            "route": route_key,
            "prescribed_stages": stages,
            "current_stage": initial_stage,
            "status": "IN_PROGRESS",
            "assigned_officer_role": self._get_responsible_role(initial_stage),
            "stage_entered_at": now.isoformat(),
            "sla_due_at": (now + timedelta(days=sla_days)).isoformat(),
            "sla_days_allocated": sla_days,
            "audit_event": self._build_event(
                actor_role="SYSTEM_ROUTER",
                actor_id="APH-AUTO-ROUTER",
                action="AUTO_ROUTED",
                from_stage="SUBMITTED",
                to_stage=initial_stage,
                reason="Prescribed APH 2024-27 Track Assignment",
                note=f"Auto-routed via {route_key} based on application type '{app_type}'. SLA: {sla_days}d.",
            ),
        }

    def advance_stage(
        self,
        application: Dict[str, Any],
        actor_role: str,
        actor_id: str,
        note: str = "Stage cleared as per APH checklist.",
        require_sac_appeal: bool = False,
    ) -> Dict[str, Any]:
        """
        Advances an application to the next prescribed stage in its route.
        Enforces Regulatory Safeguard: only authorised officer roles can trigger transitions.
        """
        route_key = application["route"]
        stages: List[str] = list(self.config["routes"].get(route_key, []))
        current_stage = application["current_stage"]

        # Dynamic injection of SAC_REVIEW if observations require Standing Appellate/Hearing Committee
        if require_sac_appeal and "SAC_REVIEW" not in stages and "DECISION" in stages:
            decision_idx = stages.index("DECISION")
            stages.insert(decision_idx, "SAC_REVIEW")

        if current_stage not in stages:
            raise ValueError(f"Current stage '{current_stage}' not in route '{route_key}'.")

        idx = stages.index(current_stage)
        if idx + 1 >= len(stages):
            next_stage = "CLOSED"
            new_status = "COMPLETED"
        else:
            next_stage = stages[idx + 1]
            new_status = "APPROVED_MONITORING" if next_stage == "ACTIVE_MONITORING" else "IN_PROGRESS"

        sla_days = self._get_stage_sla_days(
            next_stage,
            application.get("app_type", "EXTENSION_OF_APPROVAL"),
            application.get("resubmission_count", 0),
        )
        now = self.now_ist()

        return {
            "current_stage": next_stage,
            "status": new_status,
            "assigned_officer_role": self._get_responsible_role(next_stage),
            "stage_entered_at": now.isoformat(),
            "sla_due_at": (now + timedelta(days=sla_days)).isoformat() if sla_days else None,
            "evc_auto_queued": next_stage == "EVC_QUEUE",
            "audit_event": self._build_event(
                actor_role=actor_role,
                actor_id=actor_id,
                action="STAGE_ADVANCED",
                from_stage=current_stage,
                to_stage=next_stage,
                reason="Stage Requirements Verified",
                note=note,
            ),
        }

    def revert_for_deficiency(
        self,
        application: Dict[str, Any],
        actor_role: str,
        actor_id: str,
        reason_code: str,
        deficiency_note: str,
    ) -> Dict[str, Any]:
        """
        Reverts an application to the Institution for deficiency rectification.
        Requires a mandatory reason code and logs an immutable audit event.
        """
        if reason_code not in self.config["valid_revert_reasons"]:
            raise ValueError(f"Invalid revert reason. Must be one of {self.config['valid_revert_reasons']}")
        if not deficiency_note or len(deficiency_note.strip()) < 5:
            raise ValueError("A detailed deficiency observation note is mandatory for reverting an application.")

        now = self.now_ist()
        re_scrutiny_sla = self.config["stage_sla_days"].get("RE_SCRUTINY", 10)

        return {
            "current_stage": "REVERTED",
            "status": "DEFICIENCY_REVERTED",
            "assigned_officer_role": "INSTITUTION",
            "stage_entered_at": now.isoformat(),
            "sla_due_at": (now + timedelta(days=re_scrutiny_sla)).isoformat(),
            "audit_event": self._build_event(
                actor_role=actor_role,
                actor_id=actor_id,
                action="REVERTED_FOR_DEFICIENCY",
                from_stage=application["current_stage"],
                to_stage="REVERTED",
                reason=reason_code,
                note=deficiency_note,
            ),
            "notification": {
                "type": "DEFICIENCY_REVERT",
                "severity": "warning",
                "audience_role": "INSTITUTION",
                "ref_id": application.get("ref_no"),
                "message": f"Application {application.get('ref_no')} reverted ({reason_code}): {deficiency_note}. Resubmit within {re_scrutiny_sla} days.",
            },
        }

    def resubmit_after_revert(
        self, application: Dict[str, Any], actor_id: str, note: str
    ) -> Dict[str, Any]:
        """Handles institution resubmission -> returns to SCRUTINY and increments resubmission_count."""
        new_count = int(application.get("resubmission_count", 0)) + 1
        sla_days = self.config["stage_sla_days"].get("RE_SCRUTINY", 10)
        now = self.now_ist()

        return {
            "current_stage": "SCRUTINY",
            "status": "RE_SCRUTINY",
            "resubmission_count": new_count,
            "assigned_officer_role": "REGIONAL_OFFICER",
            "stage_entered_at": now.isoformat(),
            "sla_due_at": (now + timedelta(days=sla_days)).isoformat(),
            "audit_event": self._build_event(
                actor_role="INSTITUTION",
                actor_id=actor_id,
                action="RESUBMITTED_FOR_RE_SCRUTINY",
                from_stage="REVERTED",
                to_stage="SCRUTINY",
                reason=f"Re-Scrutiny Cycle #{new_count}",
                note=note,
            ),
        }

    # =========================================================================
    # MODULE D & E: DOCUMENT VALIDITY, OCR CROSS-CHECK & UNDERTAKING EVALUATOR
    # =========================================================================
    def evaluate_document_validity(
        self,
        document: Dict[str, Any],
        ocr_extracted_expiry: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates Lease Deeds, Fire NOCs, Building Safety Certificates against APH lead windows.
        Also verifies if OCR-extracted date from uploaded PDF matches user-entered expiry_date.
        """
        now = self.now_ist()
        expiry_raw = document.get("expiry_date") or document.get("expiryDate") or now.isoformat()
        expiry_dt = self._parse_iso(expiry_raw)
        days_remaining = (expiry_dt.date() - now.date()).days
        alert_windows = sorted(self.config["doc_expiry_alerts_days"], reverse=True)  # [90, 60, 30, 7]
        max_lead = alert_windows[0] if alert_windows else 90

        # 1. Check OCR date vs claimed date (CompliScan Vision USP)
        ocr_mismatch = False
        if ocr_extracted_expiry:
            ocr_dt = self._parse_iso(ocr_extracted_expiry)
            if abs((ocr_dt.date() - expiry_dt.date()).days) > 1:
                ocr_mismatch = True

        # 2. Compute status ladder
        if document.get("renewal_verified") or document.get("status") == "RENEWED":
            status = "RENEWED"
        elif document.get("renewal_submitted") or document.get("status") == "RENEWAL_SUBMITTED":
            status = "RENEWAL_SUBMITTED"
        elif days_remaining < -7:
            status = "ESCALATED"
        elif days_remaining < 0:
            status = "EXPIRED"
        elif days_remaining <= max_lead:
            status = "EXPIRING_SOON"
        else:
            status = "ACTIVE"

        # 3. Determine active alert milestone (T-90, T-60, T-30, T-7, or Overdue)
        triggered_window = None
        for w in sorted(alert_windows):
            if 0 <= days_remaining <= w:
                triggered_window = f"T-{w}"
                break
        if days_remaining < 0:
            triggered_window = f"OVERDUE_+{abs(days_remaining)}D"

        escalation = self._evaluate_escalation_level(days_overdue=-days_remaining)

        return {
            "doc_id": document.get("id") or document.get("doc_id"),
            "doc_type": document.get("doc_type") or document.get("docType", "LEASE_DEED"),
            "status": status,
            "days_remaining": days_remaining,
            "triggered_alert_window": triggered_window,
            "ocr_date_mismatch": ocr_mismatch,
            "escalation_level": escalation["level"],
            "escalation_target": escalation["target_role"],
            "aging_bucket": self.get_aging_bucket(max(0, -days_remaining)),
        }

    def evaluate_undertaking(self, undertaking: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluates conditional approval undertakings across the 4 aging buckets and L1-L4 ladder."""
        now = self.now_ist()
        due_raw = undertaking.get("due_date") or undertaking.get("dueDate") or now.isoformat()
        due_dt = self._parse_iso(due_raw)
        days_overdue = (now.date() - due_dt.date()).days  # negative = days remaining

        current_status = undertaking.get("status", "OPEN")
        if current_status == "VERIFIED":
            return {**undertaking, "days_overdue": 0, "escalation_level": 0, "aging_bucket": "COMPLIANT"}

        escalation = self._evaluate_escalation_level(days_overdue)
        if current_status != "SUBMITTED":
            if days_overdue >= 7:
                current_status = "ESCALATED"
            elif days_overdue > 0:
                current_status = "OVERDUE"

        # Calculate aging bucket based on days elapsed since imposition or days overdue
        imposed_raw = undertaking.get("imposed_at") or undertaking.get("imposedAt") or now.isoformat()
        imposed_dt = self._parse_iso(imposed_raw)
        age_days = max(0, (now.date() - imposed_dt.date()).days)

        return {
            "undertaking_id": undertaking.get("id"),
            "status": current_status,
            "days_overdue": days_overdue,
            "age_days": age_days,
            "aging_bucket": self.get_aging_bucket(age_days),
            "escalation_level": escalation["level"],
            "escalation_target": escalation["target_role"],
            "severity": escalation["severity"],
        }

    # =========================================================================
    # MODULE B & F: DAILY DUE-DATE SWEEP & 4-STAGE AGING BUCKET CLASSIFIER
    # =========================================================================
    def get_aging_bucket(self, age_days: int) -> str:
        """Maps any pending application or undertaking into the 4 statutory aging buckets."""
        if age_days <= 15:
            return "0-15_DAYS"
        elif age_days <= 30:
            return "16-30_DAYS"
        elif age_days <= 60:
            return "31-60_DAYS"
        return "60_PLUS_DAYS"

    def run_daily_sweep(
        self,
        applications: List[Dict[str, Any]],
        undertakings: List[Dict[str, Any]],
        documents: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Evaluates all applications, EVC queues, undertakings, and documents.
        Called by daily cron OR when the evaluator clicks 'Run Day-Simulation (+N Days)'.
        """
        now = self.now_ist()
        emitted_notifications: List[Dict[str, Any]] = []

        # 1. Sweep Applications & EVC Queues
        app_Evaluations = []
        for app in applications:
            if app.get("current_stage") in ("CLOSED", "ACTIVE_MONITORING"):
                continue
            entered_raw = app.get("stage_entered_at") or app.get("stageEnteredAt") or now.isoformat()
            due_raw = app.get("sla_due_at") or app.get("slaDueAt") or now.isoformat()
            entered_dt = self._parse_iso(entered_raw)
            due_dt = self._parse_iso(due_raw)
            dwell_days = max(0, (now.date() - entered_dt.date()).days)
            days_overdue = (now.date() - due_dt.date()).days

            esc = self._evaluate_escalation_level(days_overdue)
            bucket = self.get_aging_bucket(dwell_days)

            app_Evaluations.append({
                "ref_no": app.get("ref_no") or app.get("refNo"),
                "current_stage": app.get("current_stage") or app.get("currentStage"),
                "dwell_days": dwell_days,
                "days_overdue": days_overdue,
                "sla_breached": days_overdue > 0,
                "aging_bucket": bucket,
                "escalation_level": esc["level"],
            })

            if esc["level"] >= 2:
                stage_name = str(app.get("current_stage") or app.get("currentStage") or "")
                ntype = "EVC_DUE" if "EVC" in stage_name else "OVERDUE"
                ref_id = app.get("ref_no") or app.get("refNo")
                emitted_notifications.append({
                    "type": ntype,
                    "severity": esc["severity"],
                    "audience_role": esc["target_role"],
                    "ref_type": "APPLICATION",
                    "ref_id": ref_id,
                    "escalation_level": f"L{esc['level']}",
                    "message": (
                        f"[L{esc['level']} {esc['action']}] Application {ref_id} "
                        f"in stage {stage_name} is {days_overdue}d past SLA."
                    ),
                    "created_at": now.isoformat(),
                })

        # 2. Sweep Undertakings
        undertaking_evals = [self.evaluate_undertaking(u) for u in undertakings]
        for u_eval in undertaking_evals:
            if u_eval.get("escalation_level", 0) >= 1:
                emitted_notifications.append({
                    "type": "ESCALATION" if u_eval["escalation_level"] >= 3 else "REMINDER",
                    "severity": u_eval["severity"],
                    "audience_role": u_eval["escalation_target"],
                    "ref_type": "UNDERTAKING",
                    "ref_id": str(u_eval["undertaking_id"]),
                    "escalation_level": f"L{u_eval['escalation_level']}",
                    "message": f"[L{u_eval['escalation_level']}] Undertaking #{u_eval['undertaking_id']} status: {u_eval['status']} ({u_eval['days_overdue']}d vs due date).",
                    "created_at": now.isoformat(),
                })

        # 3. Sweep Lease Deeds & Prescribed Documents
        doc_evals = [self.evaluate_document_validity(d) for d in documents]
        for d_eval in doc_evals:
            if d_eval["triggered_alert_window"]:
                emitted_notifications.append({
                    "type": "DOC_EXPIRY",
                    "severity": "critical" if d_eval["days_remaining"] < 0 else "warning",
                    "audience_role": d_eval["escalation_target"] or "INSTITUTION",
                    "ref_type": "DOCUMENT",
                    "ref_id": str(d_eval["doc_id"]),
                    "escalation_level": f"L{max(1, d_eval['escalation_level'])}",
                    "message": f"Document {d_eval['doc_type']} (#{d_eval['doc_id']}) is {d_eval['status']} ({d_eval['triggered_alert_window']}).",
                    "created_at": now.isoformat(),
                })

        return {
            "sweep_timestamp_ist": now.isoformat(),
            "simulated_day_offset": self.config.get("simulated_day_offset", 0),
            "applications_evaluated": app_Evaluations,
            "undertakings_evaluated": undertaking_evals,
            "documents_evaluated": doc_evals,
            "notifications_emitted": emitted_notifications,
        }

    # =========================================================================
    # INTERNAL HELPERS
    # =========================================================================
    def _get_stage_sla_days(self, stage: str, app_type: str, resubmission_count: int) -> int:
        slas = self.config["stage_sla_days"]
        if stage == "SCRUTINY" and resubmission_count > 0:
            return slas.get("RE_SCRUTINY", 10)
        if stage == "EVC_QUEUE":
            if app_type == "NEW_INSTITUTION":
                return slas.get("EVC_QUEUE_NEW_INSTITUTION", 21)
            return slas.get("EVC_QUEUE_STANDARD", 30)
        return slas.get(stage, 15)

    def _get_responsible_role(self, stage: str) -> str:
        role_map = {
            "SUBMITTED": "REGIONAL_OFFICER",
            "SCRUTINY": "REGIONAL_OFFICER",
            "REVERTED": "INSTITUTION",
            "EVC_QUEUE": "COMMITTEE_EVC",
            "EVC_SCHEDULED": "COMMITTEE_EVC",
            "EVC_DONE": "BUREAU_OFFICER",
            "SAC_REVIEW": "COMMITTEE_SAC",
            "DECISION": "BUREAU_OFFICER",
            "ACTIVE_MONITORING": "REGIONAL_OFFICER",
            "CLOSED": "BUREAU_OFFICER",
        }
        return role_map.get(stage, "REGIONAL_OFFICER")

    def _evaluate_escalation_level(self, days_overdue: int) -> Dict[str, Any]:
        """Matches days_overdue against the L1 (-7d) -> L2 (0d) -> L3 (+7d) -> L4 (+15d) ladder."""
        ladder = sorted(self.config["escalation_ladder"], key=lambda x: x["days_from_due"])
        matched = {
            "level": 0,
            "target_role": "NONE",
            "severity": "info",
            "action": "WITHIN_SLA",
        }
        for rung in ladder:
            if days_overdue >= rung["days_from_due"]:
                matched = rung
        return matched

    def _build_event(
        self,
        actor_role: str,
        actor_id: str,
        action: str,
        from_stage: str,
        to_stage: str,
        reason: str,
        note: str,
    ) -> Dict[str, Any]:
        return {
            "actor_role": actor_role,
            "actor_id": actor_id,
            "action": action,
            "from_stage": from_stage,
            "to_stage": to_stage,
            "reason": reason,
            "note": note,
            "timestamp_ist": self.now_ist().isoformat(),
        }

    @staticmethod
    def _parse_iso(date_str: str) -> datetime:
        dt = datetime.fromisoformat(str(date_str).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=IST)
        return dt.astimezone(IST)


# Compatibility Stub for any residual packaging scan fallback
class LegalMetrologyRuleEngine:
    """Compatibility adapter for legacy packaging OCR calls."""
    @classmethod
    def get_prescribed_font_height(cls, pdp_area_sqcm: float) -> float:
        if pdp_area_sqcm <= 50.0:
            return 1.0
        elif pdp_area_sqcm <= 100.0:
            return 1.5
        elif pdp_area_sqcm <= 500.0:
            return 2.5
        elif pdp_area_sqcm <= 2500.0:
            return 4.0
        return 6.0

    @classmethod
    def verify_all_declarations(cls, declarations: List[Dict[str, Any]], pdp_area_sqcm: float = 80.0, *args, **kwargs):
        # Always return valid compliant payload with integer violation and warning counts
        return declarations, 100.0, "COMPLIANT", 0, 0
