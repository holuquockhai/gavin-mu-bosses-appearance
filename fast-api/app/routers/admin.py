from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import require_permissions
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_permissions(["rbac:manage"]))]
)


#Create Roles URI
@router.post("/roles")
def create_role(name: str, description: str | None = None, db: Session = Depends(get_db)):
    existing = db.query(Role).filter(Role.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role already exists")

    role = Role(name=name, description=description)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


# Create permission URL
@router.post("/permissions")
def create_permission(name: str, description: str | None = None, db: Session = Depends(get_db)):
    existing = db.query(Permission).filter(Permission.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Permission already exists")

    permission = Permission(name=name, description=description)
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission


# Assign role and permission
@router.post("/roles/{role_id}/permissions/{permission_id}")
def assign_permission_to_role(role_id: int, permission_id: int, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()
    permission = db.query(Permission).filter(Permission.id == permission_id).first()

    if not role or not permission:
        raise HTTPException(status_code=404, detail="Role or permission not found")

    if permission not in role.permissions:
        role.permissions.append(permission)
        db.commit()

    return {"message": "Permission assigned to role"}


# Assign Roles to User
@router.post("/users/{user_id}/roles/{role_id}")
def assign_role_to_user(user_id: int, role_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    role = db.query(Role).filter(Role.id == role_id).first()

    if not user or not role:
        raise HTTPException(status_code=404, detail="User or role not found")

    if role not in user.roles:
        user.roles.append(role)
        db.commit()

    return {"message": "Role assigned to user"}