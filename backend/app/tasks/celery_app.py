from celery import Celery
from app.config import settings

celery_app = Celery(
    "terrabyte",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.email_tasks", "app.tasks.certificate_tasks"],
)
celery_app.conf.update(task_serializer="json", result_serializer="json", accept_content=["json"], timezone="Africa/Lagos", enable_utc=True)
