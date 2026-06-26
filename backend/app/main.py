from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.middleware import RateLimitMiddleware, VisitorLogMiddleware
from app.config import settings
from app.seed import sync_seed_database

app = FastAPI(
    title="Terrabyte Academy API",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url=None,
)

try:
    sync_seed_database()
except Exception:
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(VisitorLogMiddleware)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Terrabyte Academy"}
