from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.timer import BossHistory, BossTimer
from app.services.activity_log_service import log_activity

BOSS_REMINDER_WINDOW_MINUTES = 5


def create_due_timer_reminders(db: Session) -> list[BossTimer]:
    now = datetime.utcnow()
    reminder_due_at = now + timedelta(minutes=BOSS_REMINDER_WINDOW_MINUTES)
    timers = (
        db.query(BossTimer)
        .filter(BossTimer.end_at > now)
        .filter(BossTimer.end_at <= reminder_due_at)
        .filter(BossTimer.reminder_sent.is_(False))
        .with_for_update()
        .all()
    )

    for timer in timers:
        timer.reminder_sent = True
        db.add(
            Notification(
                type="boss-reminder",
                payload={
                    "bossId": timer.boss_id,
                    "bossName": timer.boss_name,
                    "channel": timer.channel,
                    "minutesRemaining": BOSS_REMINDER_WINDOW_MINUTES,
                    "endAt": timer.end_at.isoformat(),
                },
                user_id=timer.user_id,
                created_at=now,
            )
        )
        log_activity(
            db,
            event_type="boss_timer_reminder",
            entity_type="boss_timer",
            entity_id=timer.id,
            description=f'Boss "{timer.boss_name}" on "{timer.channel}" is due in {BOSS_REMINDER_WINDOW_MINUTES} minutes',
            details={
                "boss_id": timer.boss_id,
                "boss_name": timer.boss_name,
                "channel": timer.channel,
                "minutes_remaining": BOSS_REMINDER_WINDOW_MINUTES,
            },
            commit=False,
        )

    if timers:
        db.commit()

        for timer in timers:
            db.refresh(timer)

    return timers


def complete_expired_timers(db: Session, create_notifications: bool = False) -> list[BossHistory]:
    now = datetime.utcnow()
    expired_timers = (
        db.query(BossTimer)
        .filter(BossTimer.end_at <= now)
        .with_for_update()
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
            appeared_by_name="System",
            appeared_by_type="system",
        )
        db.add(history)

        if create_notifications:
            db.add(
                Notification(
                    type="boss-appeared",
                    payload={
                        "bossId": timer.boss_id,
                        "bossName": timer.boss_name,
                        "channel": timer.channel,
                    },
                    user_id=timer.user_id,
                    created_at=now,
                )
            )

        db.delete(timer)
        history_items.append(history)
        log_activity(
            db,
            event_type="boss_timer_expired",
            entity_type="boss_history",
            entity_id=timer.boss_id,
            description=f'Boss "{timer.boss_name}" appeared on "{timer.channel}" after timer expired',
            details={"boss_id": timer.boss_id, "boss_name": timer.boss_name, "channel": timer.channel},
            commit=False,
        )

    if history_items:
        db.commit()

        for history in history_items:
            db.refresh(history)

    return history_items
