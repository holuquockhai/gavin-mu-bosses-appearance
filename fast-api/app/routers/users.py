from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password
from app.db.database import get_db
from app.dependencies.auth import get_current_user, require_permissions
from app.models.role import Role
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate

# Users Router
router = APIRouter(prefix="/users", tags=["users"])


def _get_default_user_role(db: Session) -> Role:
    role = db.execute(select(Role).where(Role.name == "user")).scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Default role 'user' does not exist",
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


# Get current user Router
@router.get("/me", response_model=UserResponse)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


# get user Router
@router.get(
    "/",
    response_model=list[UserResponse],
    dependencies=[Depends(require_permissions(["user:read"]))],
)
def list_users(db: Session = Depends(get_db)):
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
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    if _email_exists(db, payload.email):
        raise HTTPException(status_code=400, detail=f'User email "{payload.email}" already exists')

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        is_active=payload.is_active,
    )
    user.roles.append(_get_default_user_role(db))

    db.add(user)
    db.commit()
    db.refresh(user)
    return _get_user_by_id(db, user.id)


# Update user
@router.put(
    "/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(require_permissions(["user:update"]))],
)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = _get_user_by_id(db, user_id)
    data = payload.model_dump(exclude_unset=True)

    if "email" in data:
        if _email_exists(db, data["email"], exclude_user_id=user_id):
            raise HTTPException(status_code=400, detail=f'User email "{data["email"]}" already exists')
        user.email = data["email"]

    if "full_name" in data:
        user.full_name = data["full_name"]

    if "is_active" in data:
        user.is_active = data["is_active"]

    if data.get("password"):
        user.hashed_password = hash_password(data["password"])

    db.commit()
    db.refresh(user)
    return _get_user_by_id(db, user.id)

# Delete a user
@router.delete("/{user_id}", dependencies=[Depends(require_permissions(["user:delete"]))])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = _get_user_by_id(db, user_id)
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

    return {"message": f"User {user_id} deleted successfully"}
