from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.api.deps import require_tutor
from app.models.course import Course, Module
from app.models.enrollment import Enrollment, LessonProgress
from app.schemas.admin import CourseStudentProgress

router = APIRouter(prefix="/tutor", tags=["Tutor"])


@router.get("/courses/{course_id}/students/progress", response_model=List[CourseStudentProgress])
async def get_course_student_progress(course_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(require_tutor)):
    result = await db.execute(
        select(Course).options(joinedload(Course.modules).joinedload(Module.lessons)).where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # ensure current tutor is assigned to this course
    if current_user.role.name not in {"super_admin", "admin"}:
        if course.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    enrollments_result = await db.execute(
        select(Enrollment).options(joinedload(Enrollment.student)).where(Enrollment.course_id == course.id)
    )
    enrollments = enrollments_result.scalars().all()

    items = []
    for enrollment in enrollments:
        lessons_result = [lesson for module in course.modules for lesson in module.lessons] if course.modules else []
        lesson_ids = [lesson.id for lesson in lessons_result]
        completed_count = 0
        if lesson_ids:
            completed_count = (
                await db.execute(
                    select(func.count())
                    .select_from(LessonProgress)
                    .where(LessonProgress.student_id == enrollment.student_id, LessonProgress.lesson_id.in_(lesson_ids), LessonProgress.is_completed == True)
                )
            ).scalar_one() or 0
        total_lessons = len(lesson_ids)
        progress_percent = int((completed_count / total_lessons) * 100) if total_lessons else 0

        items.append(
            CourseStudentProgress(
                student_id=enrollment.student.id,
                student_name=f"{enrollment.student.first_name} {enrollment.student.last_name}",
                enrollment_status=enrollment.status,
                progress_percent=progress_percent,
                lessons_completed=completed_count,
                total_lessons=total_lessons,
                enrolled_at=enrollment.enrolled_at,
                completed_at=enrollment.completed_at,
            )
        )

    return items
