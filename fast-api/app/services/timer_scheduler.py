import asyncio
from contextlib import suppress

from app.db.database import SessionLocal
from app.services.timer_service import complete_expired_timers
from app.services.websocket_manager import websocket_manager

EXPIRED_TIMER_CHECK_INTERVAL_SECONDS = 3


async def run_expired_timer_checker() -> None:
    while True:
        db = SessionLocal()
        try:
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
