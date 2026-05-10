from typing import Annotated
from datetime import datetime, timezone
import json
import logging
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.database import Base
from app.db.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.system_setting import (
    PublicBrandingResponse,
    PublicMaintenanceResponse,
    SystemSettingsResponse,
    SystemSettingsUpdate,
)
from app.services.activity_log_service import log_activity
from app.services.env_file_service import update_mysql_env_file
from app.services.mail_service import send_email
from app.services.seed_service import seed_admin
from app.services.system_settings_service import DEFAULT_SETTINGS, get_settings_map, save_settings_map
from app.services.websocket_manager import websocket_manager

BRANDING_UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "branding"
ALLOWED_BRANDING_TYPES = {
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
}
logger = logging.getLogger(__name__)
SENSITIVE_SETTING_KEYS = {"app_secret_key", "smtp_password", "mysql_password"}
FACTORY_RESET_PRESERVED_TABLES = {
    "permissions",
    "role_permissions",
    "roles",
    "user_roles",
    "users",
}

public_router = APIRouter(prefix="/system-settings", tags=["system-settings"])

router = APIRouter(
    prefix="/system-settings",
    tags=["system-settings"],
    dependencies=[Depends(require_roles(["admin"]))],
)


def _save_branding_image(upload: UploadFile | None, prefix: str) -> str | None:
    if not upload or not upload.filename:
        return None

    extension = ALLOWED_BRANDING_TYPES.get(upload.content_type or "")
    if not extension:
        raise HTTPException(status_code=400, detail="Branding image must be a PNG, JPG, GIF, SVG, or WEBP file")

    BRANDING_UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}-{uuid4().hex}{extension}"
    image_path = BRANDING_UPLOAD_ROOT / filename

    with image_path.open("wb") as file_object:
        shutil.copyfileobj(upload.file, file_object)

    return f"/uploads/branding/{filename}"


def _site_logo_file_path(values: dict[str, str]) -> Path:
    logo_url = values.get("site_logo_url") or ""

    if logo_url.startswith("/uploads/"):
        uploaded_logo_path = Path(__file__).resolve().parents[2] / logo_url.lstrip("/")
        if uploaded_logo_path.exists():
            return uploaded_logo_path

    return Path(__file__).resolve().parents[3] / "react-project" / "src" / "assets" / "logo.png"


def _branding_response(db: Session) -> PublicBrandingResponse:
    values = get_settings_map(db)
    return PublicBrandingResponse(
        site_logo_url=values.get("site_logo_url") or None,
        site_sublogo_url=values.get("site_sublogo_url") or None,
        site_head_title=values.get("site_head_title") or "WARLORDS",
    )


def _as_bool(value: str | bool | None) -> bool:
    if isinstance(value, bool):
        return value

    return str(value or "").lower() in {"1", "true", "yes", "on"}


def _masked_settings_values(values: dict[str, object | None]) -> dict[str, object | None]:
    masked_values = {}
    for key, value in values.items():
        if key in SENSITIVE_SETTING_KEYS:
            masked_values[key] = "(updated)" if value else "(unchanged)"
        else:
            masked_values[key] = value

    return masked_values


def _backup_filename() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return f"warlords-system-settings-{timestamp}.json"


def _settings_backup_payload(db: Session) -> dict[str, object]:
    return {
        "name": "WARLORDS system settings backup",
        "version": 1,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "settings": get_settings_map(db),
    }


def _settings_from_backup_payload(payload: object) -> dict[str, object | None]:
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Backup file must contain a JSON object")

    raw_settings = payload.get("settings", payload)
    if not isinstance(raw_settings, dict):
        raise HTTPException(status_code=400, detail="Backup file does not contain valid settings")

    allowed_keys = set(DEFAULT_SETTINGS.keys())
    settings_values = {key: raw_settings[key] for key in raw_settings if key in allowed_keys}

    if not settings_values:
        raise HTTPException(status_code=400, detail="Backup file does not contain any supported settings")

    return settings_values


