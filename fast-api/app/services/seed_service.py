from sqlalchemy.orm import Session
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.channel import Channel
from app.core.security import hash_password


def seed_admin(db: Session):
    permission_names = [
        "user:create",
        "user:read",
        "user:update",
        "user:delete",

        "boss:create",
        "boss:read",
        "boss:update",
        "boss:delete",

        "channel:create",
        "channel:read",
        "channel:update",
        "channel:delete",

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

    default_user_permissions = [
        permissions["user:read"],
        permissions["boss:read"],
        permissions["channel:read"],
    ]

    for permission in default_user_permissions:
        if permission not in user_role.permissions:
            user_role.permissions.append(permission)

    admin_accounts = [
        {
            "email": "admin@example.com",
            "full_name": "Administrator",
            "password": "P@ssw0rd",
        },
        {
            "email": "holuquockhai@gmail.com",
            "full_name": "Andy Ho",
            "password": "P@ssw0rd",
        },
    ]
    admin_user = None

    for account in admin_accounts:
        user = db.query(User).filter_by(email=account["email"]).first()

        if not user:
            user = User(
                email=account["email"],
                full_name=account["full_name"],
                hashed_password=hash_password(account["password"]),
                is_active=True,
            )
            db.add(user)
            db.flush()

        if admin_role not in user.roles:
            user.roles.append(admin_role)

        if account["email"] == "admin@example.com":
            admin_user = user

    default_channels = ["Channel 1", "Channel 2", "Channel 3"]
    channel_owner_id = admin_user.id if admin_user else None

    for channel_name in default_channels:
        existing_channel = db.query(Channel).filter_by(name=channel_name).first()
        if not existing_channel:
            db.add(Channel(
                name=channel_name,
                created_by_id=channel_owner_id,
                updated_by_id=channel_owner_id,
            ))

    db.commit()
