from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.boss import Boss
from app.models.preset import Preset
from app.models.timer import BossHistory, BossTimer
from app.models.user import User

def create_boss(db: Session, name: str, current_user: User) -> Boss:
    boss = Boss(name=name.strip(),
                created_by_id=current_user.id,
                updated_by_id=current_user.id,)
    db.add(boss)
    db.commit()
    db.refresh(boss)
    return boss


def get_bosses(db: Session):
    return db.query(Boss).all()


def get_boss(db: Session, boss_id: int):
    return db.query(Boss).filter(Boss.id == boss_id).first()

def get_boss_by_name(db: Session, name: str, exclude_boss_id: int | None = None):
    query = db.query(Boss).filter(func.lower(Boss.name) == name.strip().lower())

    if exclude_boss_id is not None:
        query = query.filter(Boss.id != exclude_boss_id)

    return query.first()

def get_bosse_by_name(db: Session, name: str):
    return get_boss_by_name(db, name)

def delete_boss(db: Session, boss_id: int):
    boss = get_boss(db, boss_id)
    if boss:
        db.query(BossTimer).filter(BossTimer.boss_id == boss_id).delete(synchronize_session=False)
        db.query(BossHistory).filter(BossHistory.boss_id == boss_id).delete(synchronize_session=False)

        presets = db.query(Preset).all()
        for preset in presets:
            channels = preset.channels or {}
            updated_channels = {}

            for channel, boss_ids in channels.items():
                if isinstance(boss_ids, list):
                    updated_channels[channel] = [
                        saved_boss_id
                        for saved_boss_id in boss_ids
                        if str(saved_boss_id) != str(boss_id)
                    ]
                else:
                    updated_channels[channel] = boss_ids

            preset.channels = updated_channels

        db.delete(boss)
        db.commit()
    return boss

def update_boss(db: Session, boss: Boss, name: str, current_user: User) -> Boss:
    boss.name = name.strip()
    boss.updated_by_id = current_user.id
    db.commit()
    db.refresh(boss)
    return boss
