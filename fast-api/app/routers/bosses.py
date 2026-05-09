from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.boss import BossCreate, BossResponse, BossUpdate
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.boss_service import create_boss, get_bosses, get_boss_by_name, get_boss, delete_boss, update_boss
from app.dependencies.auth import require_permissions
from app.services.websocket_manager import websocket_manager

router = APIRouter(prefix="/bosses", tags=["bosses"])


@router.post("/", response_model=BossResponse,
             dependencies=[Depends(require_permissions(["boss:create"]))])
async def create(data: BossCreate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(require_permissions(["boss:create"]))],):
    boss = get_boss_by_name(db, data.name)
    boss_name = data.name.strip()


    #Check if boss exist or not, then create new boss
    if boss:
        raise HTTPException(status_code=400, detail=f'Boss name "{boss_name}" already exists')

    created_boss = create_boss(db, boss_name, current_user=current_user)
    await websocket_manager.broadcast({"type": "bosses_updated", "action": "create"})
    return created_boss


@router.get("/", response_model=list[BossResponse],
            dependencies=[Depends(require_permissions(["boss:read"]))])
def list_all(response: Response, db: Annotated[Session, Depends(get_db)]):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    return get_bosses(db)

@router.get("/{boss_id}", response_model=BossResponse,
            dependencies=[Depends(require_permissions(["boss:read"]))])
def get_one(boss_id: int, db: Annotated[Session, Depends(get_db)]):
    boss = get_boss(db, boss_id)
    if not boss:
        raise HTTPException(status_code=404, detail="Boss not found")
    return boss

@router.put("/{boss_id}", response_model=BossResponse)
async def update_single_boss(
    boss_id: int,
    data: BossUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permissions(["boss:update"]))],
):
    boss = get_boss(db, boss_id)
    if not boss:
        raise HTTPException(status_code=404, detail="Boss not found")

    duplicated_boss = get_boss_by_name(db, data.name, exclude_boss_id=boss_id)
    if duplicated_boss:
        raise HTTPException(status_code=400, detail=f'Boss name "{data.name.strip()}" already exists')

    updated_boss = update_boss(db=db, boss=boss, name=data.name, current_user=current_user)
    await websocket_manager.broadcast({"type": "bosses_updated", "action": "update"})
    return updated_boss

@router.delete("/{boss_id}",
               dependencies=[Depends(require_permissions(["boss:delete"]))])
async def remove(boss_id: int, db: Annotated[Session, Depends(get_db)]):
    boss = delete_boss(db, boss_id)
    if not boss:
        raise HTTPException(status_code=404, detail="Boss not found")
    await websocket_manager.broadcast({"type": "bosses_updated", "action": "delete"})
    return {"message": "Boss deleted"}
