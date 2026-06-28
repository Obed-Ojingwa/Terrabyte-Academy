from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import bcrypt
from app.config import settings

_REVOKED_TOKENS: set[str] = set()
_REVOKED_TOKEN_IDS: set[str] = set()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _get_token_id(token: str) -> str | None:
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
        return claims.get("jti")
    except jwt.InvalidTokenError:
        return None


def create_access_token(user_id: str, role: str, *, token_id: str | None = None) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MIN),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    if token_id:
        payload["jti"] = token_id
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str, *, token_id: str | None = None) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh",
    }
    if token_id:
        payload["jti"] = token_id
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def revoke_token(token: str) -> None:
    token_id = _get_token_id(token)
    if token_id:
        _REVOKED_TOKEN_IDS.add(token_id)
    _REVOKED_TOKENS.add(token)


def is_token_revoked(token: str) -> bool:
    if token in _REVOKED_TOKENS:
        return True
    token_id = _get_token_id(token)
    return bool(token_id and token_id in _REVOKED_TOKEN_IDS)


def decode_token(token: str) -> dict:
    if is_token_revoked(token):
        raise ValueError("Token revoked")
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")
    if is_token_revoked(token):
        raise ValueError("Token revoked")
    return payload
