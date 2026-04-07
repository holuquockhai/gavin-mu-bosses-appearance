from app.models.user import User
from app.models.role import Role, user_roles, role_permissions
from app.models.permission import Permission
from app.models.boss import Boss

# Declare all table for creation
__all__ = ["User", "Role", "Permission", "user_roles", "role_permissions", "Boss"]