from app.models.user import User


def get_user_role_names(user: User) -> list[str]:
    return [role.name for role in user.roles]


def get_user_permission_names(user: User) -> set[str]:
    permissions: set[str] = set()
    for role in user.roles:
        for permission in role.permissions:
            permissions.add(permission.name)
    return permissions


def user_has_role(user: User, role_name: str) -> bool:
    return role_name in get_user_role_names(user)


def user_has_permission(user: User, permission_name: str) -> bool:
    return permission_name in get_user_permission_names(user)