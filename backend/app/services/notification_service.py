from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.notification import Notification
from app.models.user import Role, User


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: str, title: str, body: str, type: str, link: str = None):
        notif = Notification(user_id=user_id, title=title, body=body, type=type, link=link)
        self.db.add(notif)
        await self.db.commit()
        return notif

    async def notify_enrollment(self, user_id: str, course_title: str):
        return await self.create(
            user_id=user_id,
            title="Enrollment confirmed",
            body=f"Your enrollment for {course_title} is now active.",
            type="enrollment",
            link="/dashboard/student/learning",
        )

    async def notify_certificate_issued(self, user_id: str, course_id: str):
        return await self.create(
            user_id=user_id,
            title="Certificate ready",
            body="Your certificate has been issued and is now available.",
            type="certificate",
            link="/dashboard/student/certificates",
        )

    async def notify_admins(self, title: str, body: str, link: str = "/dashboard/admin/payments"):
        admin_ids = (
            await self.db.execute(
                select(User.id)
                .join(Role, User.role_id == Role.id)
                .where(Role.name.in_(("admin", "super_admin")))
            )
        ).scalars().all()
        notifications = [
            Notification(
                user_id=admin_id,
                title=title,
                body=body,
                type="payment",
                link=link,
            )
            for admin_id in admin_ids
        ]
        if notifications:
            self.db.add_all(notifications)
            await self.db.commit()
        return notifications
