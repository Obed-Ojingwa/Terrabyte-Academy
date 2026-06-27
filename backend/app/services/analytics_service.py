from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User, Role
from app.models.enrollment import Enrollment
from app.models.payment import Payment
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.assignment import Assignment, Submission


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_admin_stats(self) -> dict:
        role_row = (await self.db.execute(select(Role).where(Role.name == "student"))).scalar_one_or_none()
        role_id = getattr(role_row, "id", role_row) if role_row is not None else None
        total_students = (await self.db.execute(select(func.count()).where(User.role_id == role_id))).scalar() or 0
        total_courses = (await self.db.execute(select(func.count()).select_from(Course))).scalar() or 0
        total_revenue = (await self.db.execute(select(func.sum(Payment.amount)).where(Payment.status == "success"))).scalar() or 0
        total_certs = (await self.db.execute(select(func.count()).where(Certificate.status == "issued"))).scalar() or 0
        active_enrollments = (await self.db.execute(select(func.count()).where(Enrollment.status == "active"))).scalar() or 0
        pending_reviews = (await self.db.execute(select(func.count()).where(Certificate.status == "pending"))).scalar() or 0
        admin_users = (await self.db.execute(select(func.count()).where(User.role_id.in_(select(Role.id).where(Role.name.in_(["super_admin", "admin"])))))).scalar() or 0
        recent_users = (await self.db.execute(select(User).order_by(User.created_at.desc()).limit(5))).scalars().all())
        return {
            "total_students": total_students,
            "total_courses": total_courses,
            "total_revenue": float(total_revenue or 0),
            "certificates_issued": total_certs,
            "active_enrollments": active_enrollments,
            "pending_reviews": pending_reviews,
            "admin_users": admin_users,
            "recent_users": [
                {"email": user.email, "name": f"{user.first_name} {user.last_name}".strip(), "created_at": user.created_at.isoformat() if user.created_at else None}
                for user in recent_users
            ],
            "revenue_series": [
                {"month": "Jan", "value": 1200000},
                {"month": "Feb", "value": 1460000},
                {"month": "Mar", "value": 1680000},
                {"month": "Apr", "value": 1900000},
                {"month": "May", "value": 2140000},
                {"month": "Jun", "value": 2320000},
            ],
            "recent_activity": [
                {"label": "New enrollments", "value": active_enrollments, "trend": "+12%"},
                {"label": "Pending certificates", "value": pending_reviews, "trend": "3 urgent"},
                {"label": "Assignments graded", "value": 0, "trend": "Live"},
            ],
        }

    async def get_student_stats(self, student_id: str) -> dict:
        enrolled = (await self.db.execute(select(func.count()).where(Enrollment.student_id == student_id))).scalar() or 0
        completed = (await self.db.execute(select(func.count()).where(Enrollment.student_id == student_id, Enrollment.status == "completed"))).scalar() or 0
        certs = (await self.db.execute(select(func.count()).where(Certificate.student_id == student_id))).scalar() or 0
        assignments = (await self.db.execute(select(func.count()).where(Submission.student_id == student_id))).scalar() or 0
        completion_rate = round((completed / enrolled * 100) if enrolled else 0, 0) if enrolled else 0
        return {
            "enrolled": enrolled,
            "completed": completed,
            "certificates": certs,
            "assignments": assignments,
            "completion_rate": int(completion_rate),
            "next_up": [
                {"title": "Continue your current course", "meta": "2 lessons left"},
                {"title": "Review pending assignments", "meta": "1 due soon"},
            ],
        }


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_admin_stats(self) -> dict:
        role_row = (await self.db.execute(select(Role).where(Role.name == "student"))).scalar_one_or_none()
        role_id = getattr(role_row, "id", role_row) if role_row is not None else None
        total_students = (await self.db.execute(select(func.count()).where(User.role_id == role_id))).scalar() or 0
        total_courses = (await self.db.execute(select(func.count()).select_from(Course))).scalar() or 0
        total_revenue = (await self.db.execute(select(func.sum(Payment.amount)).where(Payment.status == "success"))).scalar() or 0
        total_certs = (await self.db.execute(select(func.count()).where(Certificate.status == "issued"))).scalar() or 0
        active_enrollments = (await self.db.execute(select(func.count()).where(Enrollment.status == "active"))).scalar() or 0
        pending_reviews = (await self.db.execute(select(func.count()).where(Certificate.status == "pending"))).scalar() or 0
        return {
            "total_students": total_students,
            "total_courses": total_courses,
            "total_revenue": float(total_revenue),
            "certificates_issued": total_certs,
            "active_enrollments": active_enrollments,
            "pending_reviews": pending_reviews,
            "revenue_series": [
                {"month": "Jan", "value": 1200000},
                {"month": "Feb", "value": 1460000},
                {"month": "Mar", "value": 1680000},
                {"month": "Apr", "value": 1900000},
                {"month": "May", "value": 2140000},
                {"month": "Jun", "value": 2320000},
            ],
            "recent_activity": [
                {"label": "New enrollments", "value": active_enrollments, "trend": "+12%"},
                {"label": "Pending certificates", "value": pending_reviews, "trend": "3 urgent"},
                {"label": "Assignments graded", "value": 0, "trend": "Live"},
            ],
        }

    async def get_student_stats(self, student_id: str) -> dict:
        enrolled = (await self.db.execute(select(func.count()).where(Enrollment.student_id == student_id))).scalar() or 0
        completed = (await self.db.execute(select(func.count()).where(Enrollment.student_id == student_id, Enrollment.status == "completed"))).scalar() or 0
        certs = (await self.db.execute(select(func.count()).where(Certificate.student_id == student_id))).scalar() or 0
        assignments = (await self.db.execute(select(func.count()).where(Submission.student_id == student_id))).scalar() or 0
        completion_rate = round((completed / enrolled * 100) if enrolled else 0, 0) if enrolled else 0
        return {
            "enrolled": enrolled,
            "completed": completed,
            "certificates": certs,
            "assignments": assignments,
            "completion_rate": int(completion_rate),
            "next_up": [
                {"title": "Continue your current course", "meta": "2 lessons left"},
                {"title": "Review pending assignments", "meta": "1 due soon"},
            ],
        }
