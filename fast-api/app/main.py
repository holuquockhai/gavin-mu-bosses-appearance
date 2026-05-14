from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import app.db.base
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from sqlalchemy import inspect, text

from app.db.database import Base, engine, SessionLocal
from app.routers import auth, users, admin, bosses, timers, notifications, presets, channels, system_settings, realtime, logs, chat
from app.services.cron_install_service import ensure_managed_cronjobs
from app.services.seed_service import seed_admin
from app.services.timer_scheduler import start_expired_timer_checker, stop_expired_timer_checker
from app.services.websocket_manager import websocket_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    websocket_manager.bind_loop(asyncio.get_running_loop())
    await asyncio.to_thread(ensure_managed_cronjobs)
    expired_timer_checker = start_expired_timer_checker()
    try:
        yield
    finally:
        await stop_expired_timer_checker(expired_timer_checker)


app = FastAPI(title="FastAPI RBAC", lifespan=lifespan)

# List the origins (URL of your React app) allowed to make requests
origins = [
    "http://localhost:3000",  # Default React port
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Default Vite port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Use ["*"] to allow all (not recommended for production)
    allow_credentials=True,      # Allow cookies and authentication headers
    allow_methods=["*"],         # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],         # Allow all headers
)

Base.metadata.create_all(bind=engine)

with engine.begin() as conn:
    conn.execute(text("ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))

uploads_path = Path(__file__).resolve().parents[1] / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

with engine.begin() as conn:
    user_columns = {column["name"] for column in inspect(conn).get_columns("users")}
    if "phone_number" not in user_columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR(40) NULL"))
    if "country" not in user_columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN country VARCHAR(100) NULL"))
    if "avatar_url" not in user_columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL"))
    if "bio" not in user_columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN bio TEXT NULL"))
    if "created_at" not in user_columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"))
    if "last_login_at" not in user_columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL"))
    if "must_update_password" not in user_columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN must_update_password BOOLEAN NOT NULL DEFAULT FALSE"))
    chat_columns = {column["name"] for column in inspect(conn).get_columns("chat_messages")}
    if "created_at" not in chat_columns:
        conn.execute(text("ALTER TABLE chat_messages ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"))
    if "edited_at" not in chat_columns:
        conn.execute(text("ALTER TABLE chat_messages ADD COLUMN edited_at DATETIME NULL"))
    if "unsent_at" not in chat_columns:
        conn.execute(text("ALTER TABLE chat_messages ADD COLUMN unsent_at DATETIME NULL"))
    if "is_unsent" not in chat_columns:
        conn.execute(text("ALTER TABLE chat_messages ADD COLUMN is_unsent BOOLEAN NOT NULL DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE chat_messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
    boss_history_columns = {column["name"] for column in inspect(conn).get_columns("boss_history")}
    if "appeared_by_name" not in boss_history_columns:
        conn.execute(text("ALTER TABLE boss_history ADD COLUMN appeared_by_name VARCHAR(255) NULL"))
    if "appeared_by_type" not in boss_history_columns:
        conn.execute(text("ALTER TABLE boss_history ADD COLUMN appeared_by_type VARCHAR(40) NULL"))

db = SessionLocal()
try:
    seed_admin(db)
finally:
    db.close()

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)

app.include_router(bosses.router)
app.include_router(timers.router)
app.include_router(notifications.router)
app.include_router(presets.router)
app.include_router(channels.router)
app.include_router(system_settings.public_router)
app.include_router(system_settings.router)
app.include_router(realtime.router)
app.include_router(logs.router)
app.include_router(logs.internal_router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {"message": "API is running"}
