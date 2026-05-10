#!/usr/bin/env python3
from pathlib import Path
import shutil
import subprocess
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOCAL_VENV_PYTHON = PROJECT_ROOT / "venv" / "bin" / "python"
SERVER_VENV_PYTHON = PROJECT_ROOT / ".venv" / "bin" / "python"
PYTHON_BIN = (
    LOCAL_VENV_PYTHON
    if LOCAL_VENV_PYTHON.exists()
    else SERVER_VENV_PYTHON
    if SERVER_VENV_PYTHON.exists()
    else Path(sys.executable).resolve()
)
LOG_FILE = PROJECT_ROOT / "email_queue_cron.log"
CRON_START = "# WARLORDS_EMAIL_QUEUE_CRON_START"
CRON_END = "# WARLORDS_EMAIL_QUEUE_CRON_END"


def _read_current_crontab() -> str:
    result = subprocess.run(["crontab", "-l"], capture_output=True, text=True, check=False)
    if result.returncode != 0:
        return ""

    return result.stdout


def _without_managed_block(crontab_text: str) -> str:
    lines = crontab_text.splitlines()
    cleaned_lines = []
    inside_managed_block = False

    for line in lines:
        if line.strip() == CRON_START:
            inside_managed_block = True
            continue

        if line.strip() == CRON_END:
            inside_managed_block = False
            continue

        if not inside_managed_block:
            cleaned_lines.append(line)

    return "\n".join(cleaned_lines).strip()


def _install_crontab(crontab_text: str) -> None:
    subprocess.run(["crontab", "-"], input=f"{crontab_text.strip()}\n", text=True, check=True)


def main() -> None:
    if not shutil.which("crontab"):
        raise RuntimeError("crontab command was not found on this server")

    process_script = PROJECT_ROOT / "scripts" / "process_email_queue.py"
    cron_command = (
        f"*/5 * * * * cd {PROJECT_ROOT} && {PYTHON_BIN} {process_script.relative_to(PROJECT_ROOT)} "
        f">> {LOG_FILE} 2>&1"
    )
    managed_block = "\n".join([CRON_START, cron_command, CRON_END])
    current_crontab = _read_current_crontab()
    unmanaged_crontab = _without_managed_block(current_crontab)
    next_crontab = "\n\n".join(part for part in [unmanaged_crontab, managed_block] if part)

    _install_crontab(next_crontab)
    print("Installed WARLORDS email queue cronjob:")
    print(cron_command)


if __name__ == "__main__":
    main()
