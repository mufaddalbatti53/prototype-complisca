"""Retired legacy packaging inspection module.

The SIH 26262 application uses the AICTE endpoints in ``aicte.py`` and the
APH workflow endpoints in ``rules.py``. This empty router remains temporarily
for downstream import compatibility; it exposes no packaging or scan API.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/scan", tags=["Retired legacy endpoints"])
