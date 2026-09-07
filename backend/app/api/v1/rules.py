from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.rule import ComplianceRule
from backend.app.schemas.rule import RuleResponse, RuleUpdate

router = APIRouter(prefix="/rules", tags=["Rules Configuration Engine"])

DEFAULT_LMPC_RULES = [
    {
        "id": "rule_6_1_a",
        "rule_code": "LMPC_RULE_6_1_A",
        "rule_name": "Name and Address of Manufacturer / Packer / Importer",
        "statutory_reference": "Rule 6(1)(a), LMPC Rules 2011",
        "category": "Identity & Origin",
        "is_mandatory": True,
        "is_active": True,
        "parameters": {
            "require_pin_code": True,
            "require_city_state": True,
            "imported_requires_country": True
        },
        "description": "Every package shall bear the name and complete address of the manufacturer, or packer, or importer.",
        "statutory_penalty_summary": "Punishable under Section 36 with fine up to ₹25,000 for 1st offence."
    },
    {
        "id": "rule_6_1_b",
        "rule_code": "LMPC_RULE_6_1_B",
        "rule_name": "Generic or Common Name of Commodity",
        "statutory_reference": "Rule 6(1)(b), LMPC Rules 2011",
        "category": "Product Identification",
        "is_mandatory": True,
        "is_active": True,
        "parameters": {
            "prohibit_trademark_only": True
        },
        "description": "The common or generic name of the commodity contained in the package must be conspicuously declared.",
        "statutory_penalty_summary": "Notice of non-compliance and seizure under Section 15/18."
    },
    {
        "id": "rule_6_1_c",
        "rule_code": "LMPC_RULE_6_1_C",
        "rule_name": "Net Quantity in Standard Metric Units",
        "statutory_reference": "Rule 6(1)(c), LMPC Rules 2011",
        "category": "Quantity & Measurement",
        "is_mandatory": True,
        "is_active": True,
        "parameters": {
            "allowed_units": ["g", "kg", "ml", "l", "m", "cm", "mm", "N", "U"],
            "prohibited_symbols": ["gm", "gms", "kgs", "ltr", "ltrs", "lbs", "oz"],
            "prohibit_qualifying_words": ["approx", "when packed", "nearly", "around"]
        },
        "description": "Net quantity shall be stated in standard units of weight, measure or number without misleading qualifiers.",
        "statutory_penalty_summary": "Compoundable fine or prosecution under Section 36."
    },
    {
        "id": "rule_6_1_d",
        "rule_code": "LMPC_RULE_6_1_D",
        "rule_name": "Month and Year of Manufacture / Packing",
        "statutory_reference": "Rule 6(1)(d), LMPC Rules 2011",
        "category": "Date & Freshness",
        "is_mandatory": True,
        "is_active": True,
        "parameters": {
            "accepted_formats": ["MM/YYYY", "Month YYYY", "MM/YY"],
            "food_requires_best_before": True
        },
        "description": "The month and year in which the commodity is manufactured or pre-packed or imported shall be declared.",
        "statutory_penalty_summary": "Punishable under Section 36."
    },
    {
        "id": "rule_6_1_e",
        "rule_code": "LMPC_RULE_6_1_E",
        "rule_name": "Maximum Retail Price (MRP) & Tax Inclusivity",
        "statutory_reference": "Rule 6(1)(e), LMPC Rules 2011",
        "category": "Pricing & Consumer Protection",
        "is_mandatory": True,
        "is_active": True,
        "parameters": {
            "mandatory_tax_clause": "inclusive of all taxes",
            "strictly_prohibit_extra_taxes": True,
            "require_unit_sale_price_above_1kg_or_1l": True
        },
        "description": "The retail sale price shall be stated as 'Maximum or Max. Retail Price Rs. ...... / ₹ ...... (inclusive of all taxes)'.",
        "statutory_penalty_summary": "Non-compoundable penalty if dual pricing or over-charging is detected."
    },
    {
        "id": "rule_6_1_f",
        "rule_code": "LMPC_RULE_6_1_F",
        "rule_name": "Consumer Care Details (4-Part Declaration)",
        "statutory_reference": "Rule 6(1)(f), LMPC Rules 2011",
        "category": "Grievance Redressal",
        "is_mandatory": True,
        "is_active": True,
        "parameters": {
            "require_person_name_or_designation": True,
            "require_postal_address": True,
            "require_phone_number": True,
            "require_email": True
        },
        "description": "Mandates name/designation, address, telephone number and email of person or office for consumer complaints.",
        "statutory_penalty_summary": "Notice under Section 18 for missing consumer redressal channel."
    },
    {
        "id": "rule_7_8",
        "rule_code": "LMPC_RULE_7_8",
        "rule_name": "Principal Display Panel Area & Minimum Font Height",
        "statutory_reference": "Rule 7 & 8, LMPC Rules 2011",
        "category": "Readability & Font Dimensions",
        "is_mandatory": True,
        "is_active": True,
        "parameters": {
            "area_under_50_sqcm_min_mm": 1.0,
            "area_50_to_100_sqcm_min_mm": 1.5,
            "area_100_to_500_sqcm_min_mm": 2.5,
            "area_500_to_2500_sqcm_min_mm": 4.0,
            "area_above_2500_sqcm_min_mm": 6.0
        },
        "description": "Prescribes the minimum height of numerals and letters based on the Principal Display Panel area.",
        "statutory_penalty_summary": "Non-conforming packaging label under Rule 7."
    }
]

def seed_default_rules(db: Session):
    existing = db.query(ComplianceRule).first()
    if not existing:
        for r_data in DEFAULT_LMPC_RULES:
            rule = ComplianceRule(**r_data)
            db.add(rule)
        db.commit()

@router.get("", response_model=List[RuleResponse])
def get_all_rules(db: Session = Depends(get_db)):
    seed_default_rules(db)
    return db.query(ComplianceRule).all()


@router.put("/{rule_code}", response_model=RuleResponse)
def update_rule(
    rule_code: str,
    update_data: RuleUpdate,
    db: Session = Depends(get_db)
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.rule_code == rule_code).first()
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_code} not found")

    if update_data.is_mandatory is not None:
        rule.is_mandatory = update_data.is_mandatory
    if update_data.is_active is not None:
        rule.is_active = update_data.is_active
    if update_data.parameters is not None:
        rule.parameters = update_data.parameters
    if update_data.description is not None:
        rule.description = update_data.description

    db.commit()
    db.refresh(rule)
    return rule
