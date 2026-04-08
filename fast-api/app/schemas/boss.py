from datetime import datetime
from pydantic import BaseModel


class BossCreate(BaseModel):
    name: str


class BossResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}