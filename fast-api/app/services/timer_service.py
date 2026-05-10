from datetime import datetime

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.timer import BossHistory, BossTimer
from app.services.activity_log_service import log_activity


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
