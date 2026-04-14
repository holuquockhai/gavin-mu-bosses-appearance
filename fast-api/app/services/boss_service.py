from sqlalchemy.orm import Session
from app.models.boss import Boss
from app.models.user import User

def create_boss(db: Session, name: str, current_user: User) -> Boss:
    boss = Boss(name=name,
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

def get_bosse_by_name(db: Session, name: str):
    return db.query(Boss).filter(Boss.name == name).first()

def delete_boss(db: Session, boss_id: int):
    boss = get_boss(db, boss_id)
    if boss:
        db.delete(boss)
        db.commit()
    return boss

def update_boss(db: Session, boss: Boss, name: str, current_user: User) -> Boss:
    boss.name = name
    boss.updated_by_id = current_user.id
    db.commit()
    db.refresh(boss)
    return boss