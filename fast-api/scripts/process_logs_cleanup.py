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
from app.models.activity_log import ActivityLog  # noqa: E402
from app.models.cron_job_log import CronJobLog  # noqa: E402
from app.models.email_queue import EmailQueue  # noqa: E402
from app.services.cron_job_log_service import finish_cron_job_log, start_cron_job_log  # noqa: E402
from app.services.system_settings_service import get_settings_map  # noqa: E402

JOB_NAME = "logs_cleanup"


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
        return max(1, min(3650, int(values.get("logs_retention_days") or 60)))
    except (TypeError, ValueError):
        return 60


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    log = start_cron_job_log(db, JOB_NAME)

    try:
        retention_days = _retention_days(db)
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=retention_days)
        deleted_activity_count = db.query(ActivityLog).filter(ActivityLog.created_at < cutoff).delete(synchronize_session=False)
        deleted_email_count = db.query(EmailQueue).filter(EmailQueue.created_at < cutoff).delete(synchronize_session=False)
        deleted_cron_count = (
            db.query(CronJobLog)
            .filter(CronJobLog.started_at < cutoff, CronJobLog.id != log.id)
            .delete(synchronize_session=False)
        )
        deleted_count = deleted_activity_count + deleted_email_count + deleted_cron_count
        db.commit()
        finish_cron_job_log(
            db,
            log,
            status="success",
            processed_count=deleted_count,
            message=(
                f"Deleted {deleted_activity_count} activity log(s), {deleted_email_count} email log(s), "
                f"and {deleted_cron_count} cronjob log(s) older than {retention_days} day(s)."
            ),
        )
        _notify_internal_update(db, "/internal/logs/cronjobs/updated")
        _notify_internal_update(db, "/internal/logs/emails/updated")
        print(f"Deleted {deleted_count} log item(s) older than {retention_days} day(s).")
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
