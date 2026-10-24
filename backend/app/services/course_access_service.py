from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.enrollment import Enrollment


async def student_has_course_access(db: AsyncSession, student_id, course_id) -> bool:
    enrollment = (
        await db.execute(
            select(Enrollment.id).where(
                Enrollment.student_id == student_id,
                Enrollment.course_id == course_id,
                Enrollment.status.in_(("active", "completed")),
            )
        )
    ).scalar_one_or_none()
    return enrollment is not None


async def require_course_access(db: AsyncSession, user, course_id) -> None:
    if user.role.name in {"admin", "super_admin"}:
        return
    if user.role.name == "tutor":
        course = (
            await db.execute(
                select(Course.id).where(Course.id == course_id, Course.tutor_id == user.id)
            )
        ).scalar_one_or_none()
        if course is not None:
            return
        raise HTTPException(status_code=403, detail="Not authorized to access this course")
    if user.role.name != "student" or not await student_has_course_access(db, user.id, course_id):
        raise HTTPException(status_code=403, detail="Course access is locked until payment is approved")
