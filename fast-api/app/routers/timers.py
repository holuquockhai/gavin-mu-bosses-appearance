from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.timer import BossHistory, BossTimer
from app.models.user import User
from app.schemas.timer import BossAppearedRequest, BossHistoryResponse, BossTimerCreate, BossTimerResponse, BossTimerStateResponse
from app.services.timer_service import complete_expired_timers
from app.services.websocket_manager import websocket_manager

router = APIRouter(prefix="/boss-timers", tags=["boss-timers"])


def to_utc_naive(value: datetime) -> datetime:
    if value.tzinfo:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def get_latest_history(db: Session) -> list[BossHistory]:
    return (
        db.query(BossHistory)
        .order_by(BossHistory.completed_at.desc(), BossHistory.id.desc())
        .limit(5)
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
        db.delete(timer)
        db.commit()
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
    )
    db.add(history)
    db.delete(timer)
    db.commit()
    db.refresh(history)
    await websocket_manager.broadcast({
        "type": "timer_state_updated",
        "action": "appeared",
        "boss_id": history.boss_id,
        "channel": history.channel,
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
        })
        await websocket_manager.broadcast({"type": "notifications_updated"})

    return history_items
