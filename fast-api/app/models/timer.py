from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class BossTimer(Base):
    __tablename__ = "boss_timers"
    __table_args__ = (UniqueConstraint("boss_id", "channel", name="uq_boss_channel_timer"),)

    id = Column(Integer, primary_key=True, index=True)
    boss_id = Column(Integer, ForeignKey("bosses.id"), nullable=False)
    boss_name = Column(String(255), nullable=False)
    channel = Column(String(80), nullable=False)
    hours = Column(Integer, nullable=False, default=0)
    minutes = Column(Integer, nullable=False, default=0)
    end_at = Column(DateTime(timezone=True), nullable=False)
    reminder_sent = Column(Boolean, nullable=False, default=False, server_default="0")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User")


class BossHistory(Base):
    __tablename__ = "boss_history"

    id = Column(Integer, primary_key=True, index=True)
    boss_id = Column(Integer, ForeignKey("bosses.id"), nullable=False)
    boss_name = Column(String(255), nullable=False)
    channel = Column(String(80), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appeared_by_name = Column(String(255), nullable=True)
    appeared_by_type = Column(String(40), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")
