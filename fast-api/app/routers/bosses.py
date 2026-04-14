from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.boss import BossCreate, BossResponse, BossUpdate
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User
from app.services.boss_service import create_boss, get_bosses, get_bosse_by_name, get_boss, delete_boss, update_boss
from app.dependencies.auth import require_permissions

router = APIRouter(prefix="/bosses", tags=["bosses"])


@router.post("/", response_model=BossResponse,
             dependencies=[Depends(require_permissions(["boss:create"]))])
def create(data: BossCreate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(require_permissions(["boss:create"]))],):
    boss = get_bosse_by_name(db, data.name)


    #Check if boss exist or not, then create new boss
    if boss:
        raise HTTPException(status_code=400, detail="Boss already exists")

    return create_boss(db, data.name, current_user=current_user)


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

@router.put("/{boss_id}", response_model=BossResponse)
def update_single_boss(
    boss_id: int,
    data: BossUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles("admin"))],
):
    boss = get_boss(db, boss_id)
    if not boss:
        raise HTTPException(status_code=404, detail="Boss not found")

    return update_boss(db=db, boss=boss, name=data.name, current_user=current_user)

@router.delete("/{boss_id}",
               dependencies=[Depends(require_permissions(["boss:delete"]))])
def remove(boss_id: int, db: Annotated[Session, Depends(get_db)]):
    boss = delete_boss(db, boss_id)
    if not boss:
        raise HTTPException(status_code=404, detail="Boss not found")
    return {"message": "Boss deleted"}