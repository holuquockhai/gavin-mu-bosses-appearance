import asyncio
from contextlib import suppress

from app.db.database import SessionLocal
from app.services.timer_service import complete_expired_timers, create_due_timer_reminders
from app.services.websocket_manager import websocket_manager

# Browser clients try to complete expired timers immediately; this is the server fallback for closed or offline clients.
EXPIRED_TIMER_CHECK_INTERVAL_SECONDS = 3


async def run_expired_timer_checker() -> None:
    while True:
        db = SessionLocal()
        try:
            reminder_timers = create_due_timer_reminders(db)
            if reminder_timers:
                await websocket_manager.broadcast({
                    "type": "timer_reminder_due",
                    "minutes_remaining": 5,
                    "items": [
                        {
                            "boss_id": timer.boss_id,
                            "boss_name": timer.boss_name,
                            "channel": timer.channel,
                            "end_at": timer.end_at.isoformat(),
                        }
                        for timer in reminder_timers
                    ],
                })
                await websocket_manager.broadcast({"type": "notifications_updated"})
                await websocket_manager.broadcast({"type": "logs_updated", "scope": "activities"})

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
        except Exception:
            db.rollback()
        finally:
            db.close()

        await asyncio.sleep(EXPIRED_TIMER_CHECK_INTERVAL_SECONDS)


def start_expired_timer_checker() -> asyncio.Task:
    return asyncio.create_task(run_expired_timer_checker())


async def stop_expired_timer_checker(task: asyncio.Task | None) -> None:
    if not task:
        return

    task.cancel()
    with suppress(asyncio.CancelledError):
        await task
