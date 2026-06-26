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

database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql+psycopg2://"):
    database_url = database_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)

parsed = urlsplit(database_url)
query_params = dict(parse_qsl(parsed.query, keep_blank_values=True))
if "sslmode" in query_params:
    query_params["ssl"] = query_params.pop("sslmode")
if "ssl" not in query_params and parsed.hostname and parsed.hostname.endswith("supabase.co"):
    query_params["ssl"] = "require"

normalized_url = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query_params), parsed.fragment))

engine = create_async_engine(
    normalized_url,
    **engine_kwargs,
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
