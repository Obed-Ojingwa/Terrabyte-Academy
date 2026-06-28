from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.enrollment import Enrollment, LessonProgress
from app.models.course import Course, Module
from app.models.payment import Payment
from app.schemas.lms import EnrollmentCreate, EnrollmentResponse, EnrollmentUpdate, LessonProgressResponse

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


async def _attach_course_context(enrollment: Enrollment, current_user, db: AsyncSession) -> Enrollment:
    if not getattr(enrollment, "course", None):
        await db.refresh(enrollment, attribute_names=["course"])

    if getattr(enrollment, "course", None) is None:
        return enrollment

    course_result = await db.execute(
        select(Course)
        .options(joinedload(Course.tutor), joinedload(Course.modules).joinedload(Module.lessons))
        .where(Course.id == enrollment.course_id)
    )
    course = course_result.scalar_one_or_none()
    if course is None:
        return enrollment

    lesson_ids = [lesson.id for module in course.modules for lesson in module.lessons]
    if lesson_ids:
        progress_rows = (
            await db.execute(
                select(LessonProgress).where(
                    LessonProgress.student_id == current_user.id,
                    LessonProgress.lesson_id.in_(lesson_ids),
                )
            )
        ).scalars().all()
        progress_lookup = {row.lesson_id: row for row in progress_rows}
        for module in course.modules:
            for lesson in module.lessons:
                progress = progress_lookup.get(lesson.id)
                setattr(lesson, "is_completed", bool(progress and progress.is_completed))

    enrollment.course = course
    return enrollment


@router.get("/", response_model=list[EnrollmentResponse])
async def list_enrollments(
    course_id: str | None = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Enrollment)
        .options(joinedload(Enrollment.student), joinedload(Enrollment.course).joinedload(Course.modules).joinedload(Module.lessons))
    )
    if current_user.role.name not in {"super_admin", "admin"}:
        query = query.where(Enrollment.student_id == current_user.id)
    if course_id:
        query = query.where(Enrollment.course_id == course_id)

    result = await db.execute(query.order_by(Enrollment.enrolled_at.desc()))
    enrollments = result.scalars().all()
    for enrollment in enrollments:
        await _attach_course_context(enrollment, current_user, db)
    return enrollments


@router.get("/{enrollment_id}", response_model=EnrollmentResponse)
async def get_enrollment(enrollment_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Enrollment)
        .options(joinedload(Enrollment.student), joinedload(Enrollment.course).joinedload(Course.modules).joinedload(Module.lessons))
        .where(Enrollment.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if current_user.role.name not in {"super_admin", "admin"} and enrollment.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return await _attach_course_context(enrollment, current_user, db)


@router.post("/", response_model=EnrollmentResponse, status_code=201)
async def create_enrollment(payload: EnrollmentCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    course_result = await db.execute(select(Course).where(Course.id == payload.course_id))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing_enrollment = (
        await db.execute(
            select(Enrollment).where(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course.id,
                Enrollment.status.in_(["active", "pending", "completed"]),
            )
        )
    ).scalar_one_or_none()
    if existing_enrollment:
        raise HTTPException(status_code=409, detail="You are already enrolled in this course")

    if float(course.price or 0) > 0:
        payment_result = await db.execute(
            select(Payment).where(
                Payment.student_id == current_user.id,
                Payment.course_id == course.id,
                Payment.status.in_(["pending", "success"]),
            )
        )
        if payment_result.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="A payment for this course is already in progress or completed")

    enrollment = Enrollment(
        student_id=current_user.id,
        course_id=course.id,
        mode=payload.mode,
        status="active" if float(course.price or 0) == 0 else "pending",
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return await _attach_course_context(enrollment, current_user, db)


@router.put("/{enrollment_id}", response_model=EnrollmentResponse)
async def update_enrollment(enrollment_id: str, payload: EnrollmentUpdate, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(enrollment, field, value)

    await db.commit()
    await db.refresh(enrollment)
    return await _attach_course_context(enrollment, current_user, db)


@router.post("/{enrollment_id}/lessons/{lesson_id}/progress", response_model=LessonProgressResponse)
async def upsert_lesson_progress(
    enrollment_id: str,
    lesson_id: str,
    payload: LessonProgressResponse,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    enrollment = (await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))).scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if enrollment.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    progress = (
        await db.execute(select(LessonProgress).where(LessonProgress.student_id == current_user.id, LessonProgress.lesson_id == lesson_id))
    ).scalar_one_or_none()
    if not progress:
        progress = LessonProgress(student_id=current_user.id, lesson_id=lesson_id)
        db.add(progress)
    progress.is_completed = payload.is_completed
    progress.watch_time_sec = payload.watch_time_sec
    await db.commit()
    await db.refresh(progress)
    return LessonProgressResponse(lesson_id=progress.lesson_id, is_completed=progress.is_completed, watch_time_sec=progress.watch_time_sec)


@router.delete("/{enrollment_id}", status_code=204)
async def delete_enrollment(enrollment_id: str, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    await db.delete(enrollment)
    await db.commit()
