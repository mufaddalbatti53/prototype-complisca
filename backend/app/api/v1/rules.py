from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.services.compliance_engine import AICTEWorkflowRuleEngine
from backend.app.services.rule_config_store import (
    get_rule_engine,
    reset_rule_configuration,
    save_rule_configuration,
)

router = APIRouter(prefix="/rules", tags=["Rules Configuration Engine"])
RULE_GOVERNANCE = {
    "source": {
        "title": "AICTE Approval Process Handbook",
        "edition_reference": "Prototype edition reference; verify against the applicable official edition",
        "clause_mapping_required": True,
        "verification_status": "requires_source_by_source_human_validation",
    },
    "configuration_source": "prototype_administrative_configuration",
    "configuration_version": "APH-2024-2027-v1.0",
    "human_review_required": True,
    "statutory_determination": False,
    "rule_classification": "configured_administrative",
}

class RouteRequest(BaseModel):
    app_type: str
    override_route: Optional[str] = None

class AdvanceRequest(BaseModel):
    application: Dict[str, Any]
    actor_role: str
    actor_id: str
    note: Optional[str] = "Cleared statutory checklist."
    require_sac_appeal: bool = False

class RevertRequest(BaseModel):
    application: Dict[str, Any]
    actor_role: str
    actor_id: str
    reason_code: str
    deficiency_note: str

class SimulateClockRequest(BaseModel):
    days: int = 7
    applications: List[Dict[str, Any]] = []
    undertakings: List[Dict[str, Any]] = []
    documents: List[Dict[str, Any]] = []

def seed_default_rules(db=None):
    """Seed helper kept for server startup compatibility."""
    pass

def _deep_merge_dict(target: Dict[str, Any], source: Dict[str, Any]):
    for k, v in source.items():
        if isinstance(v, dict) and k in target and isinstance(target[k], dict):
            _deep_merge_dict(target[k], v)
        else:
            target[k] = v


def _response_config(engine: AICTEWorkflowRuleEngine) -> Dict[str, Any]:
    governance = {**RULE_GOVERNANCE, "configuration_version": engine.config.get("rule_version")}
    return {**engine.config, "governance": governance}


def _decision_trace(engine: AICTEWorkflowRuleEngine, *, event: str, result: Dict[str, Any]) -> Dict[str, Any]:
    """Explain a configured workflow outcome without asserting statutory authority."""
    return {
        "event": event,
        "rule_version": engine.config.get("rule_version"),
        "rule_classification": "configured_administrative",
        "source": RULE_GOVERNANCE["source"],
        "resulting_stage": result.get("current_stage"),
        "resulting_route": result.get("route"),
        "human_authorization_required": True,
        "notice": "This trace explains a prototype configuration match. An authorised human must validate the source and approve consequential action.",
    }

@router.get("")
@router.get("/")
@router.get("/config")
def get_aph_config(db: Session = Depends(get_db)):
    """Returns workflow parameters with source and review disclosures."""
    return _response_config(get_rule_engine(db))

@router.put("/config")
def update_aph_config(new_config: Dict[str, Any], request: Request, db: Session = Depends(get_db)):
    """Updates SLA days, alert lead times, or escalation ladder from Timelines tab."""
    # Governance is server-owned metadata and cannot be replaced by a client update.
    new_config.pop("governance", None)
    engine = get_rule_engine(db)
    _deep_merge_dict(engine.config, new_config)
    if "stage_sla_days" in engine.config and isinstance(engine.config["stage_sla_days"], dict):
        normalized = {}
        for k, v in list(engine.config["stage_sla_days"].items()):
            normalized[k] = v
            normalized[k.upper()] = v
            normalized[k.lower()] = v
        engine.config["stage_sla_days"] = normalized
    stored = save_rule_configuration(
        db,
        engine.config,
        updated_by=request.headers.get("X-Actor-Id", "CONFIG_ADMIN"),
    )
    return {
        "status": "updated",
        "config": _response_config(AICTEWorkflowRuleEngine(stored.configuration)),
        "human_review_required": True,
    }

@router.post("/config/reset")
def reset_aph_config(request: Request, db: Session = Depends(get_db)):
    """Restores the prototype's configured administrative defaults."""
    stored = reset_rule_configuration(db, updated_by=request.headers.get("X-Actor-Id", "CONFIG_ADMIN"))
    return _response_config(AICTEWorkflowRuleEngine(stored.configuration))

@router.post("/workflow/route")
def route_new_application(req: RouteRequest, db: Session = Depends(get_db)):
    """Auto-routes a new application into Only Scrutiny, Scrutiny+EVC, EVC+SAC, etc."""
    engine = get_rule_engine(db)
    result = engine.determine_route(req.app_type, req.override_route)
    return {**result, "decision_trace": _decision_trace(engine, event="ROUTE_DETERMINED", result=result)}

@router.post("/workflow/advance")
def advance_application_stage(req: AdvanceRequest, db: Session = Depends(get_db)):
    """Moves application to next prescribed stage & auto-queues EVC if applicable."""
    try:
        engine = get_rule_engine(db)
        result = engine.advance_stage(
            req.application, req.actor_role, req.actor_id, req.note, req.require_sac_appeal
        )
        return {**result, "decision_trace": _decision_trace(engine, event="STAGE_ADVANCED", result=result)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/workflow/revert")
def revert_application(req: RevertRequest, db: Session = Depends(get_db)):
    """Reverts application to Institution with mandatory recorded deficiency reason."""
    try:
        engine = get_rule_engine(db)
        result = engine.revert_for_deficiency(
            req.application, req.actor_role, req.actor_id, req.reason_code, req.deficiency_note
        )
        return {**result, "decision_trace": _decision_trace(engine, event="REVERTED_FOR_DEFICIENCY", result=result)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulate/day")
def simulate_day_forward(req: SimulateClockRequest, db: Session = Depends(get_db)):
    """
    DEMO KILLER FEATURE: Ticks clock forward N days and runs the daily due-date sweep
    so evaluators watch L1 -> L4 escalations and lease expiry alerts fire live on screen.
    """
    engine = get_rule_engine(db)
    engine.advance_simulated_clock(req.days)
    save_rule_configuration(db, engine.config, updated_by="SIMULATION")
    return engine.run_daily_sweep(req.applications, req.undertakings, req.documents)
