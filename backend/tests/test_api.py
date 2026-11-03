import pytest
import sys
from pathlib import Path

from fastapi.testclient import TestClient

# Ensure the backend package is importable when tests are run from the project root.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ap3p.main import app



class Client(TestClient):
    """Concrete API client with helpers for the endpoints under test."""

    def health(self):
        return self.get("/api/health")

    def rules(self):
        return self.get("/api/v1/rules")

    def dashboard_analytics(self):
        return self.get("/api/v1/analytics/dashboard")


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

def test_get_dashboard_analytics():
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_inspections" in data
    assert "overall_compliance_rate" in data
