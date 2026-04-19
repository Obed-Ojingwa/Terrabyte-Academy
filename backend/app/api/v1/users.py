from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "avatar_url": current_user.avatar_url,
        "role": {"name": current_user.role.name},
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at,
    }

@router.get("/")
async def list_users(current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return {"items": [{"id": str(u.id), "email": u.email, "first_name": u.first_name, "last_name": u.last_name, "is_active": u.is_active} for u in users]}
