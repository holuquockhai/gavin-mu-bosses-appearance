import asyncio
import json

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        self.active_connections: dict[WebSocket, dict | None] = {}
        self.loop: asyncio.AbstractEventLoop | None = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self.loop = loop

    async def connect(self, websocket: WebSocket, user: dict | None = None) -> None:
        await websocket.accept()
        self.active_connections[websocket] = user

    def disconnect(self, websocket: WebSocket) -> dict | None:
        return self.active_connections.pop(websocket, None)

    def has_user_connection(self, user_id: int) -> bool:
        return any(user and user.get("id") == user_id for user in self.active_connections.values())

    def get_online_users(self) -> list[dict]:
        users_by_id = {}

        for user in self.active_connections.values():
            if not user:
                continue

            user_id = user["id"]
            if user_id not in users_by_id:
                users_by_id[user_id] = {**user, "connection_count": 0}

            users_by_id[user_id]["connection_count"] += 1

        return sorted(
            users_by_id.values(),
            key=lambda item: (item.get("full_name") or item.get("email") or "").lower(),
        )

    async def broadcast_online_users(self) -> None:
        await self.broadcast({
            "type": "online_users_updated",
            "users": self.get_online_users(),
        })

    async def broadcast(self, event: dict) -> None:
        message = json.dumps(event)
        disconnected_connections = []

        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                disconnected_connections.append(connection)

        for connection in disconnected_connections:
            self.disconnect(connection)

    def broadcast_later(self, event: dict) -> None:
        if not self.loop:
            return

        self.loop.call_soon_threadsafe(asyncio.create_task, self.broadcast(event))


websocket_manager = WebSocketManager()
