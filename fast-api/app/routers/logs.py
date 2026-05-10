from typing import Annotated
import asyncio
from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import require_roles
from app.models.activity_log import ActivityLog
from app.models.cron_job_log import CronJobLog
from app.models.email_queue import EmailQueue
from app.schemas.log import ActivityLogListResponse, CronJobLogListResponse, EmailLogListResponse, EmailLogResponse
from app.services.email_scheduler import send_email_queue_item_now
from app.services.system_settings_service import get_settings_map
from app.services.websocket_manager import websocket_manager

SYSTEM_SETTING_EVENT_TYPES = (
    "branding_settings_saved",
    "factory_reset_completed",
    "mysql_database_backup_downloaded",
    "mysql_database_restored",
    "system_settings_backup_downloaded",
    "system_settings_restored",
    "system_settings_saved",
)

internal_router = APIRouter(prefix="/internal/logs", tags=["internal-logs"])

router = APIRouter(
    prefix="/admin/logs",
    tags=["admin-logs"],
    dependencies=[Depends(require_roles(["admin"]))],
)


def date_start(value: date | None) -> datetime | None:
    return datetime.combine(value, time.min) if value else None


def date_end(value: date | None) -> datetime | None:
    return datetime.combine(value, time.max) if value else None


@internal_router.post("/cronjobs/updated")
async def broadcast_cron_job_logs_updated(
    db: Annotated[Session, Depends(get_db)],
    cron_secret: Annotated[str | None, Header(alias="X-Warlords-Cron-Secret")] = None,
):
    values = get_settings_map(db)
    expected_secret = values.get("app_secret_key")

    if not expected_secret or cron_secret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid cron secret")

    await websocket_manager.broadcast({"type": "cron_logs_updated"})
    return {"message": "Cron logs update broadcasted"}


@internal_router.post("/emails/updated")
async def broadcast_email_logs_updated(
    db: Annotated[Session, Depends(get_db)],
    cron_secret: Annotated[str | None, Header(alias="X-Warlords-Cron-Secret")] = None,
):
    values = get_settings_map(db)
    expected_secret = values.get("app_secret_key")

    if not expected_secret or cron_secret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid cron secret")

    await websocket_manager.broadcast({"type": "email_logs_updated"})
    return {"message": "Email logs update broadcasted"}


