from typing import Annotated
from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.db.database import get_db
from app.dependencies.auth import require_permissions
from app.models.channel import Channel
from app.models.user import User
from app.schemas.channel import ChannelCreate, ChannelListResponse, ChannelResponse, ChannelUpdate
from app.services.activity_log_service import log_activity
from app.services.channel_service import (
    create_channel,
    delete_channel,
    get_channel,
    get_channel_by_name,
    get_channels,
    normalize_channel_name,
    update_channel,
)
from app.services.websocket_manager import websocket_manager

router = APIRouter(prefix="/channels", tags=["channels"])


def _date_start(value: date | None) -> datetime | None:
    return datetime.combine(value, time.min) if value else None


def _date_end(value: date | None) -> datetime | None:
    return datetime.combine(value, time.max) if value else None


@router.get(
    "/",
    response_model=list[ChannelResponse] | ChannelListResponse,
    dependencies=[Depends(require_permissions(["channel:read"]))],
)
def list_all(
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    page: int | None = Query(default=None, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    name: str | None = None,
    created_by: str | None = None,
    updated_by: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    query = db.query(Channel).options(selectinload(Channel.created_by), selectinload(Channel.updated_by))

    if name:
        query = query.filter(Channel.name.ilike(f"%{name.strip()}%"))
    if created_by and created_by != "all":
        created_by_pattern = f"%{created_by.strip()}%"
        if created_by.isdigit():
            query = query.filter(Channel.created_by_id == int(created_by))
        else:
            query = query.join(Channel.created_by).filter(or_(User.full_name.ilike(created_by_pattern), User.email.ilike(created_by_pattern)))
    if updated_by and updated_by != "all":
        updated_by_pattern = f"%{updated_by.strip()}%"
        if updated_by.isdigit():
            query = query.filter(Channel.updated_by_id == int(updated_by))
        else:
            query = query.join(Channel.updated_by).filter(or_(User.full_name.ilike(updated_by_pattern), User.email.ilike(updated_by_pattern)))
    if date_from:
        query = query.filter(Channel.updated_at >= _date_start(date_from))
    if date_to:
        query = query.filter(Channel.updated_at <= _date_end(date_to))

    query = query.order_by(Channel.id.asc())

    if page is None:
        return query.all()

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/", response_model=ChannelResponse)
async def create(
    data: ChannelCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permissions(["channel:create"]))],
):
    channel_name = normalize_channel_name(data.name)

    if not channel_name:
        raise HTTPException(status_code=400, detail="Channel name is required")

    if get_channel_by_name(db, channel_name):
        raise HTTPException(status_code=400, detail=f'Channel name "{channel_name}" already exists')

    channel = create_channel(db, channel_name, current_user=current_user)
    log_activity(
        db,
        event_type="channel_created",
        entity_type="channel",
        entity_id=channel.id,
        description=f'Created channel "{channel.name}"',
        user=current_user,
    )
    await websocket_manager.broadcast({"type": "channels_updated", "action": "create"})
    return channel


@router.put("/{channel_id}", response_model=ChannelResponse)
async def update_single_channel(
    channel_id: int,
    data: ChannelUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permissions(["channel:update"]))],
):
    channel = get_channel(db, channel_id)

    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    channel_name = normalize_channel_name(data.name)

    if not channel_name:
        raise HTTPException(status_code=400, detail="Channel name is required")

    if get_channel_by_name(db, channel_name, exclude_channel_id=channel_id):
        raise HTTPException(status_code=400, detail=f'Channel name "{channel_name}" already exists')

    updated_channel = update_channel(db=db, channel=channel, name=channel_name, current_user=current_user)
    log_activity(
        db,
        event_type="channel_updated",
        entity_type="channel",
        entity_id=updated_channel.id,
        description=f'Updated channel "{updated_channel.name}"',
        user=current_user,
    )
    await websocket_manager.broadcast({"type": "channels_updated", "action": "update"})
    return updated_channel


@router.delete("/{channel_id}", dependencies=[Depends(require_permissions(["channel:delete"]))])
async def remove(
    channel_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permissions(["channel:delete"]))],
):
    existing_channel = get_channel(db, channel_id)
    channel_name = existing_channel.name if existing_channel else None
    channel = delete_channel(db, channel_id)

    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    log_activity(
        db,
        event_type="channel_deleted",
        entity_type="channel",
        entity_id=channel_id,
        description=f'Channel "{channel_name}" was deleted',
        user=current_user,
    )
    await websocket_manager.broadcast({"type": "channels_updated", "action": "delete"})
    return {"message": "Channel deleted"}
