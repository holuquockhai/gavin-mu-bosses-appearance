import json
from datetime import datetime, timezone

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

    was_online = websocket_manager.has_user_connection(user["id"])
    await websocket_manager.connect(websocket, user)
    await websocket_manager.broadcast_online_users()
    if not was_online:
        await websocket_manager.broadcast({
            "type": "chat_user_joined",
            "user": user,
            "joined_at": datetime.now(timezone.utc).isoformat(),
        })

    try:
        while True:
            message = await websocket.receive_text()
            try:
                payload = json.loads(message)
            except json.JSONDecodeError:
                continue

            if payload.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            elif payload.get("type") == "activity":
                if websocket_manager.touch_user_activity(user["id"]):
                    await websocket_manager.broadcast_online_users()
    except WebSocketDisconnect:
        disconnected_user = websocket_manager.disconnect(websocket)
        await websocket_manager.broadcast_online_users()
        if disconnected_user and not websocket_manager.has_user_connection(disconnected_user["id"]):
            await websocket_manager.broadcast({
                "type": "chat_user_left",
                "user": disconnected_user,
                "left_at": datetime.now(timezone.utc).isoformat(),
            })
