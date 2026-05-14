from typing import Annotated
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse, ChatMessageUpdate
from app.services.websocket_manager import websocket_manager

router = APIRouter(prefix="/chat", tags=["chat"])


def _get_message_or_404(db: Session, message_id: int) -> ChatMessage:
    chat_message = (
        db.query(ChatMessage)
        .options(joinedload(ChatMessage.user))
        .filter(ChatMessage.id == message_id)
        .one_or_none()
    )

    if not chat_message:
        raise HTTPException(status_code=404, detail="Chat message not found")

    return chat_message


def _ensure_message_owner(chat_message: ChatMessage, current_user: User) -> None:
    if chat_message.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own messages")


async def _broadcast_chat_message_update(chat_message: ChatMessage) -> None:
    message_payload = ChatMessageResponse.model_validate(chat_message).model_dump(mode="json")
    await websocket_manager.broadcast({
        "type": "chat_message_updated",
        "message_id": chat_message.id,
        "message": message_payload,
    })


@router.get("/messages", response_model=list[ChatMessageResponse])
def list_chat_messages(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    before_id: int | None = None,
):
    query = db.query(ChatMessage).options(joinedload(ChatMessage.user))

    if before_id:
        query = query.filter(ChatMessage.id < before_id)

    messages = (
        query.order_by(ChatMessage.id.desc())
        .limit(limit)
        .all()
    )

    return list(reversed(messages))


@router.post("/messages", response_model=ChatMessageResponse)
async def create_chat_message(
    data: ChatMessageCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    message = data.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message can not be empty")

    chat_message = ChatMessage(
        message=message,
        user_id=current_user.id,
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)

    saved_message = (
        db.query(ChatMessage)
        .options(joinedload(ChatMessage.user))
        .filter(ChatMessage.id == chat_message.id)
        .one()
    )
    message_payload = ChatMessageResponse.model_validate(saved_message).model_dump(mode="json")
    await websocket_manager.broadcast({
        "type": "chat_message_created",
        "message_id": saved_message.id,
        "message": message_payload,
    })

    return saved_message


@router.put("/messages/{message_id}", response_model=ChatMessageResponse)
async def update_chat_message(
    message_id: int,
    data: ChatMessageUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    chat_message = _get_message_or_404(db, message_id)
    _ensure_message_owner(chat_message, current_user)

    if chat_message.is_unsent:
        raise HTTPException(status_code=400, detail="Unsent messages can not be edited")

    message = data.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message can not be empty")

    chat_message.message = message
    chat_message.edited_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(chat_message)

    saved_message = _get_message_or_404(db, chat_message.id)
    await _broadcast_chat_message_update(saved_message)

    return saved_message


@router.delete("/messages/{message_id}", response_model=ChatMessageResponse)
async def unsend_chat_message(
    message_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    chat_message = _get_message_or_404(db, message_id)
    _ensure_message_owner(chat_message, current_user)

    if not chat_message.is_unsent:
        chat_message.message = ""
        chat_message.is_unsent = True
        chat_message.unsent_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(chat_message)

    saved_message = _get_message_or_404(db, chat_message.id)
    await _broadcast_chat_message_update(saved_message)

    return saved_message
