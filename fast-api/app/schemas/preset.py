from typing import Any
from pydantic import BaseModel


class PresetCreate(BaseModel):
    name: str
    channels: dict[str, list[int]] = {}


class PresetUpdate(BaseModel):
    name: str | None = None
    channels: dict[str, list[int]] | None = None


class PresetChannelUpdate(BaseModel):
    channel: str
    boss_ids: list[int]


class PresetResponse(BaseModel):
    id: int
    name: str
    channels: dict[str, Any]
    user_id: int

    model_config = {"from_attributes": True}
