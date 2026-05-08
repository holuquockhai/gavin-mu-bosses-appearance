from typing import Annotated
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import require_roles
from app.schemas.system_setting import (
    PublicBrandingResponse,
    PublicMaintenanceResponse,
    SystemSettingsResponse,
    SystemSettingsUpdate,
)
from app.services.mail_service import send_email
from app.services.system_settings_service import get_settings_map, save_settings_map

BRANDING_UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "branding"
ALLOWED_BRANDING_TYPES = {
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
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


def _branding_response(db: Session) -> PublicBrandingResponse:
    values = get_settings_map(db)
    return PublicBrandingResponse(
        site_logo_url=values.get("site_logo_url") or None,
        site_sublogo_url=values.get("site_sublogo_url") or None,
        site_head_title=values.get("site_head_title") or "MU BOSS TIMER",
    )


def _as_bool(value: str | bool | None) -> bool:
    if isinstance(value, bool):
        return value

    return str(value or "").lower() in {"1", "true", "yes", "on"}


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
        site_head_title=values.get("site_head_title") or "MU BOSS TIMER",
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


@router.get("/", response_model=SystemSettingsResponse)
def read_system_settings(db: Annotated[Session, Depends(get_db)]):
    return _settings_response(db)


@router.put("/", response_model=SystemSettingsResponse)
def update_system_settings(
    data: SystemSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
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
    return _settings_response(db)


@router.put("/branding", response_model=PublicBrandingResponse)
def update_branding_settings(
    site_head_title: str | None = Form(default=None),
    site_logo: UploadFile | None = File(default=None),
    site_sublogo: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
):
    current_values = get_settings_map(db)
    logo_url = _save_branding_image(site_logo, "site-logo")
    sublogo_url = _save_branding_image(site_sublogo, "site-sublogo")

    save_settings_map(
        db,
        {
            "site_head_title": site_head_title.strip() if site_head_title else current_values.get("site_head_title"),
            "site_logo_url": logo_url or current_values.get("site_logo_url", ""),
            "site_sublogo_url": sublogo_url or current_values.get("site_sublogo_url", ""),
        },
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
        raise HTTPException(status_code=400, detail=f"Could not send test email: {exc}") from exc

    return {"message": "Test email sent successfully"}
