from typing import Annotated
from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.db.database import get_db
from app.models.boss import Boss
from app.schemas.boss import BossCreate, BossListResponse, BossResponse, BossUpdate
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.boss_service import create_boss, get_bosses, get_boss_by_name, get_boss, delete_boss, update_boss
from app.dependencies.auth import require_permissions
from app.services.activity_log_service import log_activity
from app.services.websocket_manager import websocket_manager

router = APIRouter(prefix="/bosses", tags=["bosses"])


def _date_start(value: date | None) -> datetime | None:
    return datetime.combine(value, time.min) if value else None


def _date_end(value: date | None) -> datetime | None:
    return datetime.combine(value, time.max) if value else None


@router.post("/", response_model=BossResponse,
             dependencies=[Depends(require_permissions(["boss:create"]))])
async def create(data: BossCreate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(require_permissions(["boss:create"]))],):
    boss = get_boss_by_name(db, data.name)
    boss_name = data.name.strip()


    #Check if boss exist or not, then create new boss
    if boss:
        raise HTTPException(status_code=400, detail=f'Boss name "{boss_name}" already exists')

    created_boss = create_boss(db, boss_name, current_user=current_user)
    log_activity(
        db,
        event_type="boss_created",
        entity_type="boss",
        entity_id=created_boss.id,
        description=f'Created boss "{created_boss.name}"',
        user=current_user,
    )
    await websocket_manager.broadcast({"type": "bosses_updated", "action": "create"})
    return created_boss


@router.get("/", response_model=list[BossResponse] | BossListResponse,
            dependencies=[Depends(require_permissions(["boss:read"]))])
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
    query = db.query(Boss).options(selectinload(Boss.created_by), selectinload(Boss.updated_by))

    if name:
        query = query.filter(Boss.name.ilike(f"%{name.strip()}%"))
    if created_by and created_by != "all":
        created_by_pattern = f"%{created_by.strip()}%"
        if created_by.isdigit():
            query = query.filter(Boss.created_by_id == int(created_by))
        else:
            query = query.join(Boss.created_by).filter(or_(User.full_name.ilike(created_by_pattern), User.email.ilike(created_by_pattern)))
    if updated_by and updated_by != "all":
        updated_by_pattern = f"%{updated_by.strip()}%"
        if updated_by.isdigit():
            query = query.filter(Boss.updated_by_id == int(updated_by))
        else:
            query = query.join(Boss.updated_by).filter(or_(User.full_name.ilike(updated_by_pattern), User.email.ilike(updated_by_pattern)))
    if date_from:
        query = query.filter(Boss.updated_at >= _date_start(date_from))
    if date_to:
        query = query.filter(Boss.updated_at <= _date_end(date_to))

    query = query.order_by(Boss.id.asc())

    if page is None:
        return query.all()

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}

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
    log_activity(
        db,
        event_type="boss_updated",
        entity_type="boss",
        entity_id=updated_boss.id,
        description=f'Updated boss "{updated_boss.name}"',
        user=current_user,
    )
    await websocket_manager.broadcast({"type": "bosses_updated", "action": "update"})
    return updated_boss

@router.delete("/{boss_id}",
               dependencies=[Depends(require_permissions(["boss:delete"]))])
async def remove(
    boss_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    existing_boss = get_boss(db, boss_id)
    boss_name = existing_boss.name if existing_boss else None
    boss = delete_boss(db, boss_id)
    if not boss:
        raise HTTPException(status_code=404, detail="Boss not found")
    log_activity(
        db,
        event_type="boss_deleted",
        entity_type="boss",
        entity_id=boss_id,
        description=f'Boss "{boss_name}" was deleted',
        user=current_user,
    )
    await websocket_manager.broadcast({"type": "bosses_updated", "action": "delete"})
    return {"message": "Boss deleted"}
