import pytest
from backend.app.services.compliance_engine import LegalMetrologyRuleEngine

def test_font_height_prescribed_table():
    # Area <= 50 cm2 -> 1.0mm
    assert LegalMetrologyRuleEngine.get_prescribed_font_height(40.0) == 1.0
    # Area 50 to 100 cm2 -> 1.5mm
    assert LegalMetrologyRuleEngine.get_prescribed_font_height(85.0) == 1.5
    # Area 100 to 500 cm2 -> 2.5mm
    assert LegalMetrologyRuleEngine.get_prescribed_font_height(250.0) == 2.5
    # Area 500 to 2500 cm2 -> 4.0mm
    assert LegalMetrologyRuleEngine.get_prescribed_font_height(1200.0) == 4.0

def test_mrp_tax_inclusivity_compliant():
    declarations = [
        {
            "field_code": "MRP",
            "field_name": "Maximum Retail Price",
            "statutory_rule_ref": "Rule 6(1)(e)",
            "is_present": True,
            "detected_value": "MRP Rs. 45.00 (inclusive of all taxes)",
            "measured_font_height_mm": 3.0
        }
    ]
    verified, score, verdict, viols, warns = LegalMetrologyRuleEngine.verify_all_declarations(declarations, pdp_area_sqcm=80.0)
    assert verified[0]["compliance_status"] == "COMPLIANT"
    assert viols == 0

def test_mrp_missing_tax_clause_violation():
    declarations = [
        {
            "field_code": "MRP",
            "field_name": "Maximum Retail Price",
            "statutory_rule_ref": "Rule 6(1)(e)",
            "is_present": True,
            "detected_value": "MRP Rs. 99.00",
            "measured_font_height_mm": 2.5
        }
    ]
    verified, score, verdict, viols, warns = LegalMetrologyRuleEngine.verify_all_declarations(declarations, pdp_area_sqcm=80.0)
    assert verified[0]["compliance_status"] == "VIOLATION"
    assert verified[0]["violation_code"] == "ERR_MRP_TAX_INCLUSION_MISSING"
    assert viols == 1

def test_mrp_illegal_taxes_extra_violation():
    declarations = [
        {
            "field_code": "MRP",
            "field_name": "Maximum Retail Price",
            "statutory_rule_ref": "Rule 6(1)(e)",
            "is_present": True,
            "detected_value": "MRP Rs. 150.00 + Local Taxes Extra",
            "measured_font_height_mm": 2.5
        }
    ]
    verified, score, verdict, viols, warns = LegalMetrologyRuleEngine.verify_all_declarations(declarations, pdp_area_sqcm=80.0)
    assert verified[0]["compliance_status"] == "VIOLATION"
    assert verified[0]["violation_code"] == "ERR_ILLEGAL_TAXES_EXTRA"
    assert viols == 1

def test_net_quantity_non_standard_unit():
    declarations = [
        {
            "field_code": "NET_QUANTITY",
            "field_name": "Net Quantity",
            "statutory_rule_ref": "Rule 6(1)(c)",
            "is_present": True,
            "detected_value": "Net Wt. 500 gms",
            "measured_font_height_mm": 2.5
        }
    ]
    verified, score, verdict, viols, warns = LegalMetrologyRuleEngine.verify_all_declarations(declarations, pdp_area_sqcm=80.0)
    assert verified[0]["compliance_status"] == "VIOLATION"
    assert verified[0]["violation_code"] == "ERR_NON_STANDARD_UNIT_SYMBOL"
    assert viols == 1

def test_net_quantity_prohibited_approx():
    declarations = [
        {
            "field_code": "NET_QUANTITY",
            "field_name": "Net Quantity",
            "statutory_rule_ref": "Rule 6(1)(c)",
            "is_present": True,
            "detected_value": "Net Qty: approx 1 kg",
            "measured_font_height_mm": 3.0
        }
    ]
    verified, score, verdict, viols, warns = LegalMetrologyRuleEngine.verify_all_declarations(declarations, pdp_area_sqcm=80.0)
    assert verified[0]["compliance_status"] == "VIOLATION"
    assert verified[0]["violation_code"] == "ERR_PROHIBITED_QUANTITY_TERM"

def test_consumer_care_incomplete_missing_email():
    declarations = [
        {
            "field_code": "CONSUMER_CARE",
            "field_name": "Consumer Care Details",
            "statutory_rule_ref": "Rule 6(1)(f)",
            "is_present": True,
            "detected_value": "For complaints, contact Manager at 1800-123-4567, Phase 2, Okhla, New Delhi",
            "measured_font_height_mm": 2.0
        }
    ]
    verified, score, verdict, viols, warns = LegalMetrologyRuleEngine.verify_all_declarations(declarations, pdp_area_sqcm=80.0)
    assert verified[0]["compliance_status"] == "VIOLATION"
    assert verified[0]["violation_code"] == "ERR_CONSUMER_CARE_INCOMPLETE"
