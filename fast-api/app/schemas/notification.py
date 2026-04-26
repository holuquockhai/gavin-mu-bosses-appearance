from datetime import datetime
from typing import Any
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    type: str
    payload: dict[str, Any]
    created_at: datetime | None = None


class NotificationResponse(BaseModel):
    id: int
    type: str
    payload: dict[str, Any]
    created_at: datetime
    user_id: int

    model_config = {"from_attributes": True}
