from pydantic import BaseModel, EmailStr

from app.schemas.rbac import RoleResponse


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    is_active: bool
    roles: list[RoleResponse] = []

    model_config = {"from_attributes": True}