from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.services.compliance_engine import AICTEWorkflowRuleEngine

router = APIRouter(prefix="/rules", tags=["Rules Configuration Engine"])
engine = AICTEWorkflowRuleEngine()

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

@router.get("")
@router.get("/")
@router.get("/config")
def get_aph_config():
    """Returns current editable APH timelines, routes, and escalation ladder."""
    return engine.config

@router.put("/config")
def update_aph_config(new_config: Dict[str, Any]):
    """Updates SLA days, alert lead times, or escalation ladder from Timelines tab."""
    engine.config.update(new_config)
    return {"status": "updated", "config": engine.config}

@router.post("/config/reset")
def reset_aph_config():
    """Restores statutory APH 2024-27 default settings."""
    return engine.reset_defaults()

@router.post("/workflow/route")
def route_new_application(req: RouteRequest):
    """Auto-routes a new application into Only Scrutiny, Scrutiny+EVC, EVC+SAC, etc."""
    return engine.determine_route(req.app_type, req.override_route)

@router.post("/workflow/advance")
def advance_application_stage(req: AdvanceRequest):
    """Moves application to next prescribed stage & auto-queues EVC if applicable."""
    try:
        return engine.advance_stage(
            req.application, req.actor_role, req.actor_id, req.note, req.require_sac_appeal
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/workflow/revert")
def revert_application(req: RevertRequest):
    """Reverts application to Institution with mandatory recorded deficiency reason."""
    try:
        return engine.revert_for_deficiency(
            req.application, req.actor_role, req.actor_id, req.reason_code, req.deficiency_note
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulate/day")
def simulate_day_forward(req: SimulateClockRequest):
    """
    DEMO KILLER FEATURE: Ticks clock forward N days and runs the daily due-date sweep
    so evaluators watch L1 -> L4 escalations and lease expiry alerts fire live on screen.
    """
    engine.advance_simulated_clock(req.days)
    return engine.run_daily_sweep(req.applications, req.undertakings, req.documents)
