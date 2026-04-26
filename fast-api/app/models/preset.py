from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Preset(Base):
    __tablename__ = "presets"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_user_preset_name"),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    channels = Column(JSON, nullable=False, default=dict)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User")
