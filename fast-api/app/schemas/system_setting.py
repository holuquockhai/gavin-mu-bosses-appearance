from pydantic import BaseModel, EmailStr, Field


class SystemSettingsResponse(BaseModel):
    app_secret_key: str | None = None
    app_base_url: str | None = None
    api_base_url: str | None = None
    site_logo_url: str | None = None
    site_sublogo_url: str | None = None
    site_head_title: str = "WARLORDS"
    maintenance_enabled: bool = False
    maintenance_message: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password_configured: bool = False
    smtp_from_email: EmailStr | None = None
    smtp_from_name: str | None = None
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    email_queue_batch_size: int = 20
    mysql_host: str | None = None
    mysql_port: int = 3306
    mysql_database: str | None = None
    mysql_username: str | None = None
    mysql_password_configured: bool = False
    mysql_charset: str | None = "utf8mb4"


class SystemSettingsUpdate(BaseModel):
    app_secret_key: str | None = Field(default=None, min_length=8)
    app_base_url: str | None = None
    api_base_url: str | None = None
    site_logo_url: str | None = None
    site_sublogo_url: str | None = None
    site_head_title: str | None = None
    maintenance_enabled: bool = False
    maintenance_message: str | None = None
    smtp_host: str | None = None
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: EmailStr | None = None
    smtp_from_name: str | None = None
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    email_queue_batch_size: int = Field(default=20, ge=1, le=200)
    mysql_host: str | None = None
    mysql_port: int = Field(default=3306, ge=1, le=65535)
    mysql_database: str | None = None
    mysql_username: str | None = None
    mysql_password: str | None = None
    mysql_charset: str | None = "utf8mb4"


class PublicBrandingResponse(BaseModel):
    site_logo_url: str | None = None
    site_sublogo_url: str | None = None
    site_head_title: str = "WARLORDS"


class PublicMaintenanceResponse(BaseModel):
    maintenance_enabled: bool = False
    maintenance_message: str | None = None
