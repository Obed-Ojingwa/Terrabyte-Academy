from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.api.deps import require_admin
from app.database import get_db
from app.models.course import Course, Lesson, Module
from app.models.user import Role, User
from app.models.enrollment import Enrollment, LessonProgress
from app.schemas.admin import (
    AssignTutorPayload,
    TutorSummary,
    CourseMaterialResponse,
    CourseTutorAssignmentResponse,
    LessonMaterialSummary,
    StudentProgressResponse,
    StudentCourseProgress,
    CourseStudentProgress,
)
from app.services.storage_service import StorageService

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.put("/courses/{course_id}/tutor", response_model=CourseTutorAssignmentResponse)
async def assign_tutor_to_course(course_id: str, payload: AssignTutorPayload, db: AsyncSession = Depends(get_db), current_user=Depends(require_admin)):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    tutor = None
    if payload.tutor_id is not None:
        tutor_result = await db.execute(
            select(User)
            .join(Role)
            .where(User.id == payload.tutor_id, Role.name == "tutor")
        )
        tutor = tutor_result.scalar_one_or_none()
        if not tutor:
            raise HTTPException(status_code=404, detail="Tutor not found")
        course.tutor_id = payload.tutor_id
    else:
        course.tutor_id = None

    await db.commit()
    await db.refresh(course)

    return CourseTutorAssignmentResponse(
        course_id=course.id,
        tutor=TutorSummary.model_validate(tutor) if tutor else None,
    )


@router.get("/courses/{course_id}/materials", response_model=List[CourseMaterialResponse])
async def list_course_materials(course_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(require_admin)):
    result = await db.execute(select(Lesson).options(joinedload(Lesson.materials)).where(Lesson.module.has(course_id=course_id)))
    lessons = result.scalars().all()
    storage = StorageService()
    return [
        CourseMaterialResponse(
            lesson_id=lesson.id,
            lesson_title=lesson.title,
            materials=[
                LessonMaterialSummary(
                    id=material.id,
                    title=material.title,
                    type=material.type,
                    s3_key=material.s3_key,
                    url=storage.get_public_url(material.s3_key),
                    is_downloadable=material.is_downloadable,
                    size_bytes=material.size_bytes,
                    created_at=material.created_at,
                )
                for material in lesson.materials
            ],
        )
        for lesson in lessons
    ]


@router.get("/students/{student_id}/progress", response_model=StudentProgressResponse)
async def get_student_progress(student_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(require_admin)):
    student_result = await db.execute(select(User).where(User.id == student_id))
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    enrollments_result = await db.execute(
        select(Enrollment)
        .options(joinedload(Enrollment.course).joinedload(Course.modules).joinedload(Module.lessons))
        .where(Enrollment.student_id == student.id)
    )
    enrollments = enrollments_result.scalars().all()

    progress_items = []
    for enrollment in enrollments:
        lessons = [lesson for module in enrollment.course.modules for lesson in module.lessons]
        lesson_ids = [lesson.id for lesson in lessons]
        completed_count = 0
        if lesson_ids:
            completed_count = (
                await db.execute(
                    select(func.count())
                    .select_from(LessonProgress)
                    .where(LessonProgress.student_id == student.id, LessonProgress.lesson_id.in_(lesson_ids), LessonProgress.is_completed == True)
                )
            ).scalar_one() or 0
        total_lessons = len(lesson_ids)
        progress_percent = int((completed_count / total_lessons) * 100) if total_lessons else 0

        progress_items.append(
            StudentCourseProgress(
                course_id=enrollment.course.id,
                course_title=enrollment.course.title,
                enrollment_status=enrollment.status,
                progress_percent=progress_percent,
                lessons_completed=completed_count,
                total_lessons=total_lessons,
                enrolled_at=enrollment.enrolled_at,
                completed_at=enrollment.completed_at,
            )
        )

    return StudentProgressResponse(
        student_id=student.id,
        student_name=f"{student.first_name} {student.last_name}",
        progress=progress_items,
    )


@router.get("/courses/{course_id}/students/progress", response_model=List[CourseStudentProgress])
async def get_course_student_progress(course_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(require_admin)):
    result = await db.execute(
        select(Course).options(joinedload(Course.modules).joinedload(Module.lessons)).where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrollments_result = await db.execute(
        select(Enrollment)
        .options(joinedload(Enrollment.student))
        .where(Enrollment.course_id == course.id)
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
