from email.message import EmailMessage
from email.utils import formataddr
from html import escape
import smtplib
import ssl

from sqlalchemy.orm import Session

from app.services.system_settings_service import get_settings_map

def _clean_header_value(value: str | None) -> str:
    return (
        str(value or "")
        .replace("\xa0", " ")
        .replace("\r", " ")
        .replace("\n", " ")
        .strip()
    )


def _clean_secret_value(value: str | None) -> str:
    return str(value or "").replace("\xa0", "").strip()


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


def _email_logo_url(values: dict[str, str]) -> str:
    base_url = values.get("api_base_url") or values.get("app_base_url") or "http://127.0.0.1:8000"
    return _absolute_url(base_url, "/system-settings/email-logo")


def _build_email_html(
    db: Session,
    title: str,
    greeting: str,
    body: str,
    action_label: str,
    action_url: str,
    footer_note: str,
    body_html: str | None = None,
) -> str:
    values = get_settings_map(db)
    site_title = (values.get("site_head_title") or "WARLORDS").replace("MU BOSS TIMER", "WARLORDS")
    logo_url = _email_logo_url(values)
    rendered_body = body_html or escape(body)
    logo_markup = (
        '<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 18px;">'
        '<tr>'
        '<td align="center" valign="middle" width="72" height="72" style="width:72px;height:72px;line-height:0;text-align:center;">'
        f'<img src="{escape(logo_url)}" alt="{escape(site_title)}" '
        'width="72" height="72" border="0" '
        'style="display:block;border:0;outline:none;text-decoration:none;width:72px;height:72px;max-width:72px;max-height:72px;" />'
        '</td>'
        '</tr>'
        '</table>'
        if logo_url
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
              <td align="center" style="padding:34px 32px 24px;text-align:center;background:#fbfcfe;border-bottom:1px solid #e4ebf4;">
                {logo_markup}
                <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#1f7a62;margin-bottom:8px;">{escape(site_title)}</div>
                <h1 style="margin:0;font-size:24px;line-height:1.3;color:#172033;">{escape(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">{escape(greeting)}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#3f4b5f;">{rendered_body}</p>
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
    host = _clean_header_value(mail_settings.get("smtp_host"))
    from_email = _clean_header_value(mail_settings.get("smtp_from_email"))

    if not host or not from_email:
        raise RuntimeError("SMTP settings are not configured")

    port = int(mail_settings.get("smtp_port") or 587)
    username = _clean_header_value(mail_settings.get("smtp_username"))
    password = _clean_secret_value(mail_settings.get("smtp_password"))
    from_name = _clean_header_value(mail_settings.get("smtp_from_name"))
    recipient = _clean_header_value(recipient)
    subject = _clean_header_value(subject)
    use_tls = _as_bool(mail_settings.get("smtp_use_tls"))
    use_ssl = _as_bool(mail_settings.get("smtp_use_ssl"))

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr((from_name, from_email), charset="utf-8") if from_name else from_email
    message["To"] = recipient
    message.set_content(text_body)

    if html_body:
        message.add_alternative(html_body, subtype="html")

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
    except UnicodeEncodeError as exc:
        raise RuntimeError(
            "SMTP settings contain a hidden non-ASCII character. Re-enter SMTP host, username, password, from email, and from name manually."
        ) from exc


def build_password_reset_email(db: Session, recipient: str, full_name: str | None, reset_url: str) -> tuple[str, str, str]:
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
    return subject, text_body, html_body


def send_password_reset_email(db: Session, recipient: str, full_name: str | None, reset_url: str) -> None:
    subject, text_body, html_body = build_password_reset_email(db, recipient, full_name, reset_url)
    send_email(db, recipient, subject, text_body, html_body)


def build_account_activated_email(
    db: Session,
    recipient: str,
    full_name: str | None,
    login_url: str,
    initial_password: str | None = None,
) -> tuple[str, str, str]:
    display_name = full_name or recipient
    subject = "Your WARLORDS account is active"
    password_text = f"\nYour temporary password is: {initial_password}\nPlease update your password after your first login.\n" if initial_password else ""
    body = "Your WARLORDS account is active. You can now sign in with your account."
    body_html = escape(body)
    if initial_password:
        body_html += (
            '<br /><br />Your temporary password is '
            f'<strong>{escape(initial_password)}</strong>. '
            "Please update your password after your first login."
        )
    text_body = (
        f"Hi {display_name},\n\n"
        "Your WARLORDS account is active. You can now sign in with your account.\n"
        f"Login here: {login_url}\n\n"
        f"{password_text}"
        "Welcome to WARLORDS.\n\n"
        "Warm regards!\n"
        "Gavin Nguyen"
    )
    html_body = _build_email_html(
        db,
        title="Your account is active",
        greeting=f"Hi {display_name},",
        body=body,
        body_html=body_html,
        action_label="Login to WARLORDS",
        action_url=login_url,
        footer_note="Welcome to WARLORDS.",
    )
    return subject, text_body, html_body


def send_account_activated_email(db: Session, recipient: str, full_name: str | None, login_url: str) -> None:
    subject, text_body, html_body = build_account_activated_email(db, recipient, full_name, login_url)
    send_email(db, recipient, subject, text_body, html_body)


def build_account_inactive_email(
    db: Session,
    recipient: str,
    full_name: str | None,
    footer_note: str = "This message was sent because someone tried to sign in with this inactive account.",
) -> tuple[str, str, str]:
    values = get_settings_map(db)
    admin_email = (values.get("smtp_from_email") or "").strip()
    display_name = full_name or recipient
    contact_sentence = (
        f"Please contact the administrator at {admin_email} for more information."
        if admin_email
        else "Please contact the administrator for more information."
    )
    subject = "Your WARLORDS account is inactive"
    text_body = (
        f"Hi {display_name},\n\n"
        "Your WARLORDS account is currently inactive.\n"
        f"{contact_sentence}\n\n"
        "Warm regards!\n"
        "Gavin Nguyen"
    )
    html_body = _build_email_html(
        db,
        title="Your account is inactive",
        greeting=f"Hi {display_name},",
        body=f"Your WARLORDS account is currently inactive. {contact_sentence}",
        action_label="Contact administrator",
        action_url=f"mailto:{admin_email}" if admin_email else "#",
        footer_note=footer_note,
    )
    return subject, text_body, html_body


def send_account_inactive_email(
    db: Session,
    recipient: str,
    full_name: str | None,
    footer_note: str = "This message was sent because someone tried to sign in with this inactive account.",
) -> None:
    subject, text_body, html_body = build_account_inactive_email(db, recipient, full_name, footer_note)
    send_email(db, recipient, subject, text_body, html_body)


def build_account_deleted_email(db: Session, recipient: str, full_name: str | None) -> tuple[str, str, str]:
    values = get_settings_map(db)
    admin_email = (values.get("smtp_from_email") or "").strip()
    display_name = full_name or recipient
    contact_sentence = (
        f"Please contact the administrator at {admin_email} if you need more information."
        if admin_email
        else "Please contact the administrator if you need more information."
    )
    subject = "Your WARLORDS account has been deleted"
    text_body = (
        f"Hi {display_name},\n\n"
        "Your WARLORDS account has been deleted by an administrator.\n"
        f"{contact_sentence}\n\n"
        "Warm regards!\n"
        "Gavin Nguyen"
    )
    html_body = _build_email_html(
        db,
        title="Your account has been deleted",
        greeting=f"Hi {display_name},",
        body=f"Your WARLORDS account has been deleted by an administrator. {contact_sentence}",
        action_label="Contact administrator",
        action_url=f"mailto:{admin_email}" if admin_email else "#",
        footer_note="This message was sent because an administrator deleted your account.",
    )
    return subject, text_body, html_body


def send_account_deleted_email(db: Session, recipient: str, full_name: str | None) -> None:
    subject, text_body, html_body = build_account_deleted_email(db, recipient, full_name)
    send_email(db, recipient, subject, text_body, html_body)
