import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.api.v1.router import api_router
from app.core.middleware import RateLimitMiddleware, VisitorLogMiddleware
from app.config import settings
from app.seed import sync_seed_database

logging.basicConfig(level=settings.LOG_LEVEL)

app = FastAPI(
    title="Terrabyte Academy API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
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
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(VisitorLogMiddleware)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Terrabyte Academy"}
