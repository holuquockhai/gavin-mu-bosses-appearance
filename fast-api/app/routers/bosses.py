from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user, require_permissions
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/bosses", tags=["bosses"])

# get user Router
@router.get("/", dependencies=[Depends(require_permissions(["boss:read"]))])
def list_users():
    return {"message": "You can read users"}

@router.post("/", dependencies=[Depends(require_permissions(["boss:create"]))])
def create_user():
    return {"message": "You can create users"}