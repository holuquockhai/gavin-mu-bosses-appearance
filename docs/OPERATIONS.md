# Operations Guide

This guide covers common maintenance tasks for WARLORDS Boss Timer.

## Services

Backend:

```bash
sudo systemctl status warlords-api
sudo systemctl restart warlords-api
sudo journalctl -u warlords-api -n 100 --no-pager
```

Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx
```

Cron:

```bash
crontab -l
sudo systemctl status cron
```

## Cron Logs

```bash
tail -n 100 /var/www/warlords/fast-api/email_queue_cron.log
tail -n 100 /var/www/warlords/fast-api/chat_cleanup_cron.log
tail -n 100 /var/www/warlords/fast-api/logs_cleanup_cron.log
```

Cron results are also visible in Admin > Logs > Cronjob Logs.

## Email Queue

Emails are inserted into `email_queue` and sent by the managed cronjob.

Manual run:

```bash
cd /var/www/warlords/fast-api
source .venv/bin/activate
python scripts/process_email_queue.py
```

Important settings:

- SMTP host, port, username, password
- From email
- From name
- Emails per cron run
- API base URL, used by email links and logo URLs

For Gmail, use an app password instead of the normal Gmail password.

## Email Logo

Email templates use the uploaded site logo when available. If no uploaded logo exists, they use:

```text
{API base URL}/system-settings/email-logo.png
```

If the URL works in a browser but not in an email client, the client may be blocking images. Yopmail and some webmail previews often block external images, especially from `http://` IP addresses. HTTPS with a domain is recommended.

## Realtime And WebSocket

Nginx must proxy `/ws/` to FastAPI:

```nginx
location /ws/ {
    proxy_pass http://127.0.0.1:8000/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

Frontend realtime events update:

- Boss timer state
- Boss/channel/user management lists
- Notifications
- Chat messages
- Online users
- Logs
- Factory reset logout

## Mobile Sound

Mobile browsers require a user gesture before playing audio. The frontend unlocks alert sound on first tap, touch, or key press. If a phone is locked or the browser tab is fully backgrounded, iOS/Android may still block sound.

## Database Backup And Restore

Admin System Settings includes:

- MySQL database SQL backup
- MySQL database SQL restore
- System settings JSON backup
- System settings JSON restore

Keep backup files private because they may contain secrets.

## Factory Reset

Factory reset removes website data while preserving users, roles, and permissions.

Preserved:

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`

After reset, connected users are sent a websocket event and logged out.

## Timezone Handling

Backend MySQL connections set the session timezone to UTC. The frontend treats API timestamps as UTC and displays them in the viewer's browser timezone.

If old rows were created before UTC handling was added, they may still display with older offset behavior.

