import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User, Role
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshTokenResponse, TokenResponse, UserResponse
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, revoke_token, decode_token


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, payload: RegisterRequest) -> TokenResponse:
        existing = await self.db.execute(select(User).where(User.email == payload.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        role = await self.db.execute(select(Role).where(Role.name == "student"))
        student_role = role.scalar_one_or_none()
        if not student_role:
            raise HTTPException(status_code=500, detail="Student role not found. Run DB seed.")
        user = User(
            email=payload.email,
            password_hash=hash_password(payload.password),
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,
            role_id=student_role.id,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        await self.db.refresh(user, ["role"])
        return self._build_tokens(user)

    async def login(self, payload: LoginRequest) -> TokenResponse:
        result = await self.db.execute(select(User).where(User.email == payload.email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
        await self.db.refresh(user, ["role"])
        return self._build_tokens(user)

    def _build_tokens(self, user: User) -> TokenResponse:
        access_token_id = str(uuid.uuid4())
        refresh_token_id = str(uuid.uuid4())
        return TokenResponse(
            access_token=create_access_token(str(user.id), user.role.name, token_id=access_token_id),
            refresh_token=create_refresh_token(str(user.id), token_id=refresh_token_id),
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                avatar_url=user.avatar_url,
                role={"name": user.role.name},
                is_active=user.is_active,
                is_verified=user.is_verified,
                created_at=user.created_at,
            ),
        )

    async def refresh(self, refresh_token: str) -> RefreshTokenResponse:
        from app.core.security import decode_token
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise ValueError("Not a refresh token")
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))
        result = await self.db.execute(select(User).where(User.id == payload["sub"]))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        await self.db.refresh(user, ["role"])
        revoke_token(refresh_token)
        refresh_token_id = str(uuid.uuid4())
        return RefreshTokenResponse(
            access_token=create_access_token(str(user.id), user.role.name),
            refresh_token=create_refresh_token(str(user.id), token_id=refresh_token_id),
            token_type="bearer",
        )

    async def logout(self, token: str) -> dict:
        try:
            decode_token(token)
        except ValueError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc
        revoke_token(token)
        return {"message": "Logged out successfully"}
