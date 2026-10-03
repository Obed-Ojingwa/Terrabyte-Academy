from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from app.database import get_db
from app.api.deps import get_current_user, require_admin, require_tutor
from app.models.exam import Exam, ExamQuestion, ExamResult
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.schemas.lms import (
    ExamCreate,
    ExamManagementResponse,
    ExamQuestionCreate,
    ExamQuestionDefinition,
    ExamQuestionReorder,
    ExamQuestionResponse,
    ExamQuestionUpdate,
    ExamResponse,
    ExamResultResponse,
    ExamSubmissionCreate,
    ExamUpdate,
)
from datetime import datetime
from uuid import UUID

router = APIRouter(prefix="/exams", tags=["Exams"])
ELIGIBLE_ENROLLMENT_STATUSES = ("active", "completed")


async def _get_exam_for_management(exam_id: str, current_user, db: AsyncSession, *, lock: bool = False):
    query = select(Exam).where(Exam.id == exam_id)
    if lock:
        query = query.with_for_update()
    exam_result = await db.execute(query)
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if current_user.role.name not in {"super_admin", "admin"}:
        course_result = await db.execute(select(Course).where(Course.id == exam.course_id))
        course = course_result.scalar_one_or_none()
        if not course or course.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    return exam


async def _get_exam_questions_for_update(exam_id, db: AsyncSession):
    result = await db.execute(
        select(ExamQuestion)
        .where(ExamQuestion.exam_id == exam_id)
        .order_by(ExamQuestion.position, ExamQuestion.id)
        .with_for_update()
    )
    return result.scalars().all()


async def _commit_exam_change(db: AsyncSession):
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise


def _validated_question_update(question: ExamQuestion, payload: ExamQuestionUpdate):
    values = {
        "question": question.question,
        "type": question.type,
        "options": question.options,
        "correct": question.correct,
        "points": question.points,
    }
    values.update(payload.model_dump(exclude_unset=True))
    try:
        return ExamQuestionDefinition.model_validate(values)
    except ValidationError as error:
        raise HTTPException(status_code=422, detail=error.errors(include_context=False)) from error


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
                    Enrollment.status.in_(ELIGIBLE_ENROLLMENT_STATUSES),
                )
            )
        ).scalars().all()
        if enrolled_courses:
            query = query.where(Exam.course_id.in_(list(enrolled_courses)))
        else:
            return []
    result = await db.execute(query.order_by(Exam.created_at.desc()))
    return result.unique().scalars().all()


@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Exam).options(joinedload(Exam.questions)).where(Exam.id == exam_id))
    exam = result.unique().scalar_one_or_none()
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
                Enrollment.status.in_(ELIGIBLE_ENROLLMENT_STATUSES),
            )
        )
        if enrollment_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=403, detail="Not authorized")
    return exam


@router.get("/{exam_id}/management", response_model=ExamManagementResponse)
async def get_exam_management(
    exam_id: str,
    current_user=Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Exam)
        .options(selectinload(Exam.questions), selectinload(Exam.results))
        .where(Exam.id == exam_id)
    )
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    role_name = current_user.role.name
    if role_name not in {"super_admin", "admin"}:
        course_result = await db.execute(select(Course).where(Course.id == exam.course_id))
        course = course_result.scalar_one_or_none()
        if not course or course.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    return exam


@router.get("/{exam_id}/results", response_model=list[ExamResultResponse])
async def list_exam_results(
    exam_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    role_name = current_user.role.name
    results_query = select(ExamResult).where(ExamResult.exam_id == exam_id)
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
                Enrollment.status.in_(ELIGIBLE_ENROLLMENT_STATUSES),
            )
        )
        if enrollment_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=403, detail="Not authorized")
        results_query = results_query.where(ExamResult.student_id == current_user.id)

    results = await db.execute(results_query.order_by(ExamResult.taken_at.desc()))
    return results.scalars().all()


