from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.notification import Notification, NotificationDismissal
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationResponse
from app.services.websocket_manager import websocket_manager

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationResponse])
def list_notifications(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
):
    dismissed_notification_ids = (
        db.query(NotificationDismissal.notification_id)
        .filter(NotificationDismissal.user_id == current_user.id)
    )

    return (
        db.query(Notification)
        .options(joinedload(Notification.user))
        .filter(~Notification.id.in_(dismissed_notification_ids))
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(limit)
        .all()
    )


@router.post("/", response_model=NotificationResponse)
async def create_notification(
    data: NotificationCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    notification = Notification(
        type=data.type,
        payload=data.payload,
        user_id=current_user.id,
    )
    if data.created_at:
        notification.created_at = data.created_at

    db.add(notification)
    db.commit()
    db.refresh(notification)
    await websocket_manager.broadcast({"type": "notifications_updated"})
    return (
        db.query(Notification)
        .options(joinedload(Notification.user))
        .filter(Notification.id == notification.id)
        .first()
    )


@router.delete("/{notification_id}")
async def remove_notification(
    notification_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )

    if notification:
        dismissal = (
            db.query(NotificationDismissal)
            .filter(
                NotificationDismissal.notification_id == notification_id,
                NotificationDismissal.user_id == current_user.id,
            )
            .first()
        )
        if not dismissal:
            db.add(
                NotificationDismissal(
                    notification_id=notification_id,
                    user_id=current_user.id,
                )
            )
        db.commit()
        await websocket_manager.broadcast({"type": "notifications_updated"})

    return {"message": "Notification removed"}


@router.delete("/")
async def clear_notifications(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    existing_dismissed_ids = {
        notification_id
        for (notification_id,) in (
            db.query(NotificationDismissal.notification_id)
            .filter(NotificationDismissal.user_id == current_user.id)
            .all()
        )
    }
    notification_ids = [
        notification_id
        for (notification_id,) in db.query(Notification.id).all()
        if notification_id not in existing_dismissed_ids
    ]

    for notification_id in notification_ids:
        db.add(
            NotificationDismissal(
                notification_id=notification_id,
                user_id=current_user.id,
            )
        )

    db.commit()
    await websocket_manager.broadcast({"type": "notifications_updated"})
    return {"message": "Notifications cleared"}
