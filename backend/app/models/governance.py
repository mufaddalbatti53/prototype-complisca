"""Persistence for the prototype's governed APH configuration."""

from datetime import datetime

from sqlalchemy import Column, DateTime, JSON, String

from backend.app.core.database import Base


class RuleConfiguration(Base):
    __tablename__ = "rule_configurations"

    id = Column(String(80), primary_key=True)
    configuration = Column(JSON, nullable=False)
    version = Column(String(100), nullable=False)
    updated_by = Column(String(100), nullable=False, default="SYSTEM")
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
