from datetime import datetime
from pydantic import BaseModel, EmailStr


class BossCreate(BaseModel):
    name: str

class BossUpdate(BaseModel):
    name: str

class BossUserInfo(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None

    model_config = {"from_attributes": True}

class BossResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    created_by_id: int
    updated_by_id: int
    created_by: BossUserInfo
    updated_by: BossUserInfo

    model_config = {"from_attributes": True}


class BossListResponse(BaseModel):
    items: list[BossResponse]
    total: int
    page: int
    page_size: int
