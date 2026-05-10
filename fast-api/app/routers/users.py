import shutil
import logging
from datetime import date, datetime, time
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password
from app.db.database import get_db
from app.dependencies.auth import get_current_user, require_permissions
from app.models.activity_log import ActivityLog
from app.models.boss import Boss
from app.models.channel import Channel
from app.models.notification import Notification, NotificationDismissal
from app.models.password_reset_token import PasswordResetToken
from app.models.preset import Preset
from app.models.role import Role
from app.models.timer import BossHistory, BossTimer
from app.models.user import User
from app.schemas.user import UserCreate, UserListResponse, UserPublicProfileResponse, UserResponse, UserUpdate
from app.services.activity_log_service import log_activity
from app.services.email_queue_service import (
    enqueue_account_activated_email,
    enqueue_account_deleted_email,
    enqueue_account_inactive_email,
)
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
logger = logging.getLogger(__name__)


def _date_start(value: date | None) -> datetime | None:
    return datetime.combine(value, time.min) if value else None


def _date_end(value: date | None) -> datetime | None:
    return datetime.combine(value, time.max) if value else None


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


def _send_account_active_email_if_configured(db: Session, user: User, initial_password: str | None = None) -> None:
    values = get_settings_map(db)
    base_url = (values.get("app_base_url") or "http://127.0.0.1:5173").rstrip("/")
    try:
        enqueue_account_activated_email(db, user.email, user.full_name, f"{base_url}/login", initial_password)
    except Exception:
        db.rollback()
        logger.exception("Could not queue account activation email for user %s", user.id)


def _send_account_inactive_email_if_configured(db: Session, user: User) -> None:
    try:
        enqueue_account_inactive_email(
            db,
            user.email,
            user.full_name,
            "This message was sent because an administrator changed your account status to inactive.",
        )
    except Exception:
        db.rollback()
        logger.exception("Could not queue inactive account email for user %s", user.id)


def _delete_user_upload_files(user_id: int, avatar_url: str | None) -> None:
    deleted_paths: set[Path] = set()

    if avatar_url and avatar_url.startswith("/uploads/avatars/"):
        avatar_path = UPLOAD_ROOT / Path(avatar_url).name
        deleted_paths.add(avatar_path)

    deleted_paths.update(UPLOAD_ROOT.glob(f"user-{user_id}-*"))

    for file_path in deleted_paths:
        try:
            if file_path.is_file() and file_path.resolve().parent == UPLOAD_ROOT.resolve():
                file_path.unlink()
        except Exception:
            logger.exception("Could not delete upload file %s for user %s", file_path, user_id)


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
        user.must_update_password = False

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
    response_model=list[UserResponse] | UserListResponse,
    dependencies=[Depends(require_permissions(["user:read"]))],
)
def list_users(
    response: Response,
    db: Session = Depends(get_db),
    page: int | None = Query(default=None, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    search: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    role: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"

    query = db.query(User).options(selectinload(User.roles).selectinload(Role.permissions))

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(or_(User.full_name.ilike(search_pattern), User.email.ilike(search_pattern)))
    if status_filter == "active":
        query = query.filter(User.is_active.is_(True))
    elif status_filter == "inactive":
        query = query.filter(User.is_active.is_(False))
    if role and role != "all":
        query = query.join(User.roles).filter(Role.name == role)
    if date_from:
        query = query.filter(User.created_at >= _date_start(date_from))
    if date_to:
        query = query.filter(User.created_at <= _date_end(date_to))

    query = query.order_by(User.id.desc())

    if page is None:
        return query.all()

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}

# Create user
@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions(["user:create"]))],
)
async def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if _email_exists(db, payload.email):
        raise HTTPException(status_code=400, detail=f'User email "{payload.email}" already exists')

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        is_active=payload.is_active,
        must_update_password=True,
    )
    user.roles.append(_get_role_by_name(db, payload.role))

    db.add(user)
    db.commit()
    db.refresh(user)

    if user.is_active:
        _send_account_active_email_if_configured(db, user, payload.password)
    else:
        _send_account_inactive_email_if_configured(db, user)

    log_activity(
        db,
        event_type="user_created",
        entity_type="user",
        entity_id=user.id,
        description=f'Created user "{user.full_name or user.email}"',
        details={"email": user.email, "role": payload.role, "is_active": user.is_active},
        user=current_user,
    )

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
        user.must_update_password = False

    db.commit()
    db.refresh(user)

    if was_inactive and user.is_active:
        _send_account_active_email_if_configured(db, user)

    if was_active and not user.is_active:
        _send_account_inactive_email_if_configured(db, user)

    log_activity(
        db,
        event_type="user_updated",
        entity_type="user",
        entity_id=user.id,
        description=f'Updated user "{user.full_name or user.email}"',
        details={"fields": sorted(data.keys())},
        user=current_user,
    )

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
    deleted_user_name = user.full_name or user.email
    deleted_user_email = user.email
    deleted_user_avatar_url = user.avatar_url

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
    db.query(ActivityLog).filter(ActivityLog.user_id == user.id).update(
        {ActivityLog.user_id: current_user.id},
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

    _delete_user_upload_files(user_id, deleted_user_avatar_url)

    log_activity(
        db,
        event_type="user_deleted",
        entity_type="user",
        entity_id=user_id,
        description=f'User "{deleted_user_name}" was deleted',
        user=current_user,
    )
    try:
        enqueue_account_deleted_email(db, deleted_user_email, deleted_user_name)
    except Exception:
        db.rollback()
        logger.exception("Could not queue account deleted email for user %s", user_id)

    db.add(
        Notification(
            type="user-deleted",
            payload={
                "userId": user_id,
                "userName": deleted_user_name,
            },
            user_id=current_user.id,
        )
    )
    db.commit()

    await websocket_manager.broadcast({"type": "users_updated", "action": "delete"})
    await websocket_manager.broadcast({"type": "notifications_updated"})
    return {"message": f"User {user_id} deleted successfully"}
