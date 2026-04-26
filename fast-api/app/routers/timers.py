from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.timer import BossHistory, BossTimer
from app.models.user import User
from app.schemas.timer import BossAppearedRequest, BossHistoryResponse, BossTimerCreate, BossTimerResponse, BossTimerStateResponse

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
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    timers = db.query(BossTimer).all()
    return {"timers": timers, "history": get_latest_history(db)}


@router.post("/", response_model=BossTimerResponse)
def upsert_timer(
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

    db.commit()
    db.refresh(timer)
    return timer


@router.delete("/")
def clear_timer(
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

    return {"message": "Timer cleared"}


@router.post("/appeared", response_model=BossHistoryResponse)
def mark_appeared(
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
    return history


@router.post("/complete-expired", response_model=list[BossHistoryResponse])
def complete_expired(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    now = datetime.utcnow()
    expired_timers = (
        db.query(BossTimer)
        .filter(BossTimer.end_at <= now)
        .all()
    )
    history_items = []

    for timer in expired_timers:
        history = BossHistory(
            boss_id=timer.boss_id,
            boss_name=timer.boss_name,
            channel=timer.channel,
            completed_at=now,
            user_id=timer.user_id,
        )
        db.add(history)
        db.delete(timer)
        history_items.append(history)

    db.commit()

    for history in history_items:
        db.refresh(history)

    return history_items
