import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("app.middleware")


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, calls_per_minute: int = 120):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self._store: dict = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - 60
        if client_ip not in self._store:
            self._store[client_ip] = []
        self._store[client_ip] = [t for t in self._store[client_ip] if t > window_start]
        if len(self._store[client_ip]) >= self.calls_per_minute:
            from starlette.responses import JSONResponse
            return JSONResponse({"detail": "Rate limit exceeded. Try again in a minute."}, status_code=429)
        self._store[client_ip].append(now)
        return await call_next(request)


class VisitorLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        response = await call_next(request)
        logger.info(
            "%s %s %s %s",
            client_ip,
            request.method,
            request.url.path,
            response.status_code,
        )
        return response
