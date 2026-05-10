import json

from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.user import User
from app.services.websocket_manager import websocket_manager

SYSTEM_SETTING_EVENT_TYPES = {
    "branding_settings_saved",
    "factory_reset_completed",
    "mysql_database_backup_downloaded",
    "mysql_database_restored",
    "system_settings_backup_downloaded",
    "system_settings_restored",
    "system_settings_saved",
}


def log_activity(
    db: Session,
    event_type: str,
    description: str,
    user: User | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
    details: dict | None = None,
    commit: bool = True,
) -> ActivityLog:
    activity = ActivityLog(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        details=json.dumps(details, default=str) if details else None,
        user_id=user.id if user else None,
        user_full_name=user.full_name if user else None,
        user_email=user.email if user else None,
    )
    db.add(activity)

    if commit:
        db.commit()
        db.refresh(activity)
        websocket_manager.broadcast_later({
            "type": "logs_updated",
            "scope": "system-settings" if event_type in SYSTEM_SETTING_EVENT_TYPES else "activities",
        })

    return activity
