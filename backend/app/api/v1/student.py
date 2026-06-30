from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.api.deps import get_current_user
from app.models.enrollment import Enrollment, LessonProgress
from app.models.course import Course, Module
from app.models.event import Event
from app.models.assignment import Assignment
from app.models.exam import ExamResult
from app.models.feedback import Feedback
from app.schemas.lms import StudentDashboardResponse, FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/student", tags=["Student"])


@router.get("/dashboard", response_model=StudentDashboardResponse)
async def get_student_dashboard(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # enrollments with course context and progress
    enroll_q = (
        select(Enrollment)
        .options(joinedload(Enrollment.course).joinedload(Course.modules).joinedload(Module.lessons))
        .where(Enrollment.student_id == current_user.id)
    )
    enroll_res = await db.execute(enroll_q)
    enrollments = enroll_res.scalars().all()

    # attach progress to enrollments
    for enrollment in enrollments:
        course = enrollment.course
        lesson_ids = [lesson.id for module in course.modules for lesson in module.lessons] if course and getattr(course, "modules", None) else []
        progress_rows = []
        if lesson_ids:
            progress_rows = (
                await db.execute(select(LessonProgress).where(LessonProgress.student_id == current_user.id, LessonProgress.lesson_id.in_(lesson_ids)))
            ).scalars().all()
        completed_count = sum(1 for r in progress_rows if r.is_completed)
        total_lessons = len(lesson_ids)
        enrollment.progress = int((completed_count / total_lessons) * 100) if total_lessons else 0

    # upcoming events for student's courses (next 30 days)
    now = datetime.utcnow()
    course_ids = [e.course_id for e in enrollments if e.course_id]
    event_q = select(Event).where(Event.start_date >= now).order_by(Event.start_date.asc())
    if course_ids:
        event_q = event_q.where((Event.course_id.in_(course_ids)) | (Event.course_id == None))
    event_res = await db.execute(event_q.limit(20))
    upcoming_events = event_res.scalars().all()

    # assignments due for enrolled courses
    assign_q = select(Assignment).where(Assignment.course_id.in_(course_ids)).order_by(Assignment.due_date.asc()) if course_ids else select(Assignment).where(False)
    assign_res = await db.execute(assign_q.limit(20))
    assignments_due = assign_res.scalars().all()

    # recent exam results for student
    exam_res_q = select(ExamResult).where(ExamResult.student_id == current_user.id).order_by(ExamResult.taken_at.desc()).limit(10)
    exam_res = await db.execute(exam_res_q)
    recent_exam_results = exam_res.scalars().all()

    return StudentDashboardResponse(
        enrollments=enrollments,
        upcoming_events=upcoming_events,
        assignments_due=assignments_due,
        recent_exam_results=recent_exam_results,
    )


@router.post("/feedback", response_model=FeedbackResponse, status_code=201)
async def submit_feedback(payload: FeedbackCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    fb = Feedback(
        student_id=current_user.id,
        course_id=payload.course_id,
        tutor_id=payload.tutor_id,
        rating=payload.rating,
        comments=payload.comments,
    )
    db.add(fb)
    await db.commit()
    await db.refresh(fb)
    return fb


@router.get("/feedback", response_model=List[FeedbackResponse])
async def list_my_feedback(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = select(Feedback).where(Feedback.student_id == current_user.id).order_by(Feedback.created_at.desc())
    res = await db.execute(q)
    return res.scalars().all()
