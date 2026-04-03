from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.security import create_access_token, hash_password, verify_password
from app.models.role import Role
from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    stmt = (
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .where(User.email == email)
    )
    return db.execute(stmt).scalar_one_or_none()


def register_user(
    db: Session,
    email: str,
    password: str,
    full_name: str | None = None,
) -> User:
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise ValueError("Email already registered")

    default_role = db.execute(
        select(Role).where(Role.name == "user")
    ).scalar_one_or_none()

    if not default_role:
        raise ValueError("Default role 'user' does not exist")

    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        is_active=True,
    )
    user.roles.append(default_role)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)

    if not user:
        return None, "invalid_credentials"

    if not verify_password(password, user.hashed_password):
        return None, "invalid_credentials"

    if not user.is_active:
        return None, "inactive"

    return user, None


def login_user(db: Session, email: str, password: str):
    user, error = authenticate_user(db, email, password)

    if error:
        return None, error

    token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )
    return token, None