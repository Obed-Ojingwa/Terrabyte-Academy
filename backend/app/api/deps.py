from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.core.security import decode_token

security = HTTPBearer()


def _permission_error() -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import User
    try:
        payload = decode_token(credentials.credentials)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    await db.refresh(user, ["role"])
    return user


def require_role(*roles: str):
    async def checker(current_user=Depends(get_current_user)):
        if current_user.role.name not in roles:
            raise _permission_error()
        return current_user
    return checker


def require_permission(permission: str):
    async def checker(current_user=Depends(get_current_user)):
        if not current_user.has_permission(permission):
            raise _permission_error()
        return current_user
    return checker


require_super_admin = require_role("super_admin")
require_admin = require_role("super_admin", "admin")
require_tutor = require_role("super_admin", "admin", "tutor")
require_manage_content = require_permission("manage_content")
require_manage_payments = require_permission("manage_payments")
require_manage_courses = require_permission("manage_courses")
