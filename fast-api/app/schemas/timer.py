from datetime import datetime
from pydantic import BaseModel


class BossTimerBase(BaseModel):
    boss_id: int
    boss_name: str
    channel: str
    hours: int
    minutes: int
    end_at: datetime


class BossTimerCreate(BossTimerBase):
    pass


class BossTimerResponse(BossTimerBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


class BossAppearedRequest(BaseModel):
    boss_id: int
    channel: str
    completed_at: datetime | None = None


class BossHistoryResponse(BaseModel):
    id: int
    boss_id: int
    boss_name: str
    channel: str
    completed_at: datetime
    user_id: int

    model_config = {"from_attributes": True}


class BossTimerStateResponse(BaseModel):
    timers: list[BossTimerResponse]
    history: list[BossHistoryResponse]