def _mysql_settings_values(values: dict[str, object | None]) -> dict[str, object | None]:
    mysql_keys = {
        "mysql_host",
        "mysql_port",
        "mysql_database",
        "mysql_username",
        "mysql_password",
        "mysql_charset",
    }
    return {key: values.get(key) for key in mysql_keys if key in values}


def _maintenance_response(db: Session) -> PublicMaintenanceResponse:
    values = get_settings_map(db)
    return PublicMaintenanceResponse(
        maintenance_enabled=_as_bool(values.get("maintenance_enabled")),
        maintenance_message=values.get("maintenance_message") or None,
    )


def _settings_response(db: Session) -> SystemSettingsResponse:
    values = get_settings_map(db)
    return SystemSettingsResponse(
        app_secret_key=values.get("app_secret_key") or None,
        app_base_url=values.get("app_base_url") or None,
        api_base_url=values.get("api_base_url") or None,
        site_logo_url=values.get("site_logo_url") or None,
        site_sublogo_url=values.get("site_sublogo_url") or None,
        site_head_title=values.get("site_head_title") or "WARLORDS",
        maintenance_enabled=_as_bool(values.get("maintenance_enabled")),
        maintenance_message=values.get("maintenance_message") or None,
        smtp_host=values.get("smtp_host") or None,
        smtp_port=int(values.get("smtp_port") or 587),
        smtp_username=values.get("smtp_username") or None,
        smtp_password_configured=bool(values.get("smtp_password")),
        smtp_from_email=values.get("smtp_from_email") or None,
        smtp_from_name=values.get("smtp_from_name") or None,
        smtp_use_tls=str(values.get("smtp_use_tls", "true")).lower() == "true",
        smtp_use_ssl=str(values.get("smtp_use_ssl", "false")).lower() == "true",
        email_queue_batch_size=int(values.get("email_queue_batch_size") or 20),
        mysql_host=values.get("mysql_host") or None,
        mysql_port=int(values.get("mysql_port") or 3306),
        mysql_database=values.get("mysql_database") or None,
        mysql_username=values.get("mysql_username") or None,
        mysql_password_configured=bool(values.get("mysql_password")),
        mysql_charset=values.get("mysql_charset") or "utf8mb4",
    )


@public_router.get("/branding", response_model=PublicBrandingResponse)
def read_public_branding(db: Annotated[Session, Depends(get_db)]):
    return _branding_response(db)


@public_router.get("/maintenance", response_model=PublicMaintenanceResponse)
def read_public_maintenance(db: Annotated[Session, Depends(get_db)]):
    return _maintenance_response(db)


@public_router.get("/email-logo")
def read_email_logo(db: Annotated[Session, Depends(get_db)]):
    logo_path = _site_logo_file_path(get_settings_map(db))

    if not logo_path.exists():
        raise HTTPException(status_code=404, detail="Email logo not found")

    return FileResponse(logo_path)


@router.get("/", response_model=SystemSettingsResponse)
def read_system_settings(db: Annotated[Session, Depends(get_db)]):
    return _settings_response(db)


@router.put("/", response_model=SystemSettingsResponse)
def update_system_settings(
    data: SystemSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(["admin"]))],
):
    current_values = get_settings_map(db)
    values = data.model_dump()

    if not values.get("smtp_password"):
        values["smtp_password"] = current_values.get("smtp_password", "")

    if not values.get("mysql_password"):
        values["mysql_password"] = current_values.get("mysql_password", "")

    if values.get("smtp_use_ssl"):
        values["smtp_use_tls"] = False

    save_settings_map(db, values)
    update_mysql_env_file(_mysql_settings_values(values))
    log_activity(
        db,
        event_type="system_settings_saved",
        entity_type="system_settings",
        description="Saved system settings",
        details={"values": _masked_settings_values(values)},
        user=current_user,
    )
    return _settings_response(db)


