from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.boss import BossCreate, BossResponse
from app.services.boss_service import create_boss, get_bosses, get_boss, delete_boss
from app.dependencies.auth import require_permissions

router = APIRouter(prefix="/bosses", tags=["bosses"])


@router.post("/", response_model=BossResponse,
             dependencies=[Depends(require_permissions(["boss:create"]))])
def create(data: BossCreate, db: Annotated[Session, Depends(get_db)]):
    return create_boss(db, data.name)


@router.get("/", response_model=list[BossResponse],
            dependencies=[Depends(require_permissions(["boss:read"]))])
def list_all(db: Annotated[Session, Depends(get_db)]):
    return get_bosses(db)


@router.get("/{boss_id}", response_model=BossResponse,
            dependencies=[Depends(require_permissions(["boss:read"]))])
def get_one(boss_id: int, db: Annotated[Session, Depends(get_db)]):
    boss = get_boss(db, boss_id)
    if not boss:
        raise HTTPException(status_code=404, detail="Boss not found")
    return boss


@router.delete("/{boss_id}",
               dependencies=[Depends(require_permissions(["boss:delete"]))])
def remove(boss_id: int, db: Annotated[Session, Depends(get_db)]):
    boss = delete_boss(db, boss_id)
    if not boss:
        raise HTTPException(status_code=404, detail="Boss not found")
    return {"message": "Boss deleted"}