from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.services.websocket_manager import websocket_manager

router = APIRouter(prefix="/chat", tags=["chat"])


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
