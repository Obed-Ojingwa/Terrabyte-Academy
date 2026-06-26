from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.enrollment import Enrollment, LessonProgress
from app.models.course import Course
from app.schemas.lms import EnrollmentCreate, EnrollmentResponse, EnrollmentUpdate, LessonProgressResponse

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@router.get("/", response_model=list[EnrollmentResponse])
async def list_enrollments(
    course_id: str | None = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Enrollment)
    if current_user.role.name not in {"super_admin", "admin"}:
        query = query.where(Enrollment.student_id == current_user.id)
    if course_id:
        query = query.where(Enrollment.course_id == course_id)
    result = await db.execute(query.order_by(Enrollment.enrolled_at.desc()))
    return result.scalars().all()


@router.get("/{enrollment_id}", response_model=EnrollmentResponse)
async def get_enrollment(enrollment_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if current_user.role.name not in {"super_admin", "admin"} and enrollment.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return enrollment


@router.post("/", response_model=EnrollmentResponse, status_code=201)
async def create_enrollment(payload: EnrollmentCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    course_result = await db.execute(select(Course).where(Course.id == payload.course_id))
    if not course_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Course not found")

    enrollment = Enrollment(student_id=current_user.id, course_id=payload.course_id, mode=payload.mode, status="pending")
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment


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
    return enrollment


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
