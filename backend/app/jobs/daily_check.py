"""Render cron entry point: python -m backend.app.jobs.daily_check"""

import json
import logging

from backend.app.core.database import SessionLocal
from backend.app.services.daily_checker import run_daily_compliance_check

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("compliscan.daily_check")


def main() -> int:
    with SessionLocal() as db:
        result = run_daily_compliance_check(db)
    logger.info("Daily compliance check completed: %s", json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
