"""Optional direct Supabase Storage uploads without requiring the SDK at runtime."""

from __future__ import annotations

from urllib.parse import quote

import requests

from backend.app.core.config import settings


def is_configured() -> bool:
    return bool(settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY) and settings.SUPABASE_STORAGE_BUCKET)


def upload_bytes(object_path: str, content: bytes, content_type: str) -> str:
    """Upload to a public bucket and return its public object URL."""
    if not is_configured():
        raise RuntimeError("Supabase Storage is not configured")
    safe_path = "/".join(quote(part, safe="") for part in object_path.split("/") if part)
    bucket = quote(settings.SUPABASE_STORAGE_BUCKET, safe="")
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
    endpoint = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{bucket}/{safe_path}"
    response = requests.post(
        endpoint,
        data=content,
        headers={"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": content_type, "x-upsert": "false"},
        timeout=30,
    )
    if response.status_code not in (200, 201):
        raise RuntimeError(f"Storage upload failed with HTTP {response.status_code}")
    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{bucket}/{safe_path}"
