from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user, require_permissions
from app.models.user import User
from app.schemas.user import UserResponse

# Users Router
router = APIRouter(prefix="/users", tags=["users"])


# Get current user Router
@router.get("/me", response_model=UserResponse)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


# get user Router
@router.get("/", dependencies=[Depends(require_permissions(["user:read"]))])
def list_users():
    return {"message": "You can read users"}

# Create user
@router.post("/", dependencies=[Depends(require_permissions(["user:create"]))])
def create_user():
    return {"message": "You can create users"}

# Delete a user
@router.delete("/{user_id}", dependencies=[Depends(require_permissions(["user:delete"]))])
def delete_user(user_id: int):
    return {"message": f"You can delete user {user_id}"}