from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: str, title: str, body: str, type: str, link: str = None):
        notif = Notification(user_id=user_id, title=title, body=body, type=type, link=link)
        self.db.add(notif)
        await self.db.commit()
        return notif
