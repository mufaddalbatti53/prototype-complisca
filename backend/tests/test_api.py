import pytest
import sys
from pathlib import Path

from fastapi.testclient import TestClient

# Ensure the backend package is importable when tests are run from the project root.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.app.main import app



class Client(TestClient):
    """Concrete API client with helpers for the endpoints under test."""

    def health(self):
        return self.get("/api/health")

    def rules(self):
        return self.get("/api/v1/rules")

client = Client(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "gemini_configured" in response.json()

def test_get_rules():
    response = client.get("/api/v1/rules")
    assert response.status_code == 200
    config = response.json()
    assert config["rule_version"] == "APH-2024-2027-v1.0"
    assert "stage_sla_days" in config
    assert "routes" in config
    assert "escalation_ladder" in config
    assert config["governance"]["human_review_required"] is True
    assert config["governance"]["statutory_determination"] is False

def test_get_aicte_documents():
    response = client.get("/api/v1/aicte/documents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_rule_configuration_is_persistent_and_workflow_is_traceable():
    updated = client.put("/api/v1/rules/config", json={"stage_sla_days": {"SCRUTINY": 12}})
    assert updated.status_code == 200
    assert updated.json()["human_review_required"] is True

    config = client.get("/api/v1/rules/config")
    assert config.status_code == 200
    assert config.json()["stage_sla_days"]["SCRUTINY"] == 12

    routed = client.post("/api/v1/rules/workflow/route", json={"app_type": "NEW_INSTITUTION"})
    assert routed.status_code == 200
    trace = routed.json()["decision_trace"]
    assert trace["event"] == "ROUTE_DETERMINED"
    assert trace["rule_classification"] == "configured_administrative"
    assert trace["human_authorization_required"] is True

    reset = client.post("/api/v1/rules/config/reset")
    assert reset.status_code == 200
    assert reset.json()["stage_sla_days"]["SCRUTINY"] == 15
