from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine.url import make_url

from app.core.config import settings

url = make_url(settings.database_url)
db_name = url.database

if not db_name:
    raise RuntimeError("DATABASE_URL must include a database name")

server_url = url.set(database=None)

server_engine = create_engine(
    server_url,
    pool_pre_ping=True,
)

with server_engine.connect() as conn:
    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}`"))
    conn.commit()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
