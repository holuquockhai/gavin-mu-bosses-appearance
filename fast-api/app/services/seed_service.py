from sqlalchemy.orm import Session
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.core.security import hash_password


def seed_admin(db: Session):
    permission_names = [
        "user:create",
        "user:read",
        "user:update",
        "user:delete",
        "rbac:manage",
    ]

    permissions = {}

    for name in permission_names:
        permission = db.query(Permission).filter_by(name=name).first()
        if not permission:
            permission = Permission(name=name, description=name)
            db.add(permission)
            db.flush()
        permissions[name] = permission

    admin_role = db.query(Role).filter_by(name="admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db.add(admin_role)
        db.flush()

    admin_role.permissions = list(permissions.values())

    user_role = db.query(Role).filter_by(name="user").first()
    if not user_role:
        user_role = Role(name="user", description="Default user")
        db.add(user_role)
        db.flush()

    if permissions["user:read"] not in user_role.permissions:
        user_role.permissions.append(permissions["user:read"])

    admin_email = "admin@example.com"
    admin_user = db.query(User).filter_by(email=admin_email).first()

    if not admin_user:
        admin_user = User(
            email=admin_email,
            full_name="Administrator",
            hashed_password=hash_password("Passw0rd"),
            is_active=True,
        )
        admin_user.roles.append(admin_role)
        db.add(admin_user)

    db.commit()