from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.preset import Preset
from app.models.user import User
from app.schemas.preset import PresetChannelUpdate, PresetCreate, PresetResponse, PresetUpdate

router = APIRouter(prefix="/presets", tags=["presets"])


def get_user_preset(db: Session, preset_id: int, user_id: int) -> Preset | None:
    return db.query(Preset).filter(Preset.id == preset_id, Preset.user_id == user_id).first()


@router.get("/", response_model=list[PresetResponse])
def list_presets(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return db.query(Preset).filter(Preset.user_id == current_user.id).order_by(Preset.created_at.asc()).all()


@router.post("/", response_model=PresetResponse)
def create_preset(
    data: PresetCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    preset_count = db.query(Preset).filter(Preset.user_id == current_user.id).count()
    if preset_count >= 3:
        raise HTTPException(status_code=400, detail="Maximum 3 presets allowed")

    preset_name = data.name.strip()
    existing = db.query(Preset).filter(Preset.user_id == current_user.id, Preset.name == preset_name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f'Preset "{preset_name}" already exists')

    preset = Preset(name=preset_name, channels=data.channels, user_id=current_user.id)
    db.add(preset)
    db.commit()
    db.refresh(preset)
    return preset


@router.put("/{preset_id}", response_model=PresetResponse)
def update_preset(
    preset_id: int,
    data: PresetUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    preset = get_user_preset(db, preset_id, current_user.id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    if data.name is not None:
        preset_name = data.name.strip()
        duplicated = (
            db.query(Preset)
            .filter(Preset.user_id == current_user.id, Preset.name == preset_name, Preset.id != preset_id)
            .first()
        )
        if duplicated:
            raise HTTPException(status_code=400, detail=f'Preset "{preset_name}" already exists')
        preset.name = preset_name

    if data.channels is not None:
        preset.channels = data.channels

    db.commit()
    db.refresh(preset)
    return preset


@router.put("/{preset_id}/channel", response_model=PresetResponse)
def save_preset_channel(
    preset_id: int,
    data: PresetChannelUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    preset = get_user_preset(db, preset_id, current_user.id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    preset.channels = {
        **(preset.channels or {}),
        data.channel: data.boss_ids,
    }
    db.commit()
    db.refresh(preset)
    return preset


@router.delete("/{preset_id}")
def delete_preset(
    preset_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    preset = get_user_preset(db, preset_id, current_user.id)
    if preset:
        db.delete(preset)
        db.commit()

    return {"message": "Preset deleted"}
