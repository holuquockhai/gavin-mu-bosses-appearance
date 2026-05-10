from typing import Annotated
import asyncio

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import func, select
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

SYSTEM_SETTING_EVENT_TYPES = ("system_settings_saved", "branding_settings_saved")

internal_router = APIRouter(prefix="/internal/logs", tags=["internal-logs"])

router = APIRouter(
    prefix="/admin/logs",
    tags=["admin-logs"],
    dependencies=[Depends(require_roles(["admin"]))],
)


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
):
    filters = ~ActivityLog.event_type.in_(SYSTEM_SETTING_EVENT_TYPES)
    total = db.execute(select(func.count()).select_from(ActivityLog).where(filters)).scalar_one()
    items = db.execute(
        select(ActivityLog)
        .where(filters)
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


@router.get("/system-settings", response_model=ActivityLogListResponse)
def list_system_setting_logs(
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
):
    filters = ActivityLog.event_type.in_(SYSTEM_SETTING_EVENT_TYPES)
    total = db.execute(select(func.count()).select_from(ActivityLog).where(filters)).scalar_one()
    items = db.execute(
        select(ActivityLog)
        .where(filters)
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
):
    total = db.execute(select(func.count()).select_from(EmailQueue)).scalar_one()
    items = db.execute(
        select(EmailQueue)
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
):
    total = db.execute(select(func.count()).select_from(CronJobLog)).scalar_one()
    items = db.execute(
        select(CronJobLog)
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
