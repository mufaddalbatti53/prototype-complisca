"""Deployment-scoped API key checks for non-public API and storage routes."""

import hmac
from typing import Optional

from fastapi import Request
from starlette.responses import JSONResponse

from backend.app.core.config import settings


def supplied_api_key(request: Request) -> Optional[str]:
    key = request.headers.get("x-api-key")
    if key:
        return key
    authorization = request.headers.get("authorization", "")
    if authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return request.query_params.get("api_key")


async def deployment_api_key_middleware(request: Request, call_next):
    path = request.url.path
    protected = path.startswith(settings.API_V1_STR + "/") or path.startswith("/storage/")
    if not protected or request.method == "OPTIONS" or not settings.API_AUTH_REQUIRED:
        return await call_next(request)
    expected = settings.API_KEY
    provided = supplied_api_key(request)
    if not expected or not provided or not hmac.compare_digest(provided, expected):
        origin = request.headers.get("origin", "*")
        return JSONResponse(
            status_code=401,
            content={"detail": "Valid API credentials are required."},
            headers={"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", "Vary": "Origin"},
        )
    return await call_next(request)
