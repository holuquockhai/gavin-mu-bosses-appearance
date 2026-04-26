from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import require_permissions
from app.models.user import User
from app.schemas.channel import ChannelCreate, ChannelResponse, ChannelUpdate
from app.services.channel_service import (
    create_channel,
    delete_channel,
    get_channel,
    get_channel_by_name,
    get_channels,
    normalize_channel_name,
    update_channel,
)

router = APIRouter(prefix="/channels", tags=["channels"])


@router.get(
    "/",
    response_model=list[ChannelResponse],
    dependencies=[Depends(require_permissions(["channel:read"]))],
)
def list_all(db: Annotated[Session, Depends(get_db)]):
    return get_channels(db)


@router.post("/", response_model=ChannelResponse)
def create(
    data: ChannelCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permissions(["channel:create"]))],
):
    channel_name = normalize_channel_name(data.name)

    if not channel_name:
        raise HTTPException(status_code=400, detail="Channel name is required")

    if get_channel_by_name(db, channel_name):
        raise HTTPException(status_code=400, detail=f'Channel name "{channel_name}" already exists')

    return create_channel(db, channel_name, current_user=current_user)


@router.put("/{channel_id}", response_model=ChannelResponse)
def update_single_channel(
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

    return update_channel(db=db, channel=channel, name=channel_name, current_user=current_user)


@router.delete("/{channel_id}", dependencies=[Depends(require_permissions(["channel:delete"]))])
def remove(channel_id: int, db: Annotated[Session, Depends(get_db)]):
    channel = delete_channel(db, channel_id)

    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    return {"message": "Channel deleted"}
