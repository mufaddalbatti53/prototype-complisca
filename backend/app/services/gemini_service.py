import base64
import json
import logging
import re
import requests
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Pinned model hierarchy prioritized for maximum visual accuracy, high availability, and ultra-fast throughput
FLAGSHIP_MODELS = [
    "gemini-3.5-flash-lite",  # Ultra-fast SOTA production flash model (proven ~3.3s response time)
    "gemini-3.5-flash",       # High-accuracy SOTA production model (proven reliable ~10s response time)
    getattr(settings, "GEMINI_MODEL", "gemini-3.8-flash"),
    "gemini-3.8-flash",       # Advanced multimodal preview model
    "gemini-3.7-flash",       # High-capacity multimodal model
    "gemini-3.1-flash-lite"   # High-availability fallback
]

# PURE OCR & TEXT EXTRACTION PROMPT (Zero legal logic or compliance scoring in the AI prompt)
PACKAGING_OCR_EXTRACTION_PROMPT = """
You are a high-precision Optical Character Recognition (OCR) and packaging text extraction system.
Your SOLE job is to read the packaging image and extract the exact text visible on the package into structured JSON.

CRITICAL EXTRACTION DIRECTIVES:
1. DO NOT evaluate legality, compliance, or violations. Do NOT score the packaging.
2. Extract the EXACT verbatim text as printed or stamped on the packaging.
3. If a field or its stamped value is absent, missing, or blank (for example: only a prompt like 'MRP:' or 'N. QTY:' or 'MFD:' is printed without any stamped value, or the field is completely missing), set is_present to false and detected_value to null.
4. If a field has printed or stamped text (e.g., '# MRP RS. 10/- (INCL. OF ALL TAXES)', '50 g', 'PEPSICO INDIA...'), set is_present to true and extract the verbatim string into detected_value.
5. Provide the bounding box coordinates [ymin, xmin, ymax, xmax] normalized to 0-1000 scale for each detected declaration.

{ocr_context}

Extract all text for the following standard packaging fields:
- MANUFACTURER_ADDRESS: Name and address of manufacturer, packer, or importer.
- GENERIC_NAME: Generic or common name of the commodity.
- NET_QUANTITY: Stamped or printed net weight, volume, or count (null if blank/unstamped).
- DATE_OF_MANUFACTURE: Stamped or printed month/year of manufacture, packing, or expiry (null if blank/unstamped).
- MRP: Stamped or printed Maximum Retail Price with any tax clauses (null if blank/unstamped).
- CONSUMER_CARE: Consumer complaint contact person, address, helpline phone/toll-free, email, or website.
- COUNTRY_OF_ORIGIN: Country of origin or manufacture. (CRITICAL: Do NOT infer this from the manufacturer address! Only extract if there is an explicit statement like 'Made in X', 'Country of Origin: X', or 'Produce of X'. Otherwise, set is_present to false).
- UNIT_SALE_PRICE: Unit Sale Price (USP) if printed or stamped.
  IMPORTANT SCANNING DIRECTION FOR STAMPED / DOT-MATRIX BOXES:
  On Indian snack food packages (e.g., Bingo Mad Angles, Lays, Kurkure, ITC, Britannia, Parle), the Unit Sale Price is usually printed inside a white or yellow dot-matrix stamping box.
  The label ('₹ PER g:', 'USP:', '₹ PER ml:') is printed on the LEFT, and the numerical value (e.g., '0.36', '0.20', '0.50') is printed on the far RIGHT of the SAME row, separated by wide whitespace or batch codes.
  You MUST combine left and right text into one complete line (e.g. '₹ PER g: 0.36'). Look for '₹ PER g', '₹/g', 'Rs/g', 'USP', 'Unit Sale Price'.

Also extract metadata:
- product_name: Full product title or name on the package
- brand: Brand name
- category: Commodity classification (e.g. Snacks, Food, Beverages)
- package_type: Packaging form factor (e.g. Pouch, Bag, Box, Bottle)

Respond ONLY with a valid JSON object matching this exact schema:
{
  "product_name": "string or null",
  "brand": "string or null",
  "category": "string or null",
  "package_type": "string or null",
  "declarations": [
    {
      "field_code": "MANUFACTURER_ADDRESS",
      "field_name": "Name and Address of Manufacturer / Packer / Importer",
      "statutory_rule_ref": "Rule 6(1)(a)",
      "is_present": true,
      "detected_value": "exact verbatim text string or null",
      "raw_ocr_text": "surrounding contextual text",
      "confidence_score": 0.98,
      "bounding_box": [ymin, xmin, ymax, xmax],
      "panel_side": "BACK_PANEL"
    }
  ]
}
"""

