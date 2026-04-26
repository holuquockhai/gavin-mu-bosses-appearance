from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.db.base

from app.db.database import Base, engine, SessionLocal
from app.routers import auth, users, admin, bosses, timers, notifications, presets, channels
from app.services.seed_service import seed_admin

app = FastAPI(title="FastAPI RBAC")

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


@app.get("/")
def root():
    return {"message": "API is running"}
