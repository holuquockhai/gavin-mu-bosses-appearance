from app.models.user import User
from app.models.role import Role, user_roles, role_permissions
from app.models.permission import Permission
from app.models.boss import Boss
from app.models.timer import BossTimer, BossHistory
from app.models.notification import Notification
from app.models.preset import Preset
from app.models.channel import Channel

# Declare all table for creation
__all__ = [
    "User",
    "Role",
    "Permission",
    "user_roles",
    "role_permissions",
    "Boss",
    "BossTimer",
    "BossHistory",
    "Notification",
    "Preset",
    "Channel",
]
