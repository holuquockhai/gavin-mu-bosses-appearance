from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(80), nullable=False)
    payload = Column(JSON, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")


class NotificationDismissal(Base):
    __tablename__ = "notification_dismissals"
    __table_args__ = (
        UniqueConstraint("notification_id", "user_id", name="uq_notification_dismissal_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dismissed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    notification = relationship("Notification")
    user = relationship("User")
