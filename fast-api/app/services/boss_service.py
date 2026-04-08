from sqlalchemy.orm import Session
from app.models.boss import Boss


def create_boss(db: Session, name: str) -> Boss:
    boss = Boss(name=name)
    db.add(boss)
    db.commit()
    db.refresh(boss)
    return boss


def get_bosses(db: Session):
    return db.query(Boss).all()


def get_boss(db: Session, boss_id: int):
    return db.query(Boss).filter(Boss.id == boss_id).first()


def delete_boss(db: Session, boss_id: int):
    boss = get_boss(db, boss_id)
    if boss:
        db.delete(boss)
        db.commit()
    return boss