@router.post("/{exam_id}/results", response_model=ExamResultResponse, status_code=201)
async def submit_exam_result(
    exam_id: str,
    payload: ExamSubmissionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Exam).options(joinedload(Exam.questions)).where(Exam.id == exam_id))
    exam = result.unique().scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if current_user.role.name not in {"super_admin", "admin", "tutor"}:
        enrollment_result = await db.execute(
            select(Enrollment).where(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == exam.course_id,
                Enrollment.status.in_(ELIGIBLE_ENROLLMENT_STATUSES),
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
    response = await db.execute(
        select(Exam).options(selectinload(Exam.questions)).where(Exam.id == exam.id)
    )
    return response.scalar_one()


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
    response = await db.execute(
        select(Exam).options(selectinload(Exam.questions)).where(Exam.id == exam.id)
    )
    return response.scalar_one()


@router.post("/{exam_id}/questions", response_model=ExamQuestionResponse, status_code=201)
async def create_exam_question(
    exam_id: str,
    payload: ExamQuestionCreate,
    current_user=Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    exam = await _get_exam_for_management(exam_id, current_user, db, lock=True)
    questions = await _get_exam_questions_for_update(exam.id, db)
    for current_position, existing_question in enumerate(questions):
        existing_question.position = current_position
    position = len(questions) if payload.position is None else payload.position
    if position > len(questions):
        raise HTTPException(status_code=422, detail="Question position must be within the existing question order")

    for existing_question in questions:
        if existing_question.position >= position:
            existing_question.position += 1

    question = ExamQuestion(
        exam_id=exam.id,
        question=payload.question,
        type=payload.type,
        options=payload.options,
        correct=payload.correct,
        points=payload.points,
        position=position,
    )
    db.add(question)
    await _commit_exam_change(db)
    await db.refresh(question)
    return question


@router.put("/{exam_id}/questions/reorder", response_model=list[ExamQuestionResponse])
async def reorder_exam_questions(
    exam_id: str,
    payload: ExamQuestionReorder,
    current_user=Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    exam = await _get_exam_for_management(exam_id, current_user, db, lock=True)
    questions = await _get_exam_questions_for_update(exam.id, db)
    requested_ids = payload.question_ids
    if len(requested_ids) != len(set(requested_ids)) or set(requested_ids) != {question.id for question in questions}:
        raise HTTPException(status_code=422, detail="question_ids must contain every exam question exactly once")

    questions_by_id = {question.id: question for question in questions}
    ordered_questions = [questions_by_id[question_id] for question_id in requested_ids]
    for position, question in enumerate(ordered_questions):
        question.position = position

    await _commit_exam_change(db)
    return ordered_questions


@router.put("/{exam_id}/questions/{question_id}", response_model=ExamQuestionResponse)
async def update_exam_question(
    exam_id: str,
    question_id: UUID,
    payload: ExamQuestionUpdate,
    current_user=Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    exam = await _get_exam_for_management(exam_id, current_user, db, lock=True)
    result = await db.execute(
        select(ExamQuestion)
        .where(ExamQuestion.id == question_id, ExamQuestion.exam_id == exam.id)
        .with_for_update()
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    validated = _validated_question_update(question, payload)
    question.question = validated.question
    question.type = validated.type
    question.options = validated.options
    question.correct = validated.correct
    question.points = validated.points
    await _commit_exam_change(db)
    await db.refresh(question)
    return question


@router.delete("/{exam_id}/questions/{question_id}", status_code=204)
async def delete_exam_question(
    exam_id: str,
    question_id: UUID,
    current_user=Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    exam = await _get_exam_for_management(exam_id, current_user, db, lock=True)
    questions = await _get_exam_questions_for_update(exam.id, db)
    question = next((item for item in questions if item.id == question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    await db.delete(question)
    remaining_questions = [item for item in questions if item.id != question.id]
    for position, remaining_question in enumerate(remaining_questions):
        remaining_question.position = position
    await _commit_exam_change(db)


@router.delete("/{exam_id}", status_code=204)
async def delete_exam(exam_id: str, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    await db.delete(exam)
    await db.commit()
