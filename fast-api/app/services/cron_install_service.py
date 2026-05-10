import logging
import subprocess
import sys
from pathlib import Path

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
INSTALL_SCRIPT = PROJECT_ROOT / "scripts" / "install_email_queue_cron.py"


def ensure_managed_cronjobs() -> None:
    if not INSTALL_SCRIPT.exists():
        logger.warning("Cron install script was not found: %s", INSTALL_SCRIPT)
        return

    try:
        result = subprocess.run(
            [sys.executable, str(INSTALL_SCRIPT)],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            check=False,
            timeout=15,
        )
    except Exception:
        logger.exception("Could not ensure managed cronjobs on startup")
        return

    if result.returncode != 0:
        logger.warning(
            "Could not ensure managed cronjobs on startup: %s",
            (result.stderr or result.stdout or "").strip(),
        )
        return

    logger.info("Managed cronjobs are up to date: %s", result.stdout.strip())
