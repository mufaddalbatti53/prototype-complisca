"""Gemini-backed illustrative extraction and case summaries for the AICTE prototype."""

from __future__ import annotations

import base64
import json
import logging
import re
from typing import Any

import requests

from backend.app.core.config import settings

logger = logging.getLogger(__name__)
MODEL = settings.GEMINI_MODEL


class GeminiProviderError(RuntimeError):
    """Provider request failed; details are logged but not returned to callers."""


class GeminiService:
    @staticmethod
    def parse_resilient_json(text: str) -> dict[str, Any]:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.IGNORECASE).strip()
        if not cleaned.startswith("{"):
            match = re.search(r"\{[\s\S]*\}", cleaned)
            if match:
                cleaned = match.group(0)
        try:
            value = json.loads(cleaned)
        except json.JSONDecodeError:
            try:
                import json_repair
                value = json_repair.loads(cleaned)
            except Exception as exc:
                raise ValueError("The AI provider returned an unreadable response.") from exc
        if not isinstance(value, dict):
            raise ValueError("The AI provider returned an unexpected response shape.")
        return value

    @classmethod
    def _generate(cls, prompt: str, *, image_bytes: bytes | None = None, mime_type: str | None = None) -> dict[str, Any]:
        if not settings.GEMINI_API_KEY:
            raise GeminiProviderError("Gemini is not configured")
        parts: list[dict[str, Any]] = [{"text": prompt}]
        if image_bytes is not None:
            parts.append({"inline_data": {"mime_type": mime_type or "application/octet-stream", "data": base64.b64encode(image_bytes).decode("ascii")}})
        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {"temperature": 0.0, "response_mime_type": "application/json"},
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
        try:
            response = requests.post(url, params={"key": settings.GEMINI_API_KEY}, json=payload, timeout=25)
            response.raise_for_status()
            candidates = response.json().get("candidates", [])
            text = "".join(part.get("text", "") for part in candidates[0].get("content", {}).get("parts", []) if "text" in part)
            if not text:
                raise ValueError("The AI provider returned no content.")
            return cls.parse_resilient_json(text)
        except Exception as exc:
            logger.warning("Gemini request failed (%s)", type(exc).__name__)
            raise GeminiProviderError("Gemini request failed") from exc

    @classmethod
    def extract_aicte_document(cls, image_bytes: bytes, mime_type: str = "image/jpeg", doc_hint: str = "") -> dict[str, Any]:
        prompt = f"""Read the supplied institutional document and return apparent text markers as JSON. Context: {doc_hint or 'institutional document'}.
Do not authenticate the document, validate a seal or QR code, decide legal validity, or state that the document complies with law. Do not infer missing values. Mark dates and identifiers as extracted text that needs human confirmation.
Return keys: doc_type, issuing_authority, registration_no, issued_on, expiry_date, validity_years, lessor_party, lessee_party, apparent_markers (array), ai_summary. Use null for fields not readable. Use neutral descriptions. Do not return confidence or authenticity scores."""
        if not settings.GEMINI_API_KEY:
            return {
                "doc_type": doc_hint or "Institutional document",
                "issuing_authority": None, "registration_no": None, "issued_on": None, "expiry_date": None,
                "validity_years": None, "lessor_party": None, "lessee_party": None,
                "apparent_markers": [],
                "ai_summary": "Illustrative fallback only. No document content was analyzed; review the source document manually.",
                "data_status": "synthetic_demo_data",
            }
        return cls._generate(prompt, image_bytes=image_bytes, mime_type=mime_type)

    @classmethod
    def extract_undertaking_evidence(cls, image_bytes: bytes, mime_type: str = "image/jpeg", condition_text: str = "") -> dict[str, Any]:
        prompt = f"""Describe visible content in this evidence file in relation to the institution's stated undertaking: {condition_text or 'not supplied'}.
Do not authenticate the file, validate an invoice, geolocation, signature, or seal, or determine compliance. Do not claim that evidence has been verified. Return JSON with evidence_type, geo_tagged (true/false/null only if a visible marker indicates this), apparent_evidence_summary, observed_markers (array), recommendation set to HUMAN_REVIEW_REQUIRED, and ai_observations. Do not return confidence or authenticity scores."""
        if not settings.GEMINI_API_KEY:
            return {
                "evidence_type": "not assessed", "geo_tagged": None,
                "verified_count_or_spec": "Not provided",
                "apparent_evidence_summary": "No evidence content was analyzed.",
                "observed_markers": [], "recommendation": "HUMAN_REVIEW_REQUIRED",
                "ai_observations": "Illustrative fallback only. Review the source evidence manually.",
                "data_status": "synthetic_demo_data",
            }
        return cls._generate(prompt, image_bytes=image_bytes, mime_type=mime_type)

    @classmethod
    def generate_aicte_case_summary(cls, app_data: dict[str, Any]) -> dict[str, Any]:
        safe_data = json.dumps(app_data, default=str)[:12000]
        prompt = f"""Prepare a concise administrative case summary using only the supplied application data. Do not invent facts, cite unprovided legal clauses, decide eligibility, recommend approval, or imply official authority. Identify missing facts and items for a human reviewer. Return JSON keys bullet_1_profile_route, bullet_2_scrutiny_deficiencies, bullet_3_evc_infrastructure, bullet_4_undertakings_risk, bullet_5_statutory_recommendation, executive_verdict. Use REVIEW_REQUIRED as the verdict unless the data explicitly supports another non-decisional status.
Application data: {safe_data}"""
        if not settings.GEMINI_API_KEY:
            return {
                "bullet_1_profile_route": "Application profile and route require human confirmation from the source record.",
                "bullet_2_scrutiny_deficiencies": "Document scrutiny findings were not provided.",
                "bullet_3_evc_infrastructure": "EVC and infrastructure findings were not provided.",
                "bullet_4_undertakings_risk": "Undertaking and SLA evidence require human review.",
                "bullet_5_statutory_recommendation": "No statutory recommendation is made by this prototype.",
                "executive_verdict": "REVIEW_REQUIRED",
                "data_status": "synthetic_demo_data",
            }
        return cls._generate(prompt)
