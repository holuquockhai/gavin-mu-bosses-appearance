from email.message import EmailMessage
from html import escape
import mimetypes
from pathlib import Path
import smtplib
import ssl

from sqlalchemy.orm import Session

from app.services.system_settings_service import get_settings_map

EMAIL_LOGO_CID = "warlords-logo"


def _as_bool(value: str | bool | None) -> bool:
    if isinstance(value, bool):
        return value

    return str(value or "").lower() in {"1", "true", "yes", "on"}


def is_mail_configured(db: Session) -> bool:
    mail_settings = get_settings_map(db)
    return bool(mail_settings.get("smtp_host") and mail_settings.get("smtp_from_email"))


def _absolute_url(base_url: str, path_or_url: str) -> str:
    if not path_or_url:
        return ""

    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        return path_or_url

    return f"{base_url.rstrip('/')}/{path_or_url.lstrip('/')}"


def _email_logo_path(values: dict[str, str]) -> Path | None:
    logo_path = values.get("site_logo_url") or ""

    if logo_path.startswith("/uploads/"):
        uploaded_path = Path(__file__).resolve().parents[2] / logo_path.lstrip("/")
        if uploaded_path.exists():
            return uploaded_path

    default_logo_path = Path(__file__).resolve().parents[3] / "react-project" / "src" / "assets" / "logo.png"
    if default_logo_path.exists():
        return default_logo_path

    return None


def _build_email_html(
    db: Session,
    title: str,
    greeting: str,
    body: str,
    action_label: str,
    action_url: str,
    footer_note: str,
) -> str:
    values = get_settings_map(db)
    site_title = (values.get("site_head_title") or "WARLORDS").replace("MU BOSS TIMER", "WARLORDS")
    logo_file_path = _email_logo_path(values)
    logo_markup = (
        f'<img src="cid:{EMAIL_LOGO_CID}" alt="{escape(site_title)}" '
        'width="72" height="72" style="display:block;width:72px;height:72px;object-fit:contain;margin:0 auto 18px;" />'
        if logo_file_path
        else ""
    )

    return f"""
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #d9e1ec;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:34px 32px 24px;text-align:center;background:#fbfcfe;border-bottom:1px solid #e4ebf4;">
                {logo_markup}
                <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#1f7a62;margin-bottom:8px;">{escape(site_title)}</div>
                <h1 style="margin:0;font-size:24px;line-height:1.3;color:#172033;">{escape(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">{escape(greeting)}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#3f4b5f;">{escape(body)}</p>
                <p style="margin:0 0 26px;text-align:center;">
                  <a href="{escape(action_url)}" style="display:inline-block;padding:12px 20px;background:#1f7a62;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">{escape(action_label)}</a>
                </p>
                <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#65728a;">{escape(footer_note)}</p>
                <p style="margin:0;font-size:15px;line-height:1.6;color:#172033;">
                  Warm regards!<br />
                  <b>Gavin Nguyen</b>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def send_email(
    db: Session,
    recipient: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
) -> None:
    mail_settings = get_settings_map(db)
    host = mail_settings.get("smtp_host", "").strip()
    from_email = mail_settings.get("smtp_from_email", "").strip()

    if not host or not from_email:
        raise RuntimeError("SMTP settings are not configured")

    port = int(mail_settings.get("smtp_port") or 587)
    username = mail_settings.get("smtp_username", "").strip()
    password = mail_settings.get("smtp_password", "")
    from_name = mail_settings.get("smtp_from_name", "").strip()
    use_tls = _as_bool(mail_settings.get("smtp_use_tls"))
    use_ssl = _as_bool(mail_settings.get("smtp_use_ssl"))

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{from_name} <{from_email}>" if from_name else from_email
    message["To"] = recipient
    message.set_content(text_body)

    if html_body:
        message.add_alternative(html_body, subtype="html")
        logo_file_path = _email_logo_path(mail_settings)
        if logo_file_path and f"cid:{EMAIL_LOGO_CID}" in html_body:
            content_type = mimetypes.guess_type(logo_file_path.name)[0] or "image/png"
            maintype, subtype = content_type.split("/", 1)
            html_part = message.get_payload()[-1]
            html_part.add_related(
                logo_file_path.read_bytes(),
                maintype=maintype,
                subtype=subtype,
                cid=f"<{EMAIL_LOGO_CID}>",
            )

    smtp_class = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
    try:
        with smtp_class(host, port, timeout=15) as smtp:
            if use_tls and not use_ssl:
                smtp.starttls()

            if username:
                smtp.login(username, password)

            smtp.send_message(message)
    except ssl.SSLError as exc:
        raise RuntimeError(
            "SMTP SSL/TLS mode does not match the port. Use TLS with port 587, or SSL with port 465."
        ) from exc


def send_password_reset_email(db: Session, recipient: str, full_name: str | None, reset_url: str) -> None:
    display_name = full_name or recipient
    subject = "Reset your WARLORDS password"
    text_body = (
        f"Hi {display_name},\n\n"
        "We received a request to reset your WARLORDS password.\n"
        f"Open this link to set a new password: {reset_url}\n\n"
        "If you did not request this, you can ignore this email.\n\n"
        "Warm regards!\n"
        "Gavin Nguyen"
    )
    html_body = _build_email_html(
        db,
        title="Reset your password",
        greeting=f"Hi {display_name},",
        body="We received a request to reset your WARLORDS password.",
        action_label="Reset your password",
        action_url=reset_url,
        footer_note="If you did not request this, you can ignore this email.",
    )
    send_email(db, recipient, subject, text_body, html_body)


def send_account_activated_email(db: Session, recipient: str, full_name: str | None, login_url: str) -> None:
    display_name = full_name or recipient
    subject = "Your WARLORDS account is active"
    text_body = (
        f"Hi {display_name},\n\n"
        "Your WARLORDS account is active. You can now sign in with your account.\n"
        f"Login here: {login_url}\n\n"
        "Welcome to WARLORDS.\n\n"
        "Warm regards!\n"
        "Gavin Nguyen"
    )
    html_body = _build_email_html(
        db,
        title="Your account is active",
        greeting=f"Hi {display_name},",
        body="Your WARLORDS account is active. You can now sign in with your account.",
        action_label="Login to WARLORDS",
        action_url=login_url,
        footer_note="Welcome to WARLORDS.",
    )
    send_email(db, recipient, subject, text_body, html_body)
