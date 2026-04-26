from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.channel import Channel
from app.models.user import User


def normalize_channel_name(name: str) -> str:
    return " ".join(name.strip().split())


def get_channel(db: Session, channel_id: int) -> Channel | None:
    stmt = (
        select(Channel)
        .options(selectinload(Channel.created_by), selectinload(Channel.updated_by))
        .where(Channel.id == channel_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_channel_by_name(
    db: Session,
    name: str,
    exclude_channel_id: int | None = None,
) -> Channel | None:
    normalized_name = normalize_channel_name(name)
    stmt = select(Channel).where(func.lower(Channel.name) == normalized_name.lower())

    if exclude_channel_id is not None:
        stmt = stmt.where(Channel.id != exclude_channel_id)

    return db.execute(stmt).scalar_one_or_none()


def get_channels(db: Session) -> list[Channel]:
    stmt = (
        select(Channel)
        .options(selectinload(Channel.created_by), selectinload(Channel.updated_by))
        .order_by(Channel.id.asc())
    )
    return db.execute(stmt).scalars().all()


def create_channel(db: Session, name: str, current_user: User) -> Channel:
    channel = Channel(
        name=normalize_channel_name(name),
        created_by_id=current_user.id,
        updated_by_id=current_user.id,
    )
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return get_channel(db, channel.id)


def update_channel(db: Session, channel: Channel, name: str, current_user: User) -> Channel:
    channel.name = normalize_channel_name(name)
    channel.updated_by_id = current_user.id
    db.commit()
    db.refresh(channel)
    return get_channel(db, channel.id)


def delete_channel(db: Session, channel_id: int) -> Channel | None:
    channel = get_channel(db, channel_id)

    if not channel:
        return None

    db.delete(channel)
    db.commit()
    return channel
