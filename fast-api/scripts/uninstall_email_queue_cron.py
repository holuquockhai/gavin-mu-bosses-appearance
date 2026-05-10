#!/usr/bin/env python3
import shutil
import subprocess

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


def main() -> None:
    if not shutil.which("crontab"):
        raise RuntimeError("crontab command was not found on this server")

    next_crontab = _without_managed_block(_read_current_crontab())
    subprocess.run(["crontab", "-"], input=f"{next_crontab}\n", text=True, check=True)
    print("Removed WARLORDS email queue cronjob.")


if __name__ == "__main__":
    main()
