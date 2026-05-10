from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.security import decode_token
from app.db.database import SessionLocal
from app.models.user import User
from app.services.websocket_manager import websocket_manager

router = APIRouter(tags=["realtime"])


def _user_payload(user: User) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "avatar_url": user.avatar_url,
    }


def _get_websocket_user(token: str | None) -> dict | None:
    if not token:
        return None

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
    except Exception:
        return None

    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.id == int(user_id))).scalar_one_or_none()
        if not user or not user.is_active:
            return None

        return _user_payload(user)
    finally:
        db.close()


@router.websocket("/ws/realtime")
async def realtime_socket(websocket: WebSocket):
    user = _get_websocket_user(websocket.query_params.get("token"))
    if not user:
        await websocket.close(code=1008)
        return

    await websocket_manager.connect(websocket, user)
    await websocket_manager.broadcast_online_users()

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
        await websocket_manager.broadcast_online_users()
