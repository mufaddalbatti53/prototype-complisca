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
    rules = response.json()
    assert len(rules) >= 6
    rule_codes = [r["rule_code"] for r in rules]
    assert "LMPC_RULE_6_1_E" in rule_codes
    assert "LMPC_RULE_6_1_C" in rule_codes

def test_get_dashboard_analytics():
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_inspections" in data
    assert "overall_compliance_rate" in data
