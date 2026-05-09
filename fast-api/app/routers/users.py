import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password
from app.db.database import get_db
from app.dependencies.auth import get_current_user, require_permissions
from app.models.boss import Boss
from app.models.channel import Channel
from app.models.notification import Notification, NotificationDismissal
from app.models.password_reset_token import PasswordResetToken
from app.models.preset import Preset
from app.models.role import Role
from app.models.timer import BossHistory, BossTimer
from app.models.user import User
from app.schemas.user import UserCreate, UserPublicProfileResponse, UserResponse, UserUpdate
from app.services.mail_service import is_mail_configured, send_account_activated_email, send_account_inactive_email
from app.services.system_settings_service import get_settings_map
from app.services.websocket_manager import websocket_manager

# Users Router
router = APIRouter(prefix="/users", tags=["users"])

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "avatars"
ALLOWED_AVATAR_TYPES = {
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _get_role_by_name(db: Session, role_name: str) -> Role:
    allowed_roles = {"user", "admin"}
    if role_name not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be user or admin",
        )

    role = db.execute(select(Role).where(Role.name == role_name)).scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Role '{role_name}' does not exist",
        )

    return role


def _get_user_by_id(db: Session, user_id: int) -> User:
    stmt = (
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .where(User.id == user_id)
    )
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


def _email_exists(db: Session, email: str, exclude_user_id: int | None = None) -> bool:
    stmt = select(User).where(User.email == email)
    if exclude_user_id is not None:
        stmt = stmt.where(User.id != exclude_user_id)

    return db.execute(stmt).scalar_one_or_none() is not None


def _send_account_active_email_if_configured(db: Session, user: User) -> None:
    if not is_mail_configured(db):
        return

    values = get_settings_map(db)
    base_url = (values.get("app_base_url") or "http://127.0.0.1:5173").rstrip("/")
    try:
        send_account_activated_email(db, user.email, user.full_name, f"{base_url}/login")
    except Exception:
        pass


def _send_account_inactive_email_if_configured(db: Session, user: User) -> None:
    if not is_mail_configured(db):
        return

    try:
        send_account_inactive_email(
            db,
            user.email,
            user.full_name,
            "This message was sent because an administrator changed your account status to inactive.",
        )
    except Exception:
        pass


# Get current user Router
@router.get("/me", response_model=UserResponse)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me/profile", response_model=UserResponse)
def update_my_profile(
    full_name: str | None = Form(default=None),
    phone_number: str | None = Form(default=None),
    country: str | None = Form(default=None),
    bio: str | None = Form(default=None),
    password: str | None = Form(default=None),
    avatar: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = _get_user_by_id(db, current_user.id)

    if full_name is not None:
        user.full_name = full_name.strip() or None

    if phone_number is not None:
        user.phone_number = phone_number.strip() or None

    if country is not None:
        user.country = country.strip() or None

    if bio is not None:
        user.bio = bio.strip() or None

    if password:
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        user.hashed_password = hash_password(password)

    if avatar and avatar.filename:
        extension = ALLOWED_AVATAR_TYPES.get(avatar.content_type or "")
        if not extension:
            raise HTTPException(status_code=400, detail="Avatar must be a PNG, JPG, GIF, or WEBP image")

        UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
        filename = f"user-{user.id}-{uuid4().hex}{extension}"
        avatar_path = UPLOAD_ROOT / filename

        with avatar_path.open("wb") as file_object:
            shutil.copyfileobj(avatar.file, file_object)

        user.avatar_url = f"/uploads/avatars/{filename}"

    db.commit()
    db.refresh(user)
    return _get_user_by_id(db, user.id)


@router.get("/profile/{user_id}", response_model=UserPublicProfileResponse)
def read_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_user_by_id(db, user_id)


# get user Router
@router.get(
    "/",
    response_model=list[UserResponse],
    dependencies=[Depends(require_permissions(["user:read"]))],
)
def list_users(response: Response, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    stmt = (
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .order_by(User.id.desc())
    )
    return db.execute(stmt).scalars().all()

# Create user
@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions(["user:create"]))],
)
async def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    if _email_exists(db, payload.email):
        raise HTTPException(status_code=400, detail=f'User email "{payload.email}" already exists')

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        is_active=payload.is_active,
    )
    user.roles.append(_get_role_by_name(db, payload.role))

    db.add(user)
    db.commit()
    db.refresh(user)

    if user.is_active:
        _send_account_active_email_if_configured(db, user)

    created_user = _get_user_by_id(db, user.id)
    await websocket_manager.broadcast({"type": "users_updated", "action": "create"})
    return created_user


# Update user
@router.put(
    "/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(require_permissions(["user:update"]))],
)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = _get_user_by_id(db, user_id)
    was_inactive = not user.is_active
    was_active = user.is_active
    data = payload.model_dump(exclude_unset=True)

    if user_id == current_user.id and data.get("is_active") is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    if "email" in data:
        if _email_exists(db, data["email"], exclude_user_id=user_id):
            raise HTTPException(status_code=400, detail=f'User email "{data["email"]}" already exists')
        user.email = data["email"]

    if "full_name" in data:
        user.full_name = data["full_name"]

    if "phone_number" in data:
        user.phone_number = data["phone_number"]

    if "country" in data:
        user.country = data["country"]

    if "is_active" in data:
        user.is_active = data["is_active"]

    if "role" in data:
        user.roles = [_get_role_by_name(db, data["role"])]

    if data.get("password"):
        user.hashed_password = hash_password(data["password"])

    db.commit()
    db.refresh(user)

    if was_inactive and user.is_active:
        _send_account_active_email_if_configured(db, user)

    if was_active and not user.is_active:
        _send_account_inactive_email_if_configured(db, user)

    updated_user = _get_user_by_id(db, user.id)
    await websocket_manager.broadcast({"type": "users_updated", "action": "update"})
    return updated_user

# Delete a user
@router.delete("/{user_id}", dependencies=[Depends(require_permissions(["user:delete"]))])
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = _get_user_by_id(db, user_id)

    db.query(Boss).filter(Boss.created_by_id == user.id).update(
        {Boss.created_by_id: current_user.id},
        synchronize_session=False,
    )
    db.query(Boss).filter(Boss.updated_by_id == user.id).update(
        {Boss.updated_by_id: current_user.id},
        synchronize_session=False,
    )
    db.query(Channel).filter(Channel.created_by_id == user.id).update(
        {Channel.created_by_id: current_user.id},
        synchronize_session=False,
    )
    db.query(Channel).filter(Channel.updated_by_id == user.id).update(
        {Channel.updated_by_id: current_user.id},
        synchronize_session=False,
    )
    db.query(BossTimer).filter(BossTimer.user_id == user.id).update(
        {BossTimer.user_id: current_user.id},
        synchronize_session=False,
    )
    db.query(BossHistory).filter(BossHistory.user_id == user.id).update(
        {BossHistory.user_id: current_user.id},
        synchronize_session=False,
    )
    db.query(Notification).filter(Notification.user_id == user.id).update(
        {Notification.user_id: current_user.id},
        synchronize_session=False,
    )
    db.query(NotificationDismissal).filter(NotificationDismissal.user_id == user.id).delete(
        synchronize_session=False,
    )
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete(
        synchronize_session=False,
    )
    db.query(Preset).filter(Preset.user_id == user.id).delete(
        synchronize_session=False,
    )

    user.roles.clear()
    db.delete(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="User cannot be deleted because it is linked to existing activity",
        )

    await websocket_manager.broadcast({"type": "users_updated", "action": "delete"})
    return {"message": f"User {user_id} deleted successfully"}