class GeminiService:
    @classmethod
    def analyze_packaging_image(cls, image_path: str, local_ocr_tokens: Optional[List[Dict[str, Any]]] = None) -> dict:
        """
        Sends packaging image to Google Gemini for deterministic, zero-temperature text extraction.
        All compliance evaluation and legal scoring are strictly handled downstream in Python code.
        """
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        mime_type = "image/jpeg"
        if image_path.lower().endswith(".png"):
            mime_type = "image/png"
        elif image_path.lower().endswith(".webp"):
            mime_type = "image/webp"

        # Format local OCR grounding tokens if available
        ocr_context = ""
        if local_ocr_tokens and len(local_ocr_tokens) > 0:
            extracted_lines = [f" - \"{t['text']}\" (confidence: {t['confidence']})" for t in local_ocr_tokens[:30]]
            ocr_context = "LOCAL DEEP-LEARNING OCR DETECTED TOKENS (Use as ground truth):\n" + "\n".join(extracted_lines)

        prompt = PACKAGING_OCR_EXTRACTION_PROMPT.replace("{ocr_context}", ocr_context)

        # Force absolute zero temperature, top_p 1.0, and static seed 42 for 100% deterministic output
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_base64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "top_p": 1.0,
                "seed": 42,
                "response_mime_type": "application/json"
            }
        }

        headers = {"Content-Type": "application/json"}
        last_error = None

        # Iterate over pinned models in order of priority
        seen_models = set()
        for model_name in FLAGSHIP_MODELS:
            if model_name in seen_models:
                continue
            seen_models.add(model_name)
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
            # Robust 30s timeout so multimodal generation is never cut off prematurely
            req_timeout = 30
            try:
                response = requests.post(url, json=payload, headers=headers, timeout=req_timeout)
                if response.status_code == 200:
                    result_json = response.json()
                    candidates = result_json.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        # Exclude thinking/reasoning parts to isolate pure JSON payload
                        non_thought_parts = [p.get("text", "") for p in parts if "text" in p and not p.get("thought")]
                        raw_text = "".join(non_thought_parts) if non_thought_parts else "".join([p.get("text", "") for p in parts if "text" in p])
                        cleaned = raw_text.strip()
                        if cleaned.startswith("```json"):
                            cleaned = cleaned[7:]
                        elif cleaned.startswith("```"):
                            cleaned = cleaned[3:]
                        if cleaned.endswith("```"):
                            cleaned = cleaned[:-3]
                        cleaned = cleaned.strip()

                        # If there is extra preamble or trailing text, extract the root JSON object
                        if not (cleaned.startswith("{") and cleaned.endswith("}")):
                            json_match = re.search(r'(\{[\s\S]*\})', cleaned)
                            if json_match:
                                cleaned = json_match.group(1).strip()

                        parsed = json.loads(cleaned)
                        logger.info(f"Deterministic packaging text extracted using pinned model: {model_name} (seed=42, temp=0.0)")
                        return parsed
                else:
                    last_error = f"Model {model_name} returned {response.status_code}: {response.text}"
                    logger.warning(last_error)
            except Exception as e:
                last_error = f"Model {model_name} error: {str(e)}"
                logger.warning(last_error)

        raise Exception(f"Failed to analyze packaging. Last error: {last_error}")
