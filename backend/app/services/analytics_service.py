from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User, Role
from app.models.enrollment import Enrollment
from app.models.payment import Payment
from app.models.certificate import Certificate
from app.models.course import Course


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_admin_stats(self) -> dict:
        role_row = (await self.db.execute(select(Role).where(Role.name == "student"))).scalar_one_or_none()
        role_id = role_row.id if role_row else None
        total_students = (await self.db.execute(select(func.count()).where(User.role_id == role_id))).scalar() or 0
        total_courses = (await self.db.execute(select(func.count()).select_from(Course))).scalar() or 0
        total_revenue = (await self.db.execute(select(func.sum(Payment.amount)).where(Payment.status == "success"))).scalar() or 0
        total_certs = (await self.db.execute(select(func.count()).where(Certificate.status == "issued"))).scalar() or 0
        return {"total_students": total_students, "total_courses": total_courses, "total_revenue": float(total_revenue), "certificates_issued": total_certs}

    async def get_student_stats(self, student_id: str) -> dict:
        enrolled = (await self.db.execute(select(func.count()).where(Enrollment.student_id == student_id))).scalar() or 0
        completed = (await self.db.execute(select(func.count()).where(Enrollment.student_id == student_id, Enrollment.status == "completed"))).scalar() or 0
        certs = (await self.db.execute(select(func.count()).where(Certificate.student_id == student_id))).scalar() or 0
        return {"enrolled": enrolled, "completed": completed, "certificates": certs, "assignments": 0}
