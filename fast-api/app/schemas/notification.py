from datetime import datetime
from typing import Any
from pydantic import BaseModel

from app.schemas.user import UserPublicProfileResponse


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
    user: UserPublicProfileResponse | None = None

    model_config = {"from_attributes": True}
