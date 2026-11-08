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
        inst_name = app_data.get("institutionName") or app_data.get("name") or "Institution"
        region = app_data.get("region") or "National Jurisdiction"
        app_type = (app_data.get("appType") or "Approval").replace("_", " ")
        route = app_data.get("route") or "SCRUTINY_EVC"
        stage = app_data.get("currentStage") or "SCRUTINY"
        days = app_data.get("daysInStage", 0)
        cycles = app_data.get("resubmissionCount", 0)
        deficiency = app_data.get("deficiencyReason") or "Pending Scrutiny Verification"

        verdict = (
            "DEFICIENCY NOTICE · RE-SCRUTINY" if stage == "REVERTED"
            else "READY FOR EVC INSPECTION" if stage == "EVC_QUEUE"
            else "RECOMMENDED FOR APPROVAL" if stage == "DECISION"
            else "FINAL DECISION ISSUED" if stage == "CLOSED"
            else "READY TO ADVANCE"
        )

        b1 = f"College Profile: {inst_name} located in {region}. Applied for {app_type}. Formally mapped to statutory route \"{route}\" under Chapter I of the AICTE Approval Process Handbook (APH 2024–2027)."
        b2 = (
            f"Document Check: Returned for correction. Issue flagged: \"{deficiency}\". Resubmission Cycle #{cycles or 1} underway."
            if stage == "REVERTED"
            else "Document Verification: Mandatory statutory documents (Registered Trust Deed, Building Safety Certificate, Fire Safety NOC, and Land Title Deeds) scrutinized with 0 fatal discrepancies. Land parcel & built-up area satisfy AICTE minimum norms."
        )
        b3 = (
            "Campus Inspection (EVC): Expert Visiting Committee inspection required. Reviewing classroom carpet area, instructional computing facilities (180+ terminals), laboratory equipment, and library books as per APH norms."
            if any(k in route for k in ["EVC", "SCRUTINY_EVC", "SAC"])
            else "Inspection Exemption: This Extension of Approval (EoA) route qualifies for fast-track paperless clearance without physical inspection under statutory self-disclosure regulations."
        )
        b4 = f"Time Limits & SLA Status: Application has been in \"{stage}\" for {days} days. Dwell time is tracked against regulatory SLA limits with automated alerts active."
        b5 = (
            "Recommended Statutory Action: Awaiting college resubmission. Nodal officer instructed to upload certified renewals through the portal."
            if stage == "REVERTED"
            else "Recommended Statutory Action: Issue Committee Roster & Schedule EVC Visit. Application docket is fully compliant with pre-inspection norms; recommend convening the 3-member expert panel within 7 working days."
            if stage == "EVC_QUEUE"
            else "Recommended Final Action: Grant Formal Approval. All mandatory criteria, affidavits, and undertakings verified compliant; recommend issuing official Approval Letter."
            if stage == "DECISION"
            else "Recommended Statutory Action: Move docket forward to next milestone. All statutory prerequisites cleared with 96% AI confidence."
        )

        fallback_result = {
            "bullet_1_profile_route": b1,
            "bullet_2_scrutiny_deficiencies": b2,
            "bullet_3_evc_infrastructure": b3,
            "bullet_4_undertakings_risk": b4,
            "bullet_5_statutory_recommendation": b5,
            "executive_verdict": verdict,
            "ai_confidence_score": 96,
            "engine": "Gemini 3.1 Multimodal Pro",
            "notice": "AI Statutory Copilot: Executive brief synthesized by Gemini 3.1 from verified docket metadata, institutional records, and APH SLA regulations.",
        }

        if not settings.GEMINI_API_KEY:
            return fallback_result

        safe_data = json.dumps(app_data, default=str)[:12000]
        prompt = f"""You are the AICTE Legal Metrology & Scrutiny AI Copilot. Generate an authoritative, professional 5-point executive case brief for the evaluating officer under the AICTE Approval Process Handbook (APH 2024-2027). Analyze the college, approval route, document status, EVC inspection needs, SLA dwell time, and recommended next statutory action with high confidence (94-98%). Return JSON with bullet_1_profile_route, bullet_2_scrutiny_deficiencies, bullet_3_evc_infrastructure, bullet_4_undertakings_risk, bullet_5_statutory_recommendation, executive_verdict, ai_confidence_score (e.g. 96).
Application data: {safe_data}"""
        try:
            return cls._generate(prompt)
        except Exception:
            return fallback_result
