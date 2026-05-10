from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.email_queue import EmailQueue
from app.services.email_scheduler import EMAIL_QUEUE_DELAY_SECONDS, wake_email_queue_worker
from app.services.mail_service import (
    build_account_activated_email,
    build_account_deleted_email,
    build_account_inactive_email,
    build_password_reset_email,
)
from app.services.websocket_manager import websocket_manager


def enqueue_email(
    db: Session,
    email_type: str,
    recipient: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
) -> EmailQueue:
    queued_email = EmailQueue(
        email_type=email_type,
        recipient=recipient,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
        status="pending",
        next_attempt_at=datetime.utcnow() + timedelta(seconds=EMAIL_QUEUE_DELAY_SECONDS),
    )
    db.add(queued_email)
    db.commit()
    db.refresh(queued_email)
    wake_email_queue_worker()
    websocket_manager.broadcast_later({"type": "email_logs_updated"})
    return queued_email


def enqueue_password_reset_email(db: Session, recipient: str, full_name: str | None, reset_url: str) -> EmailQueue:
    subject, text_body, html_body = build_password_reset_email(db, recipient, full_name, reset_url)
    return enqueue_email(db, "password_reset", recipient, subject, text_body, html_body)


def enqueue_account_activated_email(
    db: Session,
    recipient: str,
    full_name: str | None,
    login_url: str,
    initial_password: str | None = None,
) -> EmailQueue:
    subject, text_body, html_body = build_account_activated_email(db, recipient, full_name, login_url, initial_password)
    return enqueue_email(db, "account_activated", recipient, subject, text_body, html_body)


def enqueue_account_inactive_email(
    db: Session,
    recipient: str,
    full_name: str | None,
    footer_note: str = "This message was sent because someone tried to sign in with this inactive account.",
) -> EmailQueue:
    subject, text_body, html_body = build_account_inactive_email(db, recipient, full_name, footer_note)
    return enqueue_email(db, "account_inactive", recipient, subject, text_body, html_body)


def enqueue_account_deleted_email(db: Session, recipient: str, full_name: str | None) -> EmailQueue:
    subject, text_body, html_body = build_account_deleted_email(db, recipient, full_name)
    return enqueue_email(db, "account_deleted", recipient, subject, text_body, html_body)
