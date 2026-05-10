#!/usr/bin/env python3
from pathlib import Path
import sys
from urllib.error import URLError
from urllib.request import Request, urlopen

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

import app.db.base  # noqa: E402,F401
from app.db.database import Base, SessionLocal, engine  # noqa: E402
from app.services.cron_job_log_service import finish_cron_job_log, start_cron_job_log  # noqa: E402
from app.services.email_scheduler import process_pending_email_batch  # noqa: E402
from app.services.system_settings_service import get_settings_map  # noqa: E402

JOB_NAME = "email_queue"


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


def _notify_logs_updated(db, processed_count: int | None = None) -> None:
    _notify_internal_update(db, "/internal/logs/cronjobs/updated")
    if processed_count is None or processed_count > 0:
        _notify_internal_update(db, "/internal/logs/emails/updated")


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    log = start_cron_job_log(db, JOB_NAME)

    try:
        processed_count = process_pending_email_batch()
        finish_cron_job_log(
            db,
            log,
            status="success",
            processed_count=processed_count,
            message=f"Processed {processed_count} queued email(s).",
        )
        _notify_logs_updated(db, processed_count)
        print(f"Processed {processed_count} queued email(s).")
    except Exception as exc:
        finish_cron_job_log(
            db,
            log,
            status="failed",
            error=str(exc),
        )
        _notify_logs_updated(db)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
