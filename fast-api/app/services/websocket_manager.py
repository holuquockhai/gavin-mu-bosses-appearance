import json

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event: dict) -> None:
        message = json.dumps(event)
        disconnected_connections = []

        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected_connections.append(connection)

        for connection in disconnected_connections:
            self.disconnect(connection)


websocket_manager = WebSocketManager()

