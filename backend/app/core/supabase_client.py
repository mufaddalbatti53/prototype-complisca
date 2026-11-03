import logging
from typing import Optional

from supabase import Client, create_client

from backend.app.core.config import settings

logger = logging.getLogger("compliscan.supabase")

supabase: Optional[Client] = None

if settings.SUPABASE_URL and (settings.SUPABASE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY):
    try:
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
        supabase = create_client(settings.SUPABASE_URL, key)
        logger.info("Supabase client initialized successfully")
    except Exception as exc:  # pragma: no cover - env-dependent
        logger.warning("Supabase initialization failed: %s", exc)
        supabase = None


def get_supabase_client() -> Optional[Client]:
    return supabase
