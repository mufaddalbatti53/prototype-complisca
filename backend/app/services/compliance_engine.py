import re
from typing import List, Dict, Any, Tuple

class LegalMetrologyRuleEngine:
    """
    Authoritative Rule-Based Verification Engine for:
    - Legal Metrology Act, 2009 (Sections 18, 36, 39)
    - Legal Metrology (Packaged Commodities) Rules, 2011 (Rules 6, 7, 8, 9, 18)
    - Amendments 2017, 2021 (E-Commerce), 2022 (Unit Sale Price)
    Calibrated with High-Precision Filters to Eliminate False Positives.
    """

    FONT_SIZE_BY_PDP_AREA = [
        (50.0, 1.0),
        (100.0, 1.5),
        (500.0, 2.5),
        (2500.0, 4.0),
        (float('inf'), 6.0)
    ]

    # Prohibited non-standard unit symbols under Seventh Schedule
    PROHIBITED_UNITS = [
        "gms", "gm", "kgs", "ltr", "ltrs", "lbs", "oz"
    ]

    # Allowed statutory tax inclusivity phrases and common packaging abbreviations
    STATUTORY_TAX_PHRASES = [
        "inclusive of all taxes",
        "incl. of all taxes",
        "incl of all taxes",
        "incl. all taxes",
        "incl all taxes",
        "inclusive all taxes",
        "inclusive of taxes",
        "incl. of taxes",
        "incl of taxes",
        "incl taxes",
        "incl.taxes",
        "all taxes incl",
        "all taxes inclusive",
        "inclusive of all duties & taxes"
    ]

    @classmethod
    def get_prescribed_font_height(cls, pdp_area_sqcm: float) -> float:
        for threshold, min_height in cls.FONT_SIZE_BY_PDP_AREA:
            if pdp_area_sqcm <= threshold:
                return min_height
        return 2.5

    @classmethod
    def verify_all_declarations(
        cls,
        declarations: List[Dict[str, Any]],
        pdp_area_sqcm: float = 100.0,
        is_single_panel: bool = True
    ) -> Tuple[List[Dict[str, Any]], float, str, int, int]:
        """
        Runs calibrated compliance verification with zero-false-positive heuristics.
        """
        prescribed_font_height = cls.get_prescribed_font_height(pdp_area_sqcm)
        violations_count = 0
        warnings_count = 0
        verified_declarations = []

        total_weight = 0
        achieved_weight = 0

        FIELD_WEIGHTS = {
            "MANUFACTURER_ADDRESS": 20,
            "GENERIC_NAME": 10,
            "NET_QUANTITY": 25,
            "DATE_OF_MANUFACTURE": 15,
            "MRP": 25,
            "CONSUMER_CARE": 20,
            "COUNTRY_OF_ORIGIN": 10,
            "UNIT_SALE_PRICE": 10
        }

        # Canonical Statutory Declarations under Legal Metrology Rules, 2011
        MANDATORY_SPECS = {
            "MANUFACTURER_ADDRESS": ("Name and Address of Manufacturer / Packer / Importer", "Rule 6(1)(a)", 20),
            "GENERIC_NAME": ("Generic or Common Name of Commodity", "Rule 6(1)(b)", 10),
            "NET_QUANTITY": ("Net Quantity in Standard Units", "Rule 6(1)(c)", 25),
            "DATE_OF_MANUFACTURE": ("Month & Year of Manufacture / Packing / Expiry", "Rule 6(1)(d)", 15),
            "MRP": ("Maximum Retail Price (MRP)", "Rule 6(1)(e)", 25),
            "CONSUMER_CARE": ("Consumer Care Helpline & Contact Details", "Rule 6(1)(f)", 20),
            "COUNTRY_OF_ORIGIN": ("Country of Origin", "Rule 6(1)(g)", 10),
            "UNIT_SALE_PRICE": ("Unit Sale Price (USP)", "Rule 6(1)(e) Amendment", 10)
        }

        # Ensure all mandatory declarations exist in inspection checklist
        existing_codes = {d.get("field_code") for d in declarations if d.get("field_code")}
        for m_code, (m_name, m_rule, m_weight) in MANDATORY_SPECS.items():
            if m_code not in existing_codes:
                declarations.append({
                    "field_code": m_code,
                    "field_name": m_name,
                    "statutory_rule_ref": m_rule,
                    "is_present": False,
                    "detected_value": None,
                    "raw_ocr_text": None,
                    "compliance_status": "VIOLATION"
                })

        # Determine package quantity scale and manufacturer location
        net_qty_text = ""
        mfg_address_text = ""
        for d in declarations:
            if d.get("field_code") == "NET_QUANTITY":
                net_qty_text = (d.get("detected_value") or "").lower()
            elif d.get("field_code") == "MANUFACTURER_ADDRESS":
                mfg_address_text = f"{d.get('detected_value') or ''} {d.get('raw_ocr_text') or ''}".lower()

        # Check if pack is > 1kg or > 1L
        is_large_pack = any(term in net_qty_text for term in ["kg", "litre", "liter"]) and not any(term in net_qty_text for term in ["mg", "50 g", "100 g", "250 g", "500 g"])

        is_imported = "import" in mfg_address_text

        FIELD_METADATA = {
            "MANUFACTURER_ADDRESS": ("Name & Address of Mfg/Packer", "Rule 6(1)(a)"),
            "GENERIC_NAME": ("Generic / Common Name", "Rule 6(1)(b)"),
            "NET_QUANTITY": ("Net Quantity (Metric)", "Rule 6(1)(c)"),
            "DATE_OF_MANUFACTURE": ("Date of Mfg / Packing", "Rule 6(1)(d)"),
            "MRP": ("Maximum Retail Price", "Rule 6(1)(e)"),
            "UNIT_SALE_PRICE": ("Unit Sale Price (USP)", "Rule 6(1)(e) [2022 Amendment]"),
            "CONSUMER_CARE": ("Consumer Care Details", "Rule 6(1)(f)"),
            "COUNTRY_OF_ORIGIN": ("Country of Origin", "Rule 6(1)(g)")
        }

        for decl in declarations:
            code = decl.get("field_code", "")
            
            # Override LLM hallucinated metadata with our source of truth
            meta = FIELD_METADATA.get(code, (decl.get("field_name", code), decl.get("statutory_rule_ref", "")))
            field_name = meta[0]
            rule_ref = meta[1]
            is_present = decl.get("is_present", False)
            detected_value = decl.get("detected_value") or ""
            raw_text = decl.get("raw_ocr_text") or ""
            measured_font_height = decl.get("measured_font_height_mm") or 2.0
            panel_side = decl.get("panel_side", "PDP")

            weight = FIELD_WEIGHTS.get(code, 10)
            total_weight += weight

            status = "COMPLIANT"
            violation_code = None
            violation_title = None
            violation_desc = None
            remedy = None

            # Case 1: Field is missing, blank, or un-stamped placeholder on this backside label
            if not is_present or not detected_value.strip() or detected_value.strip().endswith(":"):
                if code == "UNIT_SALE_PRICE":
                    # Under 2022 amendment, USP is strictly mandatory for ALL pre-packaged commodities
                    status = "VIOLATION"
                    violation_code = "ERR_UNIT_SALE_PRICE_MISSING"
                    violation_title = "Unit Sale Price (USP) Missing"
                    violation_desc = "The 2022 Amendment strictly requires Unit Sale Price (USP) for all packages."
                    remedy = "Declare Unit Sale Price (e.g. ₹ per g / per ml) in mandatory stamping area."
                    violations_count += 1
                elif code == "COUNTRY_OF_ORIGIN":
                    if is_imported:
                        status = "VIOLATION"
                        violation_code = "ERR_COUNTRY_OF_ORIGIN_MISSING"
                        violation_title = "Country of Origin Missing (Imported Product)"
                        violation_desc = "Rule 6(1)(g) strictly mandates a specific 'Country of Origin' declaration for imported products."
                        remedy = "Declare the specific Country of Origin (e.g. 'Made in [Country]')."
                        violations_count += 1
                    else:
                        status = "COMPLIANT" # Exempt for domestic products
                        detected_value = "Exempt (Domestic Product)"
                else:
                    # STRICT RULE: If anything mandatory is missing, unstamped, or blank, it is a VIOLATION!
                    status = "VIOLATION"
                    violation_code = f"ERR_{code}_MISSING"
                    violation_title = f"Mandatory Declaration Missing: {field_name}"
                    violation_desc = f"Mandatory declaration '{field_name}' is missing, blank, or unstamped on the packaging under {rule_ref} of LMPC Rules, 2011."
                    remedy = f"Ensure complete and legible '{field_name}' is stamped on the package prior to commercial distribution."
                    violations_count += 1

            # Case 2: Field is present -> Run syntax and semantic rules
            else:
                full_content = f"{detected_value} {raw_text}".lower().replace("\n", " ")

                # --- RULE 6(1)(e): Maximum Retail Price (MRP) ---
                if code == "MRP":
                    has_tax_clause = any(phrase in full_content for phrase in cls.STATUTORY_TAX_PHRASES)
                    # Check for dot-matrix / stamped variations like 'incl.' or 'taxes'
                    if not has_tax_clause:
                        if ("incl" in full_content and "tax" in full_content) or "inclusive" in full_content:
                            has_tax_clause = True

                    has_illegal_extra = any(phrase in full_content for phrase in ["taxes extra", "+ taxes", "local taxes extra", "+ local tax"])

                    if has_illegal_extra:
                        status = "VIOLATION"
                        violation_code = "ERR_ILLEGAL_TAXES_EXTRA"
                        violation_title = "Illegal Declaration: Taxes Extra"
                        violation_desc = "Declaring retail price with taxes extra violates Section 18 of the Legal Metrology Act and Rule 6(1)(e)."
                        remedy = "Declare Maximum Retail Price as inclusive of all taxes."
                        violations_count += 1
                    elif not has_tax_clause:
                        status = "VIOLATION"
                        violation_code = "ERR_MRP_TAX_INCLUSION_MISSING"
                        violation_title = "Missing Mandatory Clause: (inclusive of all taxes)"
                        violation_desc = "MRP must explicitly declare '(inclusive of all taxes)' or 'incl. of all taxes' under Rule 6(1)(e)."
                        remedy = "Include 'incl. of all taxes' adjacent to the retail price."
                        violations_count += 1

                # --- RULE 6(1)(c): Net Quantity ---
                elif code == "NET_QUANTITY":
                    # Check for strictly prohibited non-standard symbols like 'gms'
                    has_prohibited_unit = False
                    for bad_unit in cls.PROHIBITED_UNITS:
                        # Match word boundary: e.g. 50 gms, 250gms
                        pattern = rf'\b\d+\s*{bad_unit}\b'
                        if re.search(pattern, full_content):
                            has_prohibited_unit = True
                            status = "VIOLATION"
                            violation_code = "ERR_NON_STANDARD_UNIT_SYMBOL"
                            violation_title = f"Non-Standard Unit Symbol: '{bad_unit}'"
                            violation_desc = f"Rule 6(1)(c) & Seventh Schedule mandate standard metric symbol 'g' or 'kg'. Found non-compliant '{bad_unit}'."
                            remedy = f"Replace '{bad_unit}' with standard symbol 'g'."
                            violations_count += 1
                            break

                    if not has_prohibited_unit:
                        # Check for prohibited vague terms like 'approx'
                        for term in ["approx", "when packed", "nearly"]:
                            if term in full_content:
                                status = "VIOLATION"
                                violation_code = "ERR_PROHIBITED_QUANTITY_TERM"
                                violation_title = f"Prohibited Qualification: '{term}'"
                                violation_desc = f"Rule 11 prohibits prefixing net quantity with qualifying terms like '{term}'."
                                remedy = "State exact net quantity without approximations."
                                violations_count += 1
                                break

                # --- RULE 6(1)(a): Manufacturer Address ---
                elif code == "MANUFACTURER_ADDRESS":
                    # Check for postal landmarks or PIN code
                    has_pin = bool(re.search(r'\b\d{6}\b', detected_value))
                    has_landmarks = any(w in full_content for w in ["delhi", "mumbai", "bengaluru", "chennai", "kolkata", "hyderabad", "pune", "ahmedabad", "gurugram", "noida", "road", "street", "plot", "phase", "dist", "state", "india", "pvt", "ltd", "corp"])
                    if not has_pin and not has_landmarks:
                        status = "WARNING"
                        violation_code = "WARN_PARTIAL_ADDRESS"
                        violation_title = "Incomplete Postal Address"
                        violation_desc = "Address does not clearly display PIN code or recognized city/state."
                        remedy = "Include complete postal address with premises, city, state, and 6-digit PIN code."
                        warnings_count += 1

                # --- RULE 6(1)(f): Consumer Care ---
                elif code == "CONSUMER_CARE":
                    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', detected_value))
                    has_phone = bool(re.search(
                        r'1800[\s\-]?[0-9]{2,4}[\s\-]?[0-9]{3,4}|1800[0-9]{6,7}|(?:\+91[\s\-]?)?[6-9][0-9]{9}|0[0-9]{2,4}[\s\-]?[0-9]{6,8}|[0-9]{3,5}[\s\-]?[0-9]{6,8}',
                        detected_value
                    ))
                    has_web = bool(re.search(r'www\.[\w\.-]+\.\w+', detected_value))

                    if not has_email and not has_phone and not has_web:
                        status = "WARNING"
                        violation_code = "WARN_CONSUMER_CARE_PARTIAL"
                        violation_title = "Incomplete Consumer Redressal Channel"
                        violation_desc = "Consumer Care must provide an active telephone helpline or email address."
                        remedy = "Provide toll-free helpline number and email ID."
                        warnings_count += 1

            # Score computation
            if status == "COMPLIANT":
                achieved_weight += weight
            elif status == "WARNING":
                achieved_weight += (weight * 0.8)
            else:
                achieved_weight += 0

            verified_declarations.append({
                "field_code": code,
                "field_name": field_name,
                "statutory_rule_ref": rule_ref,
                "is_present": is_present,
                "detected_value": detected_value,
                "raw_ocr_text": raw_text,
                "confidence_score": decl.get("confidence_score", 0.95),
                "bounding_box": decl.get("bounding_box", []),
                "panel_side": panel_side,
                "measured_font_height_mm": measured_font_height,
                "minimum_prescribed_height_mm": prescribed_font_height,
                "compliance_status": status,
                "violation_code": violation_code,
                "violation_title": violation_title,
                "violation_description": violation_desc,
                "legal_remedy_recommendation": remedy
            })

        overall_score = round((achieved_weight / max(1, total_weight)) * 100, 1)

        if violations_count > 0:
            verdict = "NON_COMPLIANT"
        elif warnings_count > 0:
            verdict = "WARNING"
        else:
            verdict = "COMPLIANT"

        return verified_declarations, overall_score, verdict, violations_count, warnings_count
