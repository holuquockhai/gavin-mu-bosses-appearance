import asyncio
from contextlib import suppress
from datetime import datetime, timedelta
import logging

from sqlalchemy import or_, select

from app.db.database import SessionLocal
from app.models.email_queue import EmailQueue
from app.services.mail_service import send_email
from app.services.system_settings_service import get_settings_map
from app.services.websocket_manager import websocket_manager

EMAIL_QUEUE_DELAY_SECONDS = 300
EMAIL_QUEUE_IDLE_CHECK_SECONDS = 60
EMAIL_QUEUE_RETRY_DELAY_MINUTES = 5
EMAIL_QUEUE_MAX_ATTEMPTS = 3
EMAIL_QUEUE_BATCH_SIZE = 20
logger = logging.getLogger(__name__)

_email_queue_event: asyncio.Event | None = None
_email_queue_loop: asyncio.AbstractEventLoop | None = None


def wake_email_queue_worker() -> None:
    if not _email_queue_event or not _email_queue_loop:
        return

    _email_queue_loop.call_soon_threadsafe(_email_queue_event.set)


def _has_pending_email(include_delayed: bool = True) -> bool:
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        query = select(EmailQueue.id).where(EmailQueue.status == "pending")
        if not include_delayed:
            query = query.where(
                or_(
                    EmailQueue.next_attempt_at <= now,
                    EmailQueue.next_attempt_at.is_(None),
                )
            )

        return db.execute(query.limit(1)).scalar_one_or_none() is not None
    finally:
        db.close()


def _get_email_queue_batch_size(db) -> int:
    values = get_settings_map(db)
    try:
        batch_size = int(values.get("email_queue_batch_size") or EMAIL_QUEUE_BATCH_SIZE)
    except (TypeError, ValueError):
        batch_size = EMAIL_QUEUE_BATCH_SIZE

    return max(1, min(batch_size, 200))


def process_pending_email_batch(limit: int | None = None) -> int:
    db = SessionLocal()
    processed_count = 0
    try:
        now = datetime.utcnow()
        batch_size = limit or _get_email_queue_batch_size(db)
        pending_items = db.execute(
            select(EmailQueue)
            .where(
                EmailQueue.status == "pending",
                or_(
                    EmailQueue.next_attempt_at <= now,
                    EmailQueue.next_attempt_at.is_(None),
                ),
            )
            .order_by(EmailQueue.id.asc())
            .limit(batch_size)
        ).scalars().all()

        for item in pending_items:
            _send_email_queue_item(db, item)
            processed_count += 1
    finally:
        db.close()

    return processed_count


def _send_email_queue_item(db, item: EmailQueue) -> EmailQueue:
    item_id = item.id
    item.status = "sending"
    item.attempts += 1
    item.last_error = None
    db.commit()

    try:
        send_email(db, item.recipient, item.subject, item.text_body, item.html_body)
    except Exception as exc:
        db.rollback()
        item = db.get(EmailQueue, item_id)
        if not item:
            raise

        item.status = "failed" if item.attempts >= EMAIL_QUEUE_MAX_ATTEMPTS else "pending"
        item.last_error = str(exc)
        item.next_attempt_at = datetime.utcnow() + timedelta(minutes=EMAIL_QUEUE_RETRY_DELAY_MINUTES)
        db.commit()
        db.refresh(item)
        websocket_manager.broadcast_later({"type": "email_logs_updated"})
        return item

    item.status = "sent"
    item.sent_at = datetime.utcnow()
    item.last_error = None
    item.next_attempt_at = None
    db.commit()
    db.refresh(item)
    websocket_manager.broadcast_later({"type": "email_logs_updated"})
    return item


def send_email_queue_item_now(email_id: int) -> EmailQueue | None:
    db = SessionLocal()
    try:
        item = db.get(EmailQueue, email_id)
        if not item:
            return None

        return _send_email_queue_item(db, item)
    finally:
        db.close()


async def run_email_queue_worker() -> None:
    global _email_queue_event, _email_queue_loop

    _email_queue_loop = asyncio.get_running_loop()
    _email_queue_event = asyncio.Event()

    if _has_pending_email():
        _email_queue_event.set()

    while True:
        try:
            with suppress(asyncio.TimeoutError):
                await asyncio.wait_for(_email_queue_event.wait(), timeout=EMAIL_QUEUE_IDLE_CHECK_SECONDS)
            _email_queue_event.clear()

            processed_count = await asyncio.to_thread(process_pending_email_batch)

            if processed_count == 0 and not await asyncio.to_thread(_has_pending_email):
                await asyncio.sleep(EMAIL_QUEUE_IDLE_CHECK_SECONDS)
        except Exception:
            logger.exception("Email queue worker failed while processing pending emails")
            await asyncio.sleep(EMAIL_QUEUE_IDLE_CHECK_SECONDS)


def start_email_queue_worker() -> asyncio.Task:
    return asyncio.create_task(run_email_queue_worker())


async def stop_email_queue_worker(task: asyncio.Task | None) -> None:
    global _email_queue_event, _email_queue_loop

    if not task:
        return

    task.cancel()
    with suppress(asyncio.CancelledError):
        await task

    _email_queue_event = None
    _email_queue_loop = None
