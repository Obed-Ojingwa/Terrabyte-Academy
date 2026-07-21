from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.api.deps import get_current_user
from app.models.enrollment import Enrollment, LessonProgress
from app.models.course import Course, Module, Lesson
from app.models.event import Event
from app.models.assignment import Assignment, Submission
from app.models.exam import ExamResult
from app.models.feedback import Feedback
from app.models.user import User
from app.models.certificate import Certificate
from app.schemas.lms import (
    StudentDashboardResponse,
    FeedbackCreate,
    FeedbackResponse,
    StudentProfileResponse,
    SubmissionResponse,
    ExamResultResponse,
    CertificateResponse,
    EnrollmentResponse
)

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


@router.get("/profile", response_model=StudentProfileResponse)
async def get_student_profile(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get the complete profile for the currently logged-in student."""
    # Get the user with role information
    result = await db.execute(select(User).options(joinedload(User.role)).where(User.id == current_user.id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get enrolled courses with course, modules, and lessons loaded
    enrollments_result = await db.execute(
        select(Enrollment)
        .options(
            joinedload(Enrollment.course)
            .joinedload(Course.modules)
            .joinedload(Module.lessons)
        )
        .where(Enrollment.student_id == user.id)
    )
    enrollments = enrollments_result.scalars().all()

    # Get all completed lesson IDs for the student across all courses
    completed_lessons_result = await db.execute(
        select(LessonProgress.lesson_id)
        .where(
            LessonProgress.student_id == user.id,
            LessonProgress.is_completed == True
        )
    )
    completed_lesson_ids = {row[0] for row in completed_lessons_result.fetchall()}

    # Process each enrollment
    enrollments_with_progress = []
    total_courses_enrolled = len(enrollments)
    total_courses_completed = 0
    total_progress = 0

    for enrollment in enrollments:
        if enrollment.course:
            # Collect all lesson IDs for this course
            lesson_ids = []
            for module in enrollment.course.modules:
                for lesson in module.lessons:
                    lesson_ids.append(lesson.id)

            total_lessons = len(lesson_ids)
            completed_count = sum(1 for lid in lesson_ids if lid in completed_lesson_ids)
            progress = int((completed_count / total_lessons) * 100) if total_lessons > 0 else 0

            # Attach progress to enrollment (for response)
            enrollment.progress = progress
            total_progress += progress

            # Check if course is completed (status or progress)
            if enrollment.status == "completed" or progress >= 100:
                total_courses_completed += 1

        enrollments_with_progress.append(enrollment)

    overall_progress = int(total_progress / total_courses_enrolled) if total_courses_enrolled > 0 else 0

    # Get assignment submissions
    submissions_result = await db.execute(
        select(Submission)
        .options(joinedload(Submission.assignment))
        .where(Submission.student_id == user.id)
        .order_by(Submission.submitted_at.desc())
    )
    submissions = submissions_result.scalars().all()

    total_assignments_submitted = len(submissions)
    total_assignments_graded = sum(1 for s in submissions if s.score is not None)
    assignment_scores = [s.score for s in submissions if s.score is not None]
    average_assignment_score = sum(assignment_scores) / len(assignment_scores) if assignment_scores else None

    # Get exam results
    exam_results_result = await db.execute(
        select(ExamResult)
        .options(joinedload(ExamResult.exam))
        .where(ExamResult.student_id == user.id)
        .order_by(ExamResult.taken_at.desc())
    )
    exam_results = exam_results_result.scalars().all()

    total_exams_taken = len(exam_results)
    total_exams_passed = sum(1 for er in exam_results if er.passed)
    exam_scores = [er.score for er in exam_results if er.score is not None]
    average_exam_score = sum(exam_scores) / len(exam_scores) if exam_scores else None

    # Get certificates
    certificates_result = await db.execute(
        select(Certificate)
        .options(joinedload(Certificate.course))
        .where(Certificate.student_id == user.id)
        .order_by(Certificate.issued_at.desc())
    )
    certificates = certificates_result.scalars().all()
    total_certificates_earned = len([c for c in certificates if c.status == "issued"])

    # Build and return the profile response
    return StudentProfileResponse(
        # Personal Information
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone=user.phone,
        avatar_url=user.avatar_url,
        is_verified=user.is_verified,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,

        # Enrolled Courses
        enrolled_courses=enrollments_with_progress,

        # Learning Progress (aggregated)
        total_courses_enrolled=total_courses_enrolled,
        total_courses_completed=total_courses_completed,
        overall_progress_percentage=overall_progress,

        # Assignment History
        assignment_submissions=submissions,
        total_assignments_submitted=total_assignments_submitted,
        total_assignments_graded=total_assignments_graded,
        average_assignment_score=average_assignment_score,

        # Exam Results
        exam_results=exam_results,
        total_exams_taken=total_exams_taken,
        total_exams_passed=total_exams_passed,
        average_exam_score=average_exam_score,

        # Certificates Obtained
        certificates=certificates,
        total_certificates_earned=total_certificates_earned,
    )