from datetime import datetime

from pydantic import BaseModel, Field


class ChatUserResponse(BaseModel):
    id: int
    full_name: str | None = None
    email: str
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class ChatMessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class ChatMessageResponse(BaseModel):
    id: int
    message: str
    created_at: datetime
    user: ChatUserResponse

    model_config = {"from_attributes": True}
