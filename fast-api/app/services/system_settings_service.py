from sqlalchemy.orm import Session
from dotenv import dotenv_values

from app.core.config import ENV_FILE_PATH, settings
from app.models.system_setting import SystemSetting

MYSQL_SETTING_KEYS = {
    "mysql_host",
    "mysql_port",
    "mysql_database",
    "mysql_username",
    "mysql_password",
    "mysql_charset",
}


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
    "email_queue_batch_size": "20",
    "chat_message_retention_days": "30",
    "logs_retention_days": "60",
    "mysql_host": settings.MYSQL_HOST,
    "mysql_port": str(settings.MYSQL_PORT),
    "mysql_database": settings.MYSQL_DATABASE,
    "mysql_username": settings.MYSQL_USERNAME,
    "mysql_password": settings.MYSQL_PASSWORD,
    "mysql_charset": settings.MYSQL_CHARSET,
}


def _mysql_settings_from_env() -> dict[str, str]:
    env_values = dotenv_values(ENV_FILE_PATH) if ENV_FILE_PATH.exists() else {}

    return {
        "mysql_host": env_values.get("MYSQL_HOST") or settings.MYSQL_HOST,
        "mysql_port": env_values.get("MYSQL_PORT") or str(settings.MYSQL_PORT),
        "mysql_database": env_values.get("MYSQL_DATABASE") or settings.MYSQL_DATABASE,
        "mysql_username": env_values.get("MYSQL_USERNAME") or settings.MYSQL_USERNAME,
        "mysql_password": env_values.get("MYSQL_PASSWORD") or settings.MYSQL_PASSWORD,
        "mysql_charset": env_values.get("MYSQL_CHARSET") or settings.MYSQL_CHARSET,
    }


def get_settings_map(db: Session) -> dict[str, str]:
    saved_settings = {setting.key: setting.value or "" for setting in db.query(SystemSetting).all()}
    merged_settings = {**DEFAULT_SETTINGS, **saved_settings}
    merged_settings.update(_mysql_settings_from_env())

    return merged_settings


def get_setting(db: Session, key: str) -> str:
    return get_settings_map(db).get(key, "")


def save_settings_map(db: Session, values: dict[str, object | None]) -> None:
    for key, value in values.items():
        if key in MYSQL_SETTING_KEYS:
            continue

        setting = db.get(SystemSetting, key)
        if not setting:
            setting = SystemSetting(key=key)
            db.add(setting)

        setting.value = "" if value is None else str(value)

    db.commit()
