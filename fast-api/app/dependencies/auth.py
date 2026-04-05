# app/dependencies/auth.py
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.core.security import decode_token
from app.db.database import get_db
from app.models.user import User
from app.models.role import Role
from app.services.rbac_service import user_has_role, user_has_permission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
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

    stmt = (
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .where(User.id == int(user_id))
    )
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user

def require_roles(allowed_roles: list[str]):
    def checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if not any(user_has_role(current_user, role) for role in allowed_roles):
            raise HTTPException(status_code=403, detail="Insufficient role")
        return current_user
    return checker

def require_permissions(required_permissions: list[str]):
    def checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        for permission in required_permissions:
            if not user_has_permission(current_user, permission):
                raise HTTPException(
                    status_code=403,
                    detail=f"Missing permission: {permission}",
                )
        return current_user
    return checker