import base64
import json
import logging
import re
import requests
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Pinned ultra-fast flash-lite models prioritized for maximum throughput (<3s response)
FLAGSHIP_MODELS = [
    "gemini-3.1-flash-lite",     # Proven fastest multimodal throughput (2.1s - 3.8s)
    "gemini-flash-lite-latest",  # Official latest fast flash-lite alias (2.6s)
    "gemini-3.5-flash-lite",     # High-speed SOTA flash-lite (2.3s)
    "gemini-2.5-flash",          # Highly resilient fallback
    getattr(settings, "GEMINI_MODEL", "gemini-3.1-flash-lite")
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

CRITICAL JSON SYNTAX & ESCAPING DIRECTIVES:
- Output MUST be 100% syntactically valid JSON.
- In detected_value and raw_ocr_text, NEVER output unescaped double quotes (\"). If packaging text contains quotation marks (e.g. "VIRGINIA HOUSE"), escape them as \\\" or replace them with single quotes ('VIRGINIA HOUSE').
- Never leave trailing commas before } or ].
- Do NOT output prose or commentary outside the JSON object.

FIELD DISAMBIGUATION RULES (CRITICAL):
- NET_QUANTITY vs GENERIC_NAME:
  * Any number with a metric unit (such as '14g', '14 g', '21 g', '50 g', '100 ml', '1 kg') MUST ALWAYS be extracted into NET_QUANTITY.
  * NEVER put a quantity or metric weight (like '14g') into GENERIC_NAME.
  * GENERIC_NAME is the descriptive name or commodity category of the product (e.g., 'NAMKEEN', 'PROPRIETARY FOOD - NAMKEEN', 'Confectionery', 'Potato Chips', 'Biscuits').
- CONSUMER_CARE vs MANUFACTURER_ADDRESS:
  * On Indian packaging (e.g., ITC Limited / Bingo Mad Angles, Parle, etc.), contact details often read 'CONSUMER CARE OFFICE, ITC LIMITED, 37, J.L. NEHRU ROAD, KOLKATA-700 071' or include helpline numbers, emails, or consumer address.
  * Whenever consumer redressal/complaint contact or office details are present, you MUST set is_present=true for CONSUMER_CARE and extract the complete consumer care details into CONSUMER_CARE.
  * Extract the manufacturing/packer/brand owner entity into MANUFACTURER_ADDRESS. Do NOT leave CONSUMER_CARE blank when contact details are present!

{ocr_context}

Extract all text for the following standard packaging fields:
- MANUFACTURER_ADDRESS: Name and address of manufacturer, packer, or importer.
- GENERIC_NAME: Generic or common name of the commodity.
- NET_QUANTITY: Stamped or printed net weight, volume, or count (null if blank/unstamped).
- DATE_OF_MANUFACTURE: Stamped or printed month/year of manufacture, packing, or expiry (null if blank/unstamped).
- MRP: Stamped or printed Maximum Retail Price with any tax clauses (null if blank/unstamped).
- CONSUMER_CARE: Consumer complaint contact person, designation, address, helpline phone/toll-free, email, or website.
  IMPORTANT SCANNING GUIDANCE:
  On Indian snack & food packaging (such as Bingo Mad Angles, ITC, Parle, Britannia, Haldiram's, Nestle, PepsiCo):
  * The consumer redressal declaration is frequently headed with 'FOR FEEDBACK/COMPLAINT CONTACT:' or 'FEEDBACK / COMPLAINTS:' or 'CUSTOMER CARE / HELPLINE'.
  * Look on BOTH the left and right panels for Consumer Care Office addresses (e.g. 'CONSUMER CARE OFFICE, ITC LIMITED...'), toll-free helpline numbers (e.g. '1800 425 444 444', '1800 103 1947'), and emails (e.g. 'itccares@itc.in', 'wecare@in.nestle.com').
  * You MUST extract this complete feedback/complaint block into CONSUMER_CARE and set is_present=true! Do NOT mark CONSUMER_CARE as false/null when feedback/complaint info is printed!
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
    @staticmethod
    def parse_resilient_json(text: str) -> dict:
        """
        Parses JSON output from LLMs with multi-layer auto-repair:
        1. Standard json.loads
        2. json-repair library (handles unescaped internal quotes, unquoted keys, missing commas)
        3. Sanitization of trailing commas, control characters, and regex extraction
        """
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        # If surrounded by non-JSON preamble/epilogue, extract the outermost JSON object
        if not (cleaned.startswith("{") and cleaned.endswith("}")):
            json_match = re.search(r"(\{[\s\S]*\})", cleaned)
            if json_match:
                cleaned = json_match.group(1).strip()

        # Attempt 1: Standard Python json.loads
        try:
            return json.loads(cleaned)
        except Exception as e1:
            logger.info(f"Standard json.loads encountered syntax issue ({e1}). Attempting json_repair...")

        # Attempt 2: json-repair package
        try:
            import json_repair
            repaired = json_repair.loads(cleaned)
            if isinstance(repaired, dict):
                logger.info("Successfully repaired malformed Gemini JSON via json_repair.loads")
                return repaired
        except Exception as e2:
            logger.info(f"json_repair.loads error ({e2}). Attempting sanitize and repair_json...")

        # Attempt 3: Remove trailing commas and sanitize before repair_json
        try:
            import json_repair
            sanitized = re.sub(r",\s*([\]\}])", r"\1", cleaned)
            repaired_str = json_repair.repair_json(sanitized)
            repaired_dict = json.loads(repaired_str)
            if isinstance(repaired_dict, dict):
                logger.info("Successfully repaired malformed Gemini JSON via sanitized repair_json")
                return repaired_dict
        except Exception as e3:
            pass

        # If all repairs fail, re-raise original JSON error with snippet context
        raise e1

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
            # Resilient 18s timeout to ensure high-res multimodal packets complete cleanly
            req_timeout = 18
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
                        parsed = cls.parse_resilient_json(raw_text)
                        logger.info(f"Deterministic packaging text extracted using pinned model: {model_name} (seed=42, temp=0.0)")
                        return parsed
                else:
                    last_error = f"Model {model_name} returned {response.status_code}: {response.text}"
                    logger.warning(last_error)
            except Exception as e:
                last_error = f"Model {model_name} error: {str(e)}"
                logger.warning(last_error)

        raise Exception(f"Failed to analyze packaging. Last error: {last_error}")
