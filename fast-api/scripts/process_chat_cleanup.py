#!/usr/bin/env python3
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
from urllib.error import URLError
from urllib.request import Request, urlopen

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

import app.db.base  # noqa: E402,F401
from app.db.database import Base, SessionLocal, engine  # noqa: E402
from app.models.chat_message import ChatMessage  # noqa: E402
from app.services.cron_job_log_service import finish_cron_job_log, start_cron_job_log  # noqa: E402
from app.services.system_settings_service import get_settings_map  # noqa: E402

JOB_NAME = "chat_cleanup"


def _notify_internal_update(db, path: str) -> None:
    values = get_settings_map(db)
    api_base_url = (values.get("api_base_url") or "http://127.0.0.1:8000").rstrip("/")
    cron_secret = values.get("app_secret_key") or ""

    if not cron_secret:
        return

    request = Request(
        f"{api_base_url}{path}",
        data=b"{}",
        headers={
            "Content-Type": "application/json",
            "X-Warlords-Cron-Secret": cron_secret,
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=3):
            pass
    except URLError as exc:
        print(f"Could not notify FastAPI about {path}: {exc}")


def _retention_days(db) -> int:
    values = get_settings_map(db)
    try:
        return max(1, min(3650, int(values.get("chat_message_retention_days") or 30)))
    except (TypeError, ValueError):
        return 30


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    log = start_cron_job_log(db, JOB_NAME)

    try:
        retention_days = _retention_days(db)
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=retention_days)
        deleted_count = db.query(ChatMessage).filter(ChatMessage.created_at < cutoff).delete(synchronize_session=False)
        db.commit()
        finish_cron_job_log(
            db,
            log,
            status="success",
            processed_count=deleted_count,
            message=f"Deleted {deleted_count} chat message(s) older than {retention_days} day(s).",
        )
        _notify_internal_update(db, "/internal/logs/cronjobs/updated")
        print(f"Deleted {deleted_count} chat message(s) older than {retention_days} day(s).")
    except Exception as exc:
        db.rollback()
        finish_cron_job_log(
            db,
            log,
            status="failed",
            error=str(exc),
        )
        _notify_internal_update(db, "/internal/logs/cronjobs/updated")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
