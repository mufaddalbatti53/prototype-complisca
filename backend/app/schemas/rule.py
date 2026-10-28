from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class RuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    rule_code: str
    rule_name: str
    statutory_reference: str
    category: str
    is_mandatory: bool
    is_active: bool
    parameters: Dict[str, Any]
    description: Optional[str] = None
    statutory_penalty_summary: Optional[str] = None

class RuleUpdate(BaseModel):
    is_mandatory: Optional[bool] = None
    is_active: Optional[bool] = None
    parameters: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
