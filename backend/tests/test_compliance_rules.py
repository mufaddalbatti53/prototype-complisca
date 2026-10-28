import pytest
from backend.app.services.compliance_engine import AICTEWorkflowRuleEngine, APH_DEFAULT_CONFIG

def test_engine_init_and_defaults():
    engine = AICTEWorkflowRuleEngine()
    assert engine.config["rule_version"] == "APH-2024-2027-v1.0"
    assert "ONLY_SCRUTINY" in engine.config["routes"]
    assert "SCRUTINY_EVC" in engine.config["routes"]
    assert engine.config["stage_sla_days"]["SCRUTINY"] == 15

def test_determine_route_new_institution():
    engine = AICTEWorkflowRuleEngine()
    routed = engine.determine_route("NEW_INSTITUTION")
    assert routed["route"] == "SCRUTINY_EVC"
    assert routed["current_stage"] == "SCRUTINY"
    assert routed["status"] == "IN_PROGRESS"
    assert routed["assigned_officer_role"] == "REGIONAL_OFFICER"
    assert routed["sla_days_allocated"] == 15
    assert routed["audit_event"]["action"] == "AUTO_ROUTED"

def test_determine_route_eoa():
    engine = AICTEWorkflowRuleEngine()
    routed = engine.determine_route("EXTENSION_OF_APPROVAL")
    assert routed["route"] == "ONLY_SCRUTINY"
    assert routed["current_stage"] == "SCRUTINY"

def test_advance_stage_scrutiny_to_evc():
    engine = AICTEWorkflowRuleEngine()
    app = {
        "route": "SCRUTINY_EVC",
        "current_stage": "SCRUTINY",
        "app_type": "NEW_INSTITUTION",
        "resubmission_count": 0
    }
    result = engine.advance_stage(app, actor_role="REGIONAL_OFFICER", actor_id="RO-WEST-01")
    assert result["current_stage"] == "EVC_QUEUE"
    assert result["evc_auto_queued"] is True
    assert result["assigned_officer_role"] == "COMMITTEE_EVC"
    assert result["audit_event"]["action"] == "STAGE_ADVANCED"

def test_revert_for_deficiency():
    engine = AICTEWorkflowRuleEngine()
    app = {
        "ref_no": "APH-2026-1041",
        "current_stage": "SCRUTINY",
        "route": "SCRUTINY_EVC"
    }
    revert_result = engine.revert_for_deficiency(
        app,
        actor_role="REGIONAL_OFFICER",
        actor_id="RO-WEST-01",
        reason_code="DEFICIENT_DOCUMENTS",
        deficiency_note="Land lease deed lacks municipal endorsement stamp."
    )
    assert revert_result["current_stage"] == "REVERTED"
    assert revert_result["status"] == "DEFICIENCY_REVERTED"
    assert revert_result["assigned_officer_role"] == "INSTITUTION"
    assert "DEFICIENT_DOCUMENTS" in revert_result["notification"]["message"]

def test_resubmit_after_revert():
    engine = AICTEWorkflowRuleEngine()
    app = {
        "current_stage": "REVERTED",
        "resubmission_count": 0
    }
    resubmit_result = engine.resubmit_after_revert(app, actor_id="INST-01", note="Uploaded registered MIDC lease.")
    assert resubmit_result["current_stage"] == "SCRUTINY"
    assert resubmit_result["resubmission_count"] == 1
    assert resubmit_result["assigned_officer_role"] == "REGIONAL_OFFICER"

def test_evaluate_document_validity():
    engine = AICTEWorkflowRuleEngine()
    doc_active = {
        "id": "DOC-101",
        "doc_type": "LEASE_DEED",
        "expiry_date": "2038-04-11"
    }
    eval_active = engine.evaluate_document_validity(doc_active)
    assert eval_active["status"] == "ACTIVE"
    assert eval_active["days_remaining"] > 3000

    doc_expiring_soon = {
        "id": "DOC-102",
        "doc_type": "FIRE_NOC",
        "expiry_date": "2026-11-15"
    }
    eval_expiring = engine.evaluate_document_validity(doc_expiring_soon)
    assert eval_expiring["status"] in ("EXPIRING_SOON", "ACTIVE")

def test_evaluate_undertaking_and_escalation():
    engine = AICTEWorkflowRuleEngine()
    ut = {
        "id": "UT-8801",
        "status": "OPEN",
        "due_date": "2026-12-18",
        "imposed_at": "2026-10-18"
    }
    ut_eval = engine.evaluate_undertaking(ut)
    assert ut_eval["status"] == "OPEN"
    assert ut_eval["aging_bucket"] in ("0-15_DAYS", "16-30_DAYS", "31-60_DAYS")

def test_run_daily_sweep_and_clock_advance():
    engine = AICTEWorkflowRuleEngine()
    apps = [
        {
            "ref_no": "APH-2026-9999",
            "current_stage": "SCRUTINY",
            "stage_entered_at": "2026-09-01",
            "sla_due_at": "2026-09-16"
        }
    ]
    uts = []
    docs = []
    sweep = engine.run_daily_sweep(apps, uts, docs)
    assert len(sweep["applications_evaluated"]) == 1
    assert sweep["applications_evaluated"][0]["sla_breached"] is True

    # Advance clock
    adv = engine.advance_simulated_clock(15)
    assert adv["simulated_day_offset"] == 15
