from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User, Role
from app.schemas.auth import UserUpdateRequest

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

@router.patch("/me")
async def update_me(payload: UserUpdateRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.first_name is not None:
        current_user.first_name = payload.first_name
    if payload.last_name is not None:
        current_user.last_name = payload.last_name
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user, ["role"])
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
    result = await db.execute(select(User).options(joinedload(User.role)))
    users = result.scalars().all()
    return {
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "role": {"name": u.role.name} if u.role else None,
            }
            for u in users
        ]
    }


@router.patch("/{user_id}")
async def update_user(user_id: str, payload: UserUpdateRequest, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.role_name is not None:
        role_result = await db.execute(select(Role).where(Role.name == payload.role_name))
        role = role_result.scalar_one_or_none()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        user.role_id = role.id

    db.add(user)
    await db.commit()
    await db.refresh(user, ["role"])
    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "role": {"name": user.role.name},
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "created_at": user.created_at,
    }
