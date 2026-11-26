from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.enrollment import Enrollment, LessonProgress
from app.models.course import Course, Module, Lesson
from app.schemas.lms import (
    CourseApplicationResponse,
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentReviewRequest,
    EnrollmentReviewResponse,
    EnrollmentUpdate,
    LessonProgressResponse,
)
from app.services.notification_service import NotificationService

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
    progress_rows = []
    if lesson_ids:
        progress_rows = (
            await db.execute(
                select(LessonProgress).where(
                    LessonProgress.student_id == enrollment.student_id,
                    LessonProgress.lesson_id.in_(lesson_ids),
                )
            )
        ).scalars().all()
        progress_lookup = {row.lesson_id: row for row in progress_rows}
        for module in course.modules:
            for lesson in module.lessons:
                progress = progress_lookup.get(lesson.id)
                setattr(lesson, "is_completed", bool(progress and progress.is_completed))

    progress_count = sum(1 for row in progress_rows if row.is_completed)
    total_lessons = len(lesson_ids)
    enrollment.progress = int((progress_count / total_lessons) * 100) if total_lessons else 0
    if current_user.role.name == "student" and enrollment.status not in {"active", "completed"}:
        for module in course.modules:
            for lesson in module.lessons:
                lesson.content = None
                lesson.materials = []
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
        .options(
            joinedload(Enrollment.student),
            joinedload(Enrollment.course).joinedload(Course.modules).joinedload(Module.lessons).joinedload(Lesson.materials),
        )
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
        .options(
            joinedload(Enrollment.student),
            joinedload(Enrollment.course).joinedload(Course.modules).joinedload(Module.lessons).joinedload(Lesson.materials),
        )
        .where(Enrollment.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if current_user.role.name not in {"super_admin", "admin"} and enrollment.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return await _attach_course_context(enrollment, current_user, db)


@router.get("/applications/pending", response_model=list[CourseApplicationResponse])
async def list_pending_applications(current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Enrollment)
        .options(joinedload(Enrollment.student), joinedload(Enrollment.course))
        .where(Enrollment.status == "application_pending")
        .order_by(Enrollment.enrolled_at.asc())
    )
    return result.scalars().all()


@router.post("/", response_model=EnrollmentResponse, status_code=201)
async def create_enrollment(payload: EnrollmentCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role.name != "student":
        raise HTTPException(status_code=403, detail="Only students can enroll in courses")

    course_result = await db.execute(select(Course).where(Course.id == payload.course_id))
    course = course_result.scalar_one_or_none()
    if not course or not course.is_published:
        raise HTTPException(status_code=404, detail="Course not found")

    existing_enrollment = (
        await db.execute(
            select(Enrollment).where(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course.id,
            )
        )
    ).scalar_one_or_none()
    if existing_enrollment and existing_enrollment.status != "rejected":
        raise HTTPException(
            status_code=409,
            detail="You already applied for this course"
            if existing_enrollment.status == "application_pending"
            else "You are already enrolled in or awaiting payment for this course",
        )

    if existing_enrollment:
        enrollment = existing_enrollment
        enrollment.mode = payload.mode
        enrollment.status = "application_pending"
        enrollment.review_message = None
        enrollment.enrolled_at = datetime.utcnow()
    else:
        enrollment = Enrollment(
            student_id=current_user.id,
            course_id=course.id,
            mode=payload.mode,
            status="application_pending",
        )
        db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    await NotificationService(db).notify_admins(
        "New course application",
        f"{current_user.first_name} {current_user.last_name} applied for {course.title}. Review the application to continue.",
        link="/dashboard/admin/applications",
        notification_type="enrollment_application",
    )
    return await _attach_course_context(enrollment, current_user, db)


@router.post("/{enrollment_id}/review", response_model=EnrollmentReviewResponse)
async def review_course_application(
    enrollment_id: str,
    payload: EnrollmentReviewRequest,
    current_user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if payload.decision not in {"approve", "reject"}:
        raise HTTPException(status_code=422, detail="Decision must be approve or reject")
    result = await db.execute(
        select(Enrollment)
        .options(joinedload(Enrollment.student), joinedload(Enrollment.course))
        .where(Enrollment.id == enrollment_id)
        .with_for_update()
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Course application not found")
    if enrollment.status != "application_pending":
        raise HTTPException(status_code=409, detail="Only applications awaiting review can be approved or rejected")

    approved = payload.decision == "approve"
    course_title = enrollment.course.title
    course_price = float(enrollment.course.price or 0)
    enrollment.review_message = None if approved else (payload.message or "").strip() or None
    enrollment.status = "active" if approved and course_price <= 0 else (
        "pending" if approved else "rejected"
    )
    await db.commit()
    await db.refresh(enrollment)
    if approved:
        body = (
            f"Your application for {course_title} was approved. You are enrolled."
            if enrollment.status == "active"
            else f"Your application for {course_title} was approved. Complete payment from your dashboard to unlock course materials."
        )
    else:
        body = (payload.message or "").strip() or f"Your application for {course_title} was not approved. Contact the admin team if you have questions."
    await NotificationService(db).create(
        user_id=str(enrollment.student_id),
        title="Course application approved" if approved else "Course application update",
        body=body,
        type="enrollment",
        link="/dashboard/student",
    )
    return EnrollmentReviewResponse(
        id=enrollment.id,
        status=enrollment.status,
        review_message=enrollment.review_message,
    )


@router.put("/{enrollment_id}", response_model=EnrollmentResponse)
async def update_enrollment(enrollment_id: str, payload: EnrollmentUpdate, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    changes = payload.model_dump(exclude_unset=True)
    if "status" in changes and changes["status"] != enrollment.status:
        if changes["status"] != "completed" or enrollment.status not in {"active", "completed"}:
            raise HTTPException(status_code=409, detail="Use the application review or payment approval workflow to change course access")
    for field, value in changes.items():
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
    if enrollment.status not in {"active", "completed"}:
        raise HTTPException(status_code=403, detail="Course access is locked until payment is approved")

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
