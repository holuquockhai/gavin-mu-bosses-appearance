# WARLORDS Boss Timer

WARLORDS Boss Timer is a FastAPI and React application for tracking MU boss timers with roles, permissions, admin management, realtime updates, notifications, chat, email queueing, and maintenance tooling.

## Project Structure

```text
fast-api/       FastAPI backend, SQLAlchemy models, cron scripts, email worker
react-project/  Vite React frontend
docs/           Deployment and operations documentation
html_origin/    Original static prototype assets
```

## Main Features

- User authentication with admin/user roles and permissions.
- Boss, channel, and user management for admins.
- Realtime boss countdown synchronization through WebSocket.
- Recent boss history and coming-soon boss lists with lazy loading.
- User presets for show/hide boss card settings per channel.
- Notification bell for user, boss, timer, and system events.
- Team chat with realtime messages and online user count.
- User profiles with avatar, phone, country, bio, joined date, and last login.
- SMTP-backed email queue for account, reset password, inactive, and deleted-user emails.
- System settings for branding, API URL, SMTP, MySQL, maintenance, cleanup retention, backup, restore, and factory reset.
- Managed cronjobs for email sending, chat cleanup, and log cleanup.

## Local Setup

### Backend

```bash
cd fast-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env_example .env
uvicorn app.main:app --reload
```

Default local API:

```text
http://127.0.0.1:8000
```

### Frontend

```bash
cd react-project
npm install
npm run dev
```

Default local frontend:

```text
http://127.0.0.1:5173
```

For local development, the frontend API config automatically uses:

```text
http://127.0.0.1:8000
```

For production builds, it uses:

```text
/api
```

## Environment

Backend settings live in `fast-api/.env`.

Example:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=mu_bosses
MYSQL_USERNAME=root
MYSQL_PASSWORD=root
MYSQL_CHARSET=utf8mb4
DATABASE_URL=mysql+pymysql://root:root@127.0.0.1:3306/mu_bosses?charset=utf8mb4

SECRET_KEY=change-this-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

On the EC2 server, use the public URL in Admin System Settings:

```text
Frontend base URL: http://13.236.146.112
API base URL: http://13.236.146.112/api
```

## Useful Commands

Backend compile check:

```bash
python3 -m py_compile fast-api/app/main.py
```

Frontend checks:

```bash
cd react-project
npm run lint
npm run build
```

Install managed cronjobs:

```bash
cd fast-api
source venv/bin/activate
python scripts/install_email_queue_cron.py
crontab -l
```

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md)
- [Operations Guide](docs/OPERATIONS.md)
- [Architecture Notes](docs/ARCHITECTURE.md)

