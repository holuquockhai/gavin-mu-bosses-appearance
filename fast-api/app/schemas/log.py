from datetime import datetime

from pydantic import BaseModel


class ActivityLogResponse(BaseModel):
    id: int
    event_type: str
    entity_type: str | None = None
    entity_id: int | None = None
    description: str
    details: str | None = None
    user_id: int | None = None
    user_full_name: str | None = None
    user_email: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityLogListResponse(BaseModel):
    items: list[ActivityLogResponse]
    total: int
    page: int
    page_size: int


class EmailLogResponse(BaseModel):
    id: int
    email_type: str
    recipient: str
    subject: str
    status: str
    attempts: int
    last_error: str | None = None
    next_attempt_at: datetime | None = None
    sent_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmailLogListResponse(BaseModel):
    items: list[EmailLogResponse]
    total: int
    page: int
    page_size: int


class CronJobLogResponse(BaseModel):
    id: int
    job_name: str
    status: str
    processed_count: int
    message: str | None = None
    error: str | None = None
    started_at: datetime
    finished_at: datetime | None = None

    model_config = {"from_attributes": True}


class CronJobLogListResponse(BaseModel):
    items: list[CronJobLogResponse]
    total: int
    page: int
    page_size: int
