from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.core.security import decode_token
from app.services.rbac_service import user_has_role, user_has_permission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    return user


def require_roles(allowed_roles: list[str]):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        matched = any(user_has_role(current_user, role) for role in allowed_roles)
        if not matched:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role",
            )
        return current_user

    return checker


def require_permissions(required_permissions: list[str]):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        for permission in required_permissions:
            if not user_has_permission(current_user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permission: {permission}",
                )
        return current_user

    return checker