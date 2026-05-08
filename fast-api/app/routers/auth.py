from typing import Annotated
from datetime import datetime, timedelta
import hashlib
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.database import get_db
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.auth import ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.mail_service import is_mail_configured, send_password_reset_email
from app.services.auth_service import get_user_by_email
from app.services.auth_service import login_user, register_user
from app.services.system_settings_service import get_settings_map

router = APIRouter(prefix="/auth", tags=["auth"])


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _create_password_reset_token(db: Session, user_id: int) -> str:
    token = secrets.token_urlsafe(48)
    expires_at = datetime.utcnow() + timedelta(minutes=30)

    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user_id).delete(
        synchronize_session=False,
    )
    reset_token = PasswordResetToken(
        token_hash=_hash_reset_token(token),
        user_id=user_id,
        expires_at=expires_at,
    )
    db.add(reset_token)
    db.commit()
    return token


def _get_password_reset_token(db: Session, token: str) -> PasswordResetToken:
    reset_token = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == _hash_reset_token(token))
        .first()
    )

    if not reset_token:
        raise HTTPException(status_code=400, detail="Password reset link is invalid or expired")

    if reset_token.expires_at < datetime.utcnow():
        db.delete(reset_token)
        db.commit()
        raise HTTPException(status_code=400, detail="Password reset link is invalid or expired")

    return reset_token


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    data: RegisterRequest,
    db: Annotated[Session, Depends(get_db)],
):
    try:
        return register_user(
            db=db,
            email=data.email,
            password=data.password,
            full_name=data.full_name,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
):
    token, user, error = login_user(db, data.email, data.password)

    if error == "invalid_credentials":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if error == "inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive. Please contact administrator.",
        )

    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "country": user.country,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "created_at": user.created_at,
            "last_login_at": user.last_login_at,
            "roles": [role.name for role in user.roles],
        },
    }


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
):
    user = get_user_by_email(db, data.email)

    if user and is_mail_configured(db):
        values = get_settings_map(db)
        base_url = (values.get("app_base_url") or "http://127.0.0.1:5173").rstrip("/")
        token = _create_password_reset_token(db, user.id)
        reset_url = f"{base_url}/reset-password?token={token}"
        try:
            send_password_reset_email(db, user.email, user.full_name, reset_url)
        except Exception:
            db.query(PasswordResetToken).filter(
                PasswordResetToken.token_hash == _hash_reset_token(token),
            ).delete(synchronize_session=False)
            db.commit()
            pass

    return {
        "message": "If this email exists, password reset instructions will be sent shortly.",
    }


@router.get("/reset-password/validate")
def validate_reset_password_token(
    token: str,
    db: Annotated[Session, Depends(get_db)],
):
    _get_password_reset_token(db, token)
    return {"message": "Password reset link is valid."}


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    reset_token = _get_password_reset_token(db, data.token)
    user = db.get(User, reset_token.user_id)
    if not user:
        db.delete(reset_token)
        db.commit()
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(data.password)
    db.delete(reset_token)
    db.commit()

    return {"message": "Password has been reset successfully. You can now login."}
