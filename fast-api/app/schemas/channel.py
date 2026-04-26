from datetime import datetime

from pydantic import BaseModel, EmailStr


class ChannelCreate(BaseModel):
    name: str


class ChannelUpdate(BaseModel):
    name: str


class ChannelUserInfo(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None

    model_config = {"from_attributes": True}


class ChannelResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    created_by_id: int | None = None
    updated_by_id: int | None = None
    created_by: ChannelUserInfo | None = None
    updated_by: ChannelUserInfo | None = None

    model_config = {"from_attributes": True}
