from fastapi import FastAPI
import app.db.base

from app.db.database import Base, engine, SessionLocal
from app.routers import auth, users, admin
from app.services.seed_service import seed_admin

app = FastAPI(title="FastAPI RBAC")

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    seed_admin(db)
finally:
    db.close()

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "API is running"}