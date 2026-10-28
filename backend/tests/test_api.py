import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["gemini_configured"] is True

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
