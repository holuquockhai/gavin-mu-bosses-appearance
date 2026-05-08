from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.system_setting import SystemSetting


DEFAULT_SETTINGS = {
    "app_secret_key": settings.SECRET_KEY,
    "app_base_url": "http://127.0.0.1:5173",
    "api_base_url": "http://127.0.0.1:8000",
    "site_logo_url": "",
    "site_sublogo_url": "",
    "site_head_title": "WARLORDS",
    "maintenance_enabled": "false",
    "maintenance_message": "Wardlords Site is currently under maintenance. Please check back shortly.",
    "smtp_host": "",
    "smtp_port": "587",
    "smtp_username": "",
    "smtp_password": "",
    "smtp_from_email": "",
    "smtp_from_name": "Wardlords",
    "smtp_use_tls": "true",
    "smtp_use_ssl": "false",
    "mysql_host": "127.0.0.1",
    "mysql_port": "3306",
    "mysql_database": "mu_bosses",
    "mysql_username": "root",
    "mysql_password": "",
    "mysql_charset": "utf8mb4",
}


def get_settings_map(db: Session) -> dict[str, str]:
    saved_settings = {setting.key: setting.value or "" for setting in db.query(SystemSetting).all()}
    return {**DEFAULT_SETTINGS, **saved_settings}


def get_setting(db: Session, key: str) -> str:
    return get_settings_map(db).get(key, "")


def save_settings_map(db: Session, values: dict[str, object | None]) -> None:
    for key, value in values.items():
        setting = db.get(SystemSetting, key)
        if not setting:
            setting = SystemSetting(key=key)
            db.add(setting)

        setting.value = "" if value is None else str(value)

    db.commit()
