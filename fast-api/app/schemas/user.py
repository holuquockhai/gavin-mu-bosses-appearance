from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.schemas.rbac import RoleResponse


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str | None = None
    is_active: bool = True


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6)
    full_name: str | None = None
    phone_number: str | None = None
    country: str | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    phone_number: str | None = None
    country: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None = None
    roles: list[RoleResponse] = []

    model_config = {"from_attributes": True}


class UserPublicProfileResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    phone_number: str | None = None
    country: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    created_at: datetime
    last_login_at: datetime | None = None

    model_config = {"from_attributes": True}
