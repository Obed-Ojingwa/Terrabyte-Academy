import time

import pytest

from app.core.cache import TTLCache
from app.core.security import create_refresh_token, decode_token, is_token_revoked, revoke_token


def test_revoked_refresh_tokens_are_rejected():
    token = create_refresh_token("user-123")

    assert is_token_revoked(token) is False

    revoke_token(token)

    assert is_token_revoked(token) is True

    with pytest.raises(ValueError):
        decode_token(token)


def test_ttl_cache_expires_entries_after_their_ttl():
    cache = TTLCache(ttl_seconds=0.05)
    cache.set("greeting", "hello")

    assert cache.get("greeting") == "hello"

    time.sleep(0.1)

    assert cache.get("greeting") is None
