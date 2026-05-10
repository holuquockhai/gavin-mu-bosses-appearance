from datetime import datetime

from sqlalchemy.orm import Session

from app.models.cron_job_log import CronJobLog


def start_cron_job_log(db: Session, job_name: str) -> CronJobLog:
    log = CronJobLog(job_name=job_name, status="running")
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def finish_cron_job_log(
    db: Session,
    log: CronJobLog,
    status: str,
    processed_count: int = 0,
    message: str | None = None,
    error: str | None = None,
) -> CronJobLog:
    log.status = status
    log.processed_count = processed_count
    log.message = message
    log.error = error
    log.finished_at = datetime.utcnow()
    db.commit()
    db.refresh(log)
    return log
