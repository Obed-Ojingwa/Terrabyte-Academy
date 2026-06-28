from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.api.deps import get_current_user, require_admin, require_tutor
from app.models.exam import Exam, ExamResult
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.schemas.lms import ExamCreate, ExamResponse, ExamUpdate, ExamSubmissionCreate, ExamResultResponse
from datetime import datetime

router = APIRouter(prefix="/exams", tags=["Exams"])


@router.get("/", response_model=list[ExamResponse])
async def list_exams(
    course_id: str | None = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Exam).options(joinedload(Exam.questions))
    if course_id:
        query = query.where(Exam.course_id == course_id)
    role_name = current_user.role.name
    if role_name == "tutor":
        query = query.join(Course, Course.id == Exam.course_id).where(Course.tutor_id == current_user.id)
    elif role_name not in {"super_admin", "admin"}:
        enrolled_courses = (
            await db.execute(
                select(Enrollment.course_id).where(
                    Enrollment.student_id == current_user.id,
                    Enrollment.status.in_(["active", "pending", "completed"]),
                )
            )
        ).scalars().all()
        if enrolled_courses:
            query = query.where(Exam.course_id.in_(list(enrolled_courses)))
        else:
            return []
    result = await db.execute(query.order_by(Exam.created_at.desc()))
    return result.scalars().all()


@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Exam).options(joinedload(Exam.questions), joinedload(Exam.results)).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    role_name = current_user.role.name
    if role_name == "tutor":
        course_result = await db.execute(select(Course).where(Course.id == exam.course_id))
        course = course_result.scalar_one_or_none()
        if not course or course.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif role_name not in {"super_admin", "admin"}:
        enrollment_result = await db.execute(
            select(Enrollment).where(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == exam.course_id,
                Enrollment.status.in_(["active", "pending", "completed"]),
            )
        )
        if enrollment_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=403, detail="Not authorized")
    return exam


@router.post("/{exam_id}/results", response_model=ExamResultResponse, status_code=201)
async def submit_exam_result(
    exam_id: str,
    payload: ExamSubmissionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Exam).options(joinedload(Exam.questions)).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if current_user.role.name not in {"super_admin", "admin", "tutor"}:
        enrollment_result = await db.execute(
            select(Enrollment).where(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == exam.course_id,
                Enrollment.status.in_(["active", "pending", "completed"]),
            )
        )
        if enrollment_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=403, detail="Not authorized")

    existing = (
        await db.execute(
            select(ExamResult)
            .where(ExamResult.exam_id == exam_id, ExamResult.student_id == current_user.id)
        )
    ).scalar_one_or_none()

    total_points = sum(question.points for question in exam.questions) if exam.questions else 0
    score = 0.0
    normalized_answers = {qid: (ans or "").strip() for qid, ans in payload.answers.items()}
    for question in exam.questions:
        given = normalized_answers.get(str(question.id), "")
        correct = (question.correct or "").strip()
        if correct and given and given.lower() == correct.lower():
            score += float(question.points)

    passed = total_points > 0 and (score / total_points * 100) >= float(exam.pass_score)
    if existing is None:
        existing = ExamResult(
            exam_id=exam_id,
            student_id=current_user.id,
            score=score,
            answers=payload.answers,
            passed=passed,
            taken_at=datetime.utcnow(),
        )
        db.add(existing)
    else:
        existing.score = score
        existing.answers = payload.answers
        existing.passed = passed
        existing.taken_at = datetime.utcnow()

    await db.commit()
    await db.refresh(existing)
    return existing


@router.post("/", response_model=ExamResponse, status_code=201)
async def create_exam(payload: ExamCreate, current_user=Depends(require_tutor), db: AsyncSession = Depends(get_db)):
    course_result = await db.execute(select(Course).where(Course.id == payload.course_id))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    role_name = current_user.role.name
    if role_name not in {"super_admin", "admin"}:
        if role_name != "tutor" or course.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    exam = Exam(**payload.model_dump())
    db.add(exam)
    await db.commit()
    await db.refresh(exam)
    return exam


@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(exam_id: str, payload: ExamUpdate, current_user=Depends(require_tutor), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    role_name = current_user.role.name
    if role_name not in {"super_admin", "admin"}:
        course_result = await db.execute(select(Course).where(Course.id == exam.course_id))
        course = course_result.scalar_one_or_none()
        if role_name != "tutor" or not course or course.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exam, field, value)

    await db.commit()
    await db.refresh(exam)
    return exam


@router.delete("/{exam_id}", status_code=204)
async def delete_exam(exam_id: str, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    await db.delete(exam)
    await db.commit()
