from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from backend.app.core.database import get_db
from backend.app.core.config import to_ist_iso
from backend.app.models.inspection import Inspection
from backend.app.models.declaration import ExtractedDeclaration
from backend.app.schemas.analytics import DashboardStats, ViolationBreakdown, CategoryStat

router = APIRouter(prefix="/analytics", tags=["Analytics & Enforcement Dashboard"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    total = db.query(Inspection).count()
    compliant = db.query(Inspection).filter(Inspection.compliance_verdict == "COMPLIANT").count()
    non_compliant = db.query(Inspection).filter(Inspection.compliance_verdict == "NON_COMPLIANT").count()
    warning = db.query(Inspection).filter(Inspection.compliance_verdict == "WARNING").count()

    overall_rate = round((compliant / total * 100), 1) if total > 0 else 100.0

    # Violations by rule breakdown
    violation_query = (
        db.query(
            ExtractedDeclaration.statutory_rule_ref,
            ExtractedDeclaration.field_name,
            func.count(ExtractedDeclaration.id).label("cnt")
        )
        .filter(ExtractedDeclaration.compliance_status == "VIOLATION")
        .group_by(ExtractedDeclaration.statutory_rule_ref, ExtractedDeclaration.field_name)
        .order_by(desc("cnt"))
        .limit(10)
        .all()
    )

    total_violations_found = sum(row.cnt for row in violation_query) or 1
    violations_by_rule = [
        ViolationBreakdown(
            rule_code=row.statutory_rule_ref or "General",
            rule_name=row.field_name or "Mandatory Clause",
            count=row.cnt,
            percentage=round(row.cnt / total_violations_found * 100, 1)
        )
        for row in violation_query
    ]

    # Category stats
    cat_query = (
        db.query(
            Inspection.category,
            func.count(Inspection.id).label("total_insp"),
            func.sum(Inspection.violations_count).label("total_viols")
        )
        .group_by(Inspection.category)
        .all()
    )

    category_stats = []
    for cat in cat_query:
        insp_cnt = cat.total_insp or 0
        viols_cnt = int(cat.total_viols or 0)
        c_rate = round(max(0.0, (1 - (viols_cnt / max(1, insp_cnt * 4)))) * 100, 1)
        category_stats.append(
            CategoryStat(
                category=cat.category or "General",
                inspections_count=insp_cnt,
                violations_count=viols_cnt,
                compliance_rate=min(100.0, c_rate)
            )
        )

    # Recent inspections preview
    recent_records = (
        db.query(Inspection)
        .order_by(desc(Inspection.created_at))
        .limit(8)
        .all()
    )
    recent_list = [
        {
            "id": r.id,
            "product_name": r.product_name,
            "brand": r.brand,
            "category": r.category,
            "compliance_verdict": r.compliance_verdict,
            "overall_compliance_score": r.overall_compliance_score,
            "violations_count": r.violations_count,
            "created_at": to_ist_iso(r.created_at),
            "thumbnail_url": r.images[0].get("preprocessed_url") if r.images else None
        }
        for r in recent_records
    ]

    return DashboardStats(
        total_inspections=total,
        compliant_count=compliant,
        non_compliant_count=non_compliant,
        warning_count=warning,
        overall_compliance_rate=overall_rate,
        violations_by_rule=violations_by_rule,
        category_stats=category_stats,
        recent_inspections=recent_list
    )
