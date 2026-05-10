from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session, selectinload

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.timer import BossHistory, BossTimer
from app.models.user import User
from app.schemas.timer import (
    BossAppearedRequest,
    BossHistoryListResponse,
    BossHistoryResponse,
    BossTimerCreate,
    BossTimerListResponse,
    BossTimerResponse,
    BossTimerStateResponse,
)
from app.services.activity_log_service import log_activity
from app.services.timer_service import complete_expired_timers
from app.services.websocket_manager import websocket_manager

router = APIRouter(prefix="/boss-timers", tags=["boss-timers"])


def to_utc_naive(value: datetime) -> datetime:
    if value.tzinfo:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def get_latest_history(db: Session, limit: int = 100) -> list[BossHistory]:
    return (
        db.query(BossHistory)
        .options(selectinload(BossHistory.user))
        .order_by(BossHistory.completed_at.desc(), BossHistory.id.desc())
        .limit(limit)
        .all()
    )


@router.get("/", response_model=BossTimerStateResponse)
def list_timer_state(
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    complete_expired_timers(db, create_notifications=True)
    timers = db.query(BossTimer).all()
    return {"timers": timers, "history": get_latest_history(db)}


@router.get("/coming-soon", response_model=BossTimerListResponse)
def list_coming_soon_timers(
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 8,
):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    complete_expired_timers(db, create_notifications=True)
    query = db.query(BossTimer).order_by(BossTimer.end_at.asc(), BossTimer.id.asc())
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return {"items": items, "total": total, "offset": offset, "limit": limit}


@router.get("/history", response_model=BossHistoryListResponse)
def list_history(
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 5,
):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    query = (
        db.query(BossHistory)
        .options(selectinload(BossHistory.user))
        .order_by(BossHistory.completed_at.desc(), BossHistory.id.desc())
    )
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return {"items": items, "total": total, "offset": offset, "limit": limit}


@router.post("/", response_model=BossTimerResponse)
async def upsert_timer(
    data: BossTimerCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    timer = (
        db.query(BossTimer)
        .filter(
            BossTimer.boss_id == data.boss_id,
            BossTimer.channel == data.channel,
        )
        .first()
    )

    if timer is None:
        timer = BossTimer(user_id=current_user.id)
        db.add(timer)

    timer.boss_id = data.boss_id
    timer.boss_name = data.boss_name
    timer.channel = data.channel
    timer.hours = data.hours
    timer.minutes = data.minutes
    timer.end_at = to_utc_naive(data.end_at)
    timer.user_id = current_user.id

    db.commit()
    db.refresh(timer)
    log_activity(
        db,
        event_type="boss_timer_set",
        entity_type="boss_timer",
        entity_id=timer.id,
        description=f'{current_user.full_name or current_user.email} set timer for "{timer.boss_name}" on "{timer.channel}"',
        details={
            "boss_id": timer.boss_id,
            "boss_name": timer.boss_name,
            "channel": timer.channel,
            "hours": timer.hours,
            "minutes": timer.minutes,
            "end_at": timer.end_at,
        },
        user=current_user,
    )
    await websocket_manager.broadcast({
        "type": "timer_state_updated",
        "action": "set",
        "boss_id": timer.boss_id,
        "channel": timer.channel,
    })
    await websocket_manager.broadcast({"type": "notifications_updated"})
    return timer


@router.delete("/")
async def clear_timer(
    boss_id: Annotated[int, Query()],
    channel: Annotated[str, Query()],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    timer = (
        db.query(BossTimer)
        .filter(
            BossTimer.boss_id == boss_id,
            BossTimer.channel == channel,
        )
        .first()
    )

    if timer:
        boss_name = timer.boss_name
        db.delete(timer)
        db.commit()
        log_activity(
            db,
            event_type="boss_timer_cleared",
            entity_type="boss_timer",
            entity_id=boss_id,
            description=f'{current_user.full_name or current_user.email} cleared timer for "{boss_name}" on "{channel}"',
            details={"boss_id": boss_id, "boss_name": boss_name, "channel": channel},
            user=current_user,
        )
        await websocket_manager.broadcast({
            "type": "timer_state_updated",
            "action": "clear",
            "boss_id": boss_id,
            "channel": channel,
        })

    return {"message": "Timer cleared"}


@router.post("/appeared", response_model=BossHistoryResponse)
async def mark_appeared(
    data: BossAppearedRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    timer = (
        db.query(BossTimer)
        .filter(
            BossTimer.boss_id == data.boss_id,
            BossTimer.channel == data.channel,
        )
        .first()
    )

    if not timer:
        raise HTTPException(status_code=404, detail="Timer not found")

    history = BossHistory(
        boss_id=timer.boss_id,
        boss_name=timer.boss_name,
        channel=timer.channel,
        completed_at=to_utc_naive(data.completed_at) if data.completed_at else datetime.utcnow(),
        user_id=current_user.id,
        appeared_by_name=current_user.full_name or current_user.email,
        appeared_by_type="user",
    )
    db.add(history)
    db.delete(timer)
    db.commit()
    db.refresh(history)
    log_activity(
        db,
        event_type="boss_appeared",
        entity_type="boss_history",
        entity_id=history.id,
        description=f'{current_user.full_name or current_user.email} marked "{history.boss_name}" appeared on "{history.channel}"',
        details={"boss_id": history.boss_id, "boss_name": history.boss_name, "channel": history.channel},
        user=current_user,
    )
    await websocket_manager.broadcast({
        "type": "timer_state_updated",
        "action": "appeared",
        "boss_id": history.boss_id,
        "boss_name": history.boss_name,
        "channel": history.channel,
        "actor_user_id": current_user.id,
    })
    await websocket_manager.broadcast({"type": "notifications_updated"})
    return history


@router.post("/complete-expired", response_model=list[BossHistoryResponse])
async def complete_expired(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    history_items = complete_expired_timers(db, create_notifications=True)
    if history_items:
        await websocket_manager.broadcast({
            "type": "timer_state_updated",
            "action": "expired",
            "items": [
                {
                    "boss_id": history.boss_id,
                    "boss_name": history.boss_name,
                    "channel": history.channel,
                }
                for history in history_items
            ],
        })
        await websocket_manager.broadcast({"type": "notifications_updated"})
        await websocket_manager.broadcast({"type": "logs_updated", "scope": "activities"})

    return history_items
