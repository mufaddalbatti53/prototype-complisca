from backend.app.api.v1.aicte import _disclose_assessment
from backend.app.api.v1.rules import RULE_GOVERNANCE
from backend.app.core.config import settings
from backend.app.services.gemini_service import GeminiService


def test_ai_disclosure_requires_human_review_and_does_not_expose_default_scores():
    result = _disclose_assessment({
        "assessment_type": "illustrative_ai_assessment",
        "authenticity_score": 97,
        "ai_confidence_score": 96,
        "data_status": "unverified_extraction",
    })

    assert result["human_review_required"] is True
    assert result["confidence_source"] == "not provided"
    assert "authenticity_score" not in result
    assert "ai_confidence_score" not in result
    assert "does not authenticate" in result["notice"]


def test_unconfigured_ai_fallback_is_labeled_synthetic_without_scores(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    result = GeminiService.extract_undertaking_evidence(b"illustrative", "image/jpeg")
    disclosed = _disclose_assessment(result)

    assert disclosed["human_review_required"] is True
    assert disclosed["data_status"] == "synthetic_demo_data"
    assert disclosed["recommendation"] == "HUMAN_REVIEW_REQUIRED"
    assert "authenticity_score" not in disclosed


def test_rule_governance_marks_configuration_as_administrative_and_reviewable():
    assert RULE_GOVERNANCE["human_review_required"] is True
    assert RULE_GOVERNANCE["statutory_determination"] is False
    assert RULE_GOVERNANCE["configuration_source"] == "prototype_administrative_configuration"
