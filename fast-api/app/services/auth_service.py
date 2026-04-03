from sqlalchemy.orm import Session
from app.models.user import User
from app.models.role import Role
from app.core.security import hash_password, verify_password, create_access_token


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def register_user(
    db: Session,
    email: str,
    password: str,
    full_name: str | None = None,
) -> User:
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise ValueError("Email already registered")

    default_role = db.query(Role).filter(Role.name == "user").first()
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


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    if not user.is_active:
        return None

    return user


def login_user(db: Session, email: str, password: str) -> str | None:
    user = authenticate_user(db, email, password)
    if not user:
        return None

    token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )
    return token