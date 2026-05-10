from urllib.parse import quote_plus

from dotenv import dotenv_values

from app.core.config import ENV_FILE_PATH, settings

MYSQL_ENV_KEY_MAP = {
    "mysql_host": "MYSQL_HOST",
    "mysql_port": "MYSQL_PORT",
    "mysql_database": "MYSQL_DATABASE",
    "mysql_username": "MYSQL_USERNAME",
    "mysql_password": "MYSQL_PASSWORD",
    "mysql_charset": "MYSQL_CHARSET",
}


def _quote_env_value(value: object | None) -> str:
    text = "" if value is None else str(value)

    if not text or any(character.isspace() for character in text) or any(character in text for character in ['"', "'", "#", "$", "\\"]):
        escaped_text = text.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped_text}"'

    return text


def _database_url_from_mysql_values(values: dict[str, object | None]) -> str:
    username = quote_plus(str(values.get("mysql_username") or "root"))
    password = quote_plus(str(values.get("mysql_password") or ""))
    credentials = f"{username}:{password}" if password else username
    host = values.get("mysql_host") or "127.0.0.1"
    port = values.get("mysql_port") or 3306
    database = quote_plus(str(values.get("mysql_database") or "mu_bosses"))
    charset = quote_plus(str(values.get("mysql_charset") or "utf8mb4"))

    return f"mysql+pymysql://{credentials}@{host}:{port}/{database}?charset={charset}"


def update_mysql_env_file(values: dict[str, object | None]) -> None:
    current_env_values = dotenv_values(ENV_FILE_PATH) if ENV_FILE_PATH.exists() else {}
    env_values = {
        env_key: values.get(setting_key)
        for setting_key, env_key in MYSQL_ENV_KEY_MAP.items()
        if setting_key in values
    }

    if not env_values:
        return

    mysql_values = {
        "mysql_host": current_env_values.get("MYSQL_HOST") or settings.MYSQL_HOST,
        "mysql_port": current_env_values.get("MYSQL_PORT") or settings.MYSQL_PORT,
        "mysql_database": current_env_values.get("MYSQL_DATABASE") or settings.MYSQL_DATABASE,
        "mysql_username": current_env_values.get("MYSQL_USERNAME") or settings.MYSQL_USERNAME,
        "mysql_password": current_env_values.get("MYSQL_PASSWORD") or settings.MYSQL_PASSWORD,
        "mysql_charset": current_env_values.get("MYSQL_CHARSET") or settings.MYSQL_CHARSET,
    }

    for setting_key, env_key in MYSQL_ENV_KEY_MAP.items():
        if env_key in env_values:
            mysql_values[setting_key] = env_values[env_key]

    env_values["DATABASE_URL"] = _database_url_from_mysql_values(mysql_values)

    existing_lines = ENV_FILE_PATH.read_text(encoding="utf-8").splitlines() if ENV_FILE_PATH.exists() else []
    remaining_lines = []
    pending_values = dict(env_values)

    for line in existing_lines:
        stripped_line = line.strip()
        if not stripped_line or stripped_line.startswith("#") or "=" not in line:
            remaining_lines.append(line)
            continue

        key = line.split("=", 1)[0].strip()
        if key in pending_values:
            remaining_lines.append(f"{key}={_quote_env_value(pending_values.pop(key))}")
        else:
            remaining_lines.append(line)

    if pending_values and remaining_lines and remaining_lines[-1].strip():
        remaining_lines.append("")

    for key, value in pending_values.items():
        remaining_lines.append(f"{key}={_quote_env_value(value)}")

    ENV_FILE_PATH.write_text("\n".join(remaining_lines).rstrip() + "\n", encoding="utf-8")
