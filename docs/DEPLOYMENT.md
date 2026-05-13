# Deployment Guide

This guide deploys the FastAPI backend and Vite React frontend to Ubuntu EC2 with Nginx.

## 1. SSH

```bash
chmod 400 Warlords_AWS_EC2.pem
ssh -i Warlords_AWS_EC2.pem ubuntu@13.236.146.112
```

## 2. Pull Code

```bash
cd /var/www/warlords
git checkout codex
git pull origin codex
```

## 3. Backend

```bash
cd /var/www/warlords/fast-api
source .venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart warlords-api
sudo systemctl status warlords-api
```

Check logs:

```bash
sudo journalctl -u warlords-api -n 100 --no-pager
```

## 4. Frontend

```bash
cd /var/www/warlords/react-project
npm install
npm run build
```

## 5. Nginx

Recommended Nginx block without a domain:

```nginx
server {
    listen 80;
    server_name 13.236.146.112;

    root /var/www/warlords/react-project/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    location /uploads/ {
        alias /var/www/warlords/fast-api/uploads/;
    }
}
```

Apply:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Required URLs

In Admin System Settings:

```text
Frontend base URL: http://13.236.146.112
API base URL: http://13.236.146.112/api
```

In backend `.env`:

```env
FRONTEND_URL=http://13.236.146.112
API_BASE_URL=http://13.236.146.112/api
```

## 7. Cronjobs

Install cron if missing:

```bash
sudo apt update
sudo apt install cron -y
sudo systemctl enable cron
sudo systemctl start cron
```

Install WARLORDS managed cronjobs:

```bash
cd /var/www/warlords/fast-api
source .venv/bin/activate
python scripts/install_email_queue_cron.py
crontab -l
```

Expected jobs:

```cron
# WARLORDS_EMAIL_QUEUE_CRON_START
*/5 * * * * cd /var/www/warlords/fast-api && /var/www/warlords/fast-api/.venv/bin/python scripts/process_email_queue.py >> /var/www/warlords/fast-api/email_queue_cron.log 2>&1
15 3 * * * cd /var/www/warlords/fast-api && /var/www/warlords/fast-api/.venv/bin/python scripts/process_chat_cleanup.py >> /var/www/warlords/fast-api/chat_cleanup_cron.log 2>&1
30 3 * * * cd /var/www/warlords/fast-api && /var/www/warlords/fast-api/.venv/bin/python scripts/process_logs_cleanup.py >> /var/www/warlords/fast-api/logs_cleanup_cron.log 2>&1
# WARLORDS_EMAIL_QUEUE_CRON_END
```

If startup logs say `crontab command was not found`, install `cron` using the commands above.

## 8. Browser Cache

After deployment, hard refresh:

```text
Mac: Cmd + Shift + R
Windows: Ctrl + F5
```

