from datetime import datetime

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str | None = None
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class UserLoginResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    phone_number: str | None = None
    country: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    must_update_password: bool = False
    created_at: datetime
    last_login_at: datetime | None = None
    roles: list[str]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserLoginResponse
