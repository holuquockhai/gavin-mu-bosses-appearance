import asyncio
from contextlib import suppress

from app.db.database import SessionLocal
from app.services.timer_service import complete_expired_timers

EXPIRED_TIMER_CHECK_INTERVAL_SECONDS = 30


async def run_expired_timer_checker() -> None:
    while True:
        db = SessionLocal()
        try:
            complete_expired_timers(db, create_notifications=True)
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