@router.put("/branding", response_model=PublicBrandingResponse)
def update_branding_settings(
    site_head_title: str | None = Form(default=None),
    site_logo: UploadFile | None = File(default=None),
    site_sublogo: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    current_values = get_settings_map(db)
    logo_url = _save_branding_image(site_logo, "site-logo")
    sublogo_url = _save_branding_image(site_sublogo, "site-sublogo")

    values = {
        "site_head_title": site_head_title.strip() if site_head_title else current_values.get("site_head_title"),
        "site_logo_url": logo_url or current_values.get("site_logo_url", ""),
        "site_sublogo_url": sublogo_url or current_values.get("site_sublogo_url", ""),
    }
    save_settings_map(db, values)
    log_activity(
        db,
        event_type="branding_settings_saved",
        entity_type="system_settings",
        description="Saved branding settings",
        details={"values": values},
        user=current_user,
    )
    return _branding_response(db)


@router.post("/test-email")
def send_test_email(
    recipient: str,
    db: Annotated[Session, Depends(get_db)],
):
    try:
        send_email(
            db,
            recipient=recipient,
            subject="WARLORDS test email",
            text_body="Your WARLORDS SMTP settings are working.",
            html_body="<p>Your WARLORDS SMTP settings are working.</p>",
        )
    except Exception as exc:
        logger.exception("Could not send test email to %s", recipient)
        raise HTTPException(status_code=400, detail=f"Could not send test email: {exc}") from exc

    return {"message": "Test email sent successfully"}


@router.get("/backup")
def download_system_settings_backup(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(["admin"]))],
):
    payload = _settings_backup_payload(db)
    log_activity(
        db,
        event_type="system_settings_backup_downloaded",
        entity_type="system_settings",
        description="Downloaded system settings backup",
        details={"settings_count": len(payload["settings"])},
        user=current_user,
    )

    return Response(
        content=json.dumps(payload, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{_backup_filename()}"'},
    )


@router.post("/restore", response_model=SystemSettingsResponse)
async def restore_system_settings_backup(
    backup_file: Annotated[UploadFile, File()],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(["admin"]))],
):
    if not (backup_file.filename or "").lower().endswith(".json"):
        raise HTTPException(status_code=400, detail="Please upload a JSON backup file")

    try:
        raw_content = await backup_file.read()
        payload = json.loads(raw_content.decode("utf-8"))
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="Backup file must be UTF-8 encoded JSON") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Backup file contains invalid JSON") from exc

    settings_values = _settings_from_backup_payload(payload)
    save_settings_map(db, settings_values)
    update_mysql_env_file(_mysql_settings_values(settings_values))
    log_activity(
        db,
        event_type="system_settings_restored",
        entity_type="system_settings",
        description="Restored system settings from backup",
        details={
            "filename": backup_file.filename,
            "values": _masked_settings_values(settings_values),
        },
        user=current_user,
    )

    return _settings_response(db)


@router.post("/factory-reset")
async def factory_reset_website(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(["admin"]))],
):
    current_user_id = current_user.id
    table_names = [table.name for table in reversed(Base.metadata.sorted_tables)]
    reset_table_names = [table_name for table_name in table_names if table_name not in FACTORY_RESET_PRESERVED_TABLES]

    try:
        db.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        for table_name in reset_table_names:
            db.execute(text(f"TRUNCATE TABLE `{table_name}`"))
        db.execute(text("SET FOREIGN_KEY_CHECKS=1"))
        db.commit()
    except Exception as exc:
        db.rollback()
        db.execute(text("SET FOREIGN_KEY_CHECKS=1"))
        db.commit()
        raise HTTPException(status_code=500, detail=f"Factory reset failed: {exc}") from exc

    db.expunge_all()
    seed_admin(db)
    reset_user = db.get(User, current_user_id)
    log_activity(
        db,
        event_type="factory_reset_completed",
        entity_type="system_settings",
        description="Completed website factory reset",
        details={
            "reset_tables": reset_table_names,
            "preserved_tables": sorted(FACTORY_RESET_PRESERVED_TABLES),
        },
        user=reset_user,
    )
    await websocket_manager.broadcast({"type": "factory_reset_completed"})

    return {"message": "Website factory reset completed. Users and roles were preserved."}