@router.get("/activities", response_model=ActivityLogListResponse)
def list_activity_logs(
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    search: str | None = None,
    event_type: str | None = None,
    user: str | None = None,
    entity_type: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    filters = ~ActivityLog.event_type.in_(SYSTEM_SETTING_EVENT_TYPES)
    filter_conditions = [filters]

    if search:
        search_pattern = f"%{search.strip()}%"
        filter_conditions.append(or_(
            ActivityLog.event_type.ilike(search_pattern),
            ActivityLog.description.ilike(search_pattern),
            ActivityLog.details.ilike(search_pattern),
        ))
    if event_type:
        filter_conditions.append(ActivityLog.event_type.ilike(f"%{event_type.strip()}%"))
    if user:
        user_pattern = f"%{user.strip()}%"
        filter_conditions.append(or_(
            ActivityLog.user_full_name.ilike(user_pattern),
            ActivityLog.user_email.ilike(user_pattern),
        ))
    if entity_type:
        filter_conditions.append(ActivityLog.entity_type.ilike(f"%{entity_type.strip()}%"))
    if date_from:
        filter_conditions.append(ActivityLog.created_at >= date_start(date_from))
    if date_to:
        filter_conditions.append(ActivityLog.created_at <= date_end(date_to))

    filters = tuple(filter_conditions)
    total = db.execute(select(func.count()).select_from(ActivityLog).where(*filters)).scalar_one()
    items = db.execute(
        select(ActivityLog)
        .where(*filters)
        .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/filter-options")
def get_log_filter_options(
    db: Annotated[Session, Depends(get_db)],
):
    def distinct_values(model, column, *filters):
        return [
            value
            for (value,) in db.execute(
                select(column)
                .select_from(model)
                .where(column.isnot(None), *filters)
                .distinct()
                .order_by(column)
            ).all()
            if value
        ]

    return {
        "activity_event_types": distinct_values(
            ActivityLog,
            ActivityLog.event_type,
            ~ActivityLog.event_type.in_(SYSTEM_SETTING_EVENT_TYPES),
        ),
        "activity_entity_types": distinct_values(
            ActivityLog,
            ActivityLog.entity_type,
            ~ActivityLog.event_type.in_(SYSTEM_SETTING_EVENT_TYPES),
        ),
        "system_setting_event_types": distinct_values(
            ActivityLog,
            ActivityLog.event_type,
            ActivityLog.event_type.in_(SYSTEM_SETTING_EVENT_TYPES),
        ),
        "email_types": distinct_values(EmailQueue, EmailQueue.email_type),
        "email_statuses": distinct_values(EmailQueue, EmailQueue.status),
        "cron_job_names": distinct_values(CronJobLog, CronJobLog.job_name),
        "cron_statuses": distinct_values(CronJobLog, CronJobLog.status),
    }


@router.get("/system-settings", response_model=ActivityLogListResponse)
def list_system_setting_logs(
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    search: str | None = None,
    event_type: str | None = None,
    user: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    filters = ActivityLog.event_type.in_(SYSTEM_SETTING_EVENT_TYPES)
    filter_conditions = [filters]

    if search:
        search_pattern = f"%{search.strip()}%"
        filter_conditions.append(or_(
            ActivityLog.event_type.ilike(search_pattern),
            ActivityLog.description.ilike(search_pattern),
            ActivityLog.details.ilike(search_pattern),
        ))
    if event_type:
        filter_conditions.append(ActivityLog.event_type.ilike(f"%{event_type.strip()}%"))
    if user:
        user_pattern = f"%{user.strip()}%"
        filter_conditions.append(or_(
            ActivityLog.user_full_name.ilike(user_pattern),
            ActivityLog.user_email.ilike(user_pattern),
        ))
    if date_from:
        filter_conditions.append(ActivityLog.created_at >= date_start(date_from))
    if date_to:
        filter_conditions.append(ActivityLog.created_at <= date_end(date_to))

    filters = tuple(filter_conditions)
    total = db.execute(select(func.count()).select_from(ActivityLog).where(*filters)).scalar_one()
    items = db.execute(
        select(ActivityLog)
        .where(*filters)
        .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/emails", response_model=EmailLogListResponse)
def list_email_logs(
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    search: str | None = None,
    email_type: str | None = None,
    status: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    filters = []
    if search:
        search_pattern = f"%{search.strip()}%"
        filters.append(or_(
            EmailQueue.recipient.ilike(search_pattern),
            EmailQueue.subject.ilike(search_pattern),
            EmailQueue.last_error.ilike(search_pattern),
        ))
    if email_type:
        filters.append(EmailQueue.email_type.ilike(f"%{email_type.strip()}%"))
    if status:
        filters.append(EmailQueue.status == status)
    if date_from:
        filters.append(EmailQueue.created_at >= date_start(date_from))
    if date_to:
        filters.append(EmailQueue.created_at <= date_end(date_to))

    total = db.execute(select(func.count()).select_from(EmailQueue).where(*filters)).scalar_one()
    items = db.execute(
        select(EmailQueue)
        .where(*filters)
        .order_by(EmailQueue.created_at.desc(), EmailQueue.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/cronjobs", response_model=CronJobLogListResponse)
def list_cron_job_logs(
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    search: str | None = None,
    job_name: str | None = None,
    status: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    filters = []
    if search:
        search_pattern = f"%{search.strip()}%"
        filters.append(or_(
            CronJobLog.job_name.ilike(search_pattern),
            CronJobLog.message.ilike(search_pattern),
            CronJobLog.error.ilike(search_pattern),
        ))
    if job_name:
        filters.append(CronJobLog.job_name.ilike(f"%{job_name.strip()}%"))
    if status:
        filters.append(CronJobLog.status == status)
    if date_from:
        filters.append(CronJobLog.started_at >= date_start(date_from))
    if date_to:
        filters.append(CronJobLog.started_at <= date_end(date_to))

    total = db.execute(select(func.count()).select_from(CronJobLog).where(*filters)).scalar_one()
    items = db.execute(
        select(CronJobLog)
        .where(*filters)
        .order_by(CronJobLog.started_at.desc(), CronJobLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/emails/{email_id}/send", response_model=EmailLogResponse)
async def send_email_log_now(email_id: int):
    item = await asyncio.to_thread(send_email_queue_item_now, email_id)
    if not item:
        raise HTTPException(status_code=404, detail="Email log not found")

    return item
