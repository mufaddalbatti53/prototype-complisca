from typing import List, Dict, Any
from pydantic import BaseModel

class ViolationBreakdown(BaseModel):
    rule_code: str
    rule_name: str
    count: int
    percentage: float

class CategoryStat(BaseModel):
    category: str
    inspections_count: int
    violations_count: int
    compliance_rate: float

class DashboardStats(BaseModel):
    total_inspections: int
    compliant_count: int
    non_compliant_count: int
    warning_count: int
    overall_compliance_rate: float
    violations_by_rule: List[ViolationBreakdown]
    category_stats: List[CategoryStat]
    recent_inspections: List[Dict[str, Any]]
