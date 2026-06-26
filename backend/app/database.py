from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine_kwargs = {
    "echo": settings.DEBUG,
    "pool_pre_ping": True,
    "pool_size": 10,
    "max_overflow": 20,
}


def build_engine_options(database_url: str) -> dict[str, Any]:
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql+psycopg2://"):
        database_url = database_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)

    parsed = urlsplit(database_url)
    query_params = dict(parse_qsl(parsed.query, keep_blank_values=True))
    connect_args: dict[str, Any] = {"statement_cache_size": 0}

    if "sslmode" in query_params:
        query_params["ssl"] = query_params.pop("sslmode")

    if "ssl" in query_params:
        connect_args["ssl"] = query_params["ssl"]
    elif parsed.hostname and (
        parsed.hostname.endswith("supabase.co") or parsed.hostname.endswith("supabase.com") or ".pooler.supabase.com" in parsed.hostname
    ):
        connect_args["ssl"] = "require"

    normalized_url = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query_params), parsed.fragment))
    return {"database_url": normalized_url, "connect_args": connect_args}


engine_options = build_engine_options(settings.DATABASE_URL)
engine = create_async_engine(
    engine_options["database_url"],
    **engine_kwargs,
    connect_args=engine_options["connect_args"],
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
