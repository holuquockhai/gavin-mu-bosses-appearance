# Architecture Notes

## Backend

The backend is a FastAPI app with SQLAlchemy models.

Important folders:

```text
fast-api/app/models/     Database models
fast-api/app/routers/    API routes
fast-api/app/schemas/    Pydantic response/request schemas
fast-api/app/services/   Business logic, email, cron, websocket helpers
fast-api/scripts/        Cron scripts and installers
```

Startup work happens in `app/main.py`:

- Bind websocket manager to the app event loop.
- Ensure managed cronjobs are installed.
- Start the expired boss timer checker.
- Create missing database tables and lightweight compatibility columns.
- Seed roles, permissions, default admin, bosses, and channels.

## Frontend

The frontend is a Vite React app with Redux slices for shared app state.

Important folders:

```text
react-project/src/api/        Axios API wrappers
react-project/src/hooks/      Realtime and connection hooks
react-project/src/js/         Redux slices
react-project/src/pages/      User and admin pages
react-project/src/scss/       Feature-specific styles
react-project/src/utils/      Auth, date/time, sound, UI helpers
```

## Realtime Flow

1. Frontend opens `/ws/realtime` with the JWT token.
2. Backend validates the token and stores the connected user in `websocket_manager`.
3. Backend broadcasts typed events.
4. `useRealtimeSync` receives events and updates Redux or dispatches browser events.
5. Pages listen for browser events when they need a targeted refresh.

Common event types:

```text
timer_state_updated
notifications_updated
bosses_updated
channels_updated
users_updated
logs_updated
email_logs_updated
cron_logs_updated
online_users_updated
chat_message_created
chat_user_joined
chat_user_left
factory_reset_completed
```

## Boss Timer Flow

Setting a timer:

1. User selects boss, channel, hours, and minutes.
2. Frontend sends `POST /boss-timers/`.
3. Backend stores one active timer per boss/channel.
4. Backend broadcasts `timer_state_updated`.
5. Other clients refresh the active timer list through websocket-driven state refresh.

Timer expiry:

- Frontend calls `/boss-timers/complete-expired` as soon as it detects an expired countdown.
- Backend fallback checker also runs every few seconds.
- Expired timers become boss history records.
- Notifications and logs are created.
- WebSocket broadcasts tell all connected clients to refresh.

## Email Flow

1. App action queues an email in `email_queue`.
2. Email queue cron runs every 5 minutes.
3. Cron sends pending email batch using SMTP settings.
4. Cron writes a `cron_job_logs` row.
5. Frontend logs page updates through websocket.

All email HTML is built through `mail_service._build_email_html`, so account creation, deletion, inactive, and password reset emails share the same logo/header/signature layout.

## Timezone Flow

- Backend stores API timestamps in UTC.
- MySQL connections run with `SET time_zone = '+00:00'`.
- Frontend parses API dates with `src/utils/dateTime.js`.
- Display uses the browser's timezone from `Intl.DateTimeFormat().resolvedOptions().timeZone`.

