from fastapi import APIRouter
from app.api.v1 import auth, users, courses, payments, certificates, notifications, analytics, blog, events

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(courses.router)
api_router.include_router(payments.router)
api_router.include_router(certificates.router)
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(blog.router)
api_router.include_router(events.router)
