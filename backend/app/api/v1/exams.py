import json
from datetime import datetime, timedelta, timezone
from math import isfinite
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload, selectinload
from app.database import get_db
from app.api.deps import get_current_user, require_admin, require_tutor
from app.models.exam import Exam, ExamQuestion, ExamResult
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.schemas.lms import (
    ExamAttemptStartResponse,
    ExamCreate,
    ExamManagementResponse,
    ExamManualGradeSubmission,
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


async def _ensure_exam_has_no_attempts(exam_id, db: AsyncSession):
    result = await db.execute(
        select(ExamResult.id).where(ExamResult.exam_id == exam_id).limit(1)
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Questions cannot be changed after an attempt has started")


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


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _attempt_response(attempt: ExamResult) -> ExamAttemptStartResponse:
    return ExamAttemptStartResponse(
        attempt_id=attempt.id,
        attempt_number=attempt.attempt_number,
        started_at=attempt.started_at,
        expires_at=attempt.expires_at,
        status="in_progress",
    )


def _grade_question(question: ExamQuestion, answer: str) -> tuple[float, str]:
    value = answer.strip()
    if question.type == "single_choice":
        valid_answers = {choice["id"] for choice in (question.options or {}).get("choices", [])}
        if value and value not in valid_answers:
            raise HTTPException(status_code=422, detail=f"Invalid choice for question {question.id}")
        is_correct = value.casefold() == (question.correct or "").strip().casefold()
        return (float(question.points) if value and is_correct else 0.0), value

    if question.type == "multiple_choice":
        try:
            selected_ids = json.loads(value) if value else []
        except json.JSONDecodeError as error:
            raise HTTPException(status_code=422, detail=f"Answer for question {question.id} must be a JSON array of choice IDs") from error
        valid_ids = {choice["id"] for choice in (question.options or {}).get("choices", [])}
        if (
            not isinstance(selected_ids, list)
            or any(not isinstance(item, str) for item in selected_ids)
            or len(selected_ids) != len(set(selected_ids))
            or not set(selected_ids).issubset(valid_ids)
        ):
            raise HTTPException(status_code=422, detail=f"Invalid choices for question {question.id}")
        canonical_answer = json.dumps(sorted(selected_ids), separators=(",", ":"))
        try:
            correct_ids = json.loads(question.correct or "[]")
        except json.JSONDecodeError:
            correct_ids = []
        is_correct = bool(selected_ids) and set(selected_ids) == set(correct_ids)
        return (float(question.points) if is_correct else 0.0), canonical_answer

    if question.type == "true_false":
        if value and value not in {"true", "false"}:
            raise HTTPException(status_code=422, detail=f"Answer for question {question.id} must be true or false")
        is_correct = value == (question.correct or "").strip()
        return (float(question.points) if value and is_correct else 0.0), value

    if question.type == "short_answer":
        expected = (question.correct or "").strip().casefold()
        return (float(question.points) if value and value.casefold() == expected else 0.0), value

    if question.type == "essay":
        return 0.0, value

    raise HTTPException(status_code=422, detail=f"Unsupported question type: {question.type}")


async def _require_exam_student(exam: Exam, current_user, db: AsyncSession):
    if current_user.role.name != "student":
        raise HTTPException(status_code=403, detail="Only students can take exams")
    enrollment_result = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == exam.course_id,
            Enrollment.status.in_(ELIGIBLE_ENROLLMENT_STATUSES),
        )
    )
    if enrollment_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Not authorized")


def _normalize_exam_answers(questions: list[ExamQuestion], answers: dict[str, str]):
    questions_by_id = {str(question.id): question for question in questions}
    supplied_answers: dict[str, str] = {}
    for question_id, answer in answers.items():
        try:
            normalized_id = str(UUID(question_id))
        except ValueError as error:
            raise HTTPException(status_code=422, detail="Answer keys must be question UUIDs") from error
        if normalized_id not in questions_by_id:
            raise HTTPException(status_code=422, detail=f"Question {question_id} does not belong to this exam")
        if normalized_id in supplied_answers:
            raise HTTPException(status_code=422, detail="Duplicate question IDs are not allowed")
        supplied_answers[normalized_id] = answer

    normalized_answers = {}
    auto_score = 0.0
    for question_id, question in questions_by_id.items():
        normalized_answer = supplied_answers.get(question_id, "")
        if question.type != "essay":
            points, normalized_answer = _grade_question(question, normalized_answer)
            auto_score += points
        else:
            normalized_answer = normalized_answer.strip()
        normalized_answers[question_id] = normalized_answer
    return normalized_answers, auto_score


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


@router.post("/{exam_id}/attempts", response_model=ExamAttemptStartResponse)
async def start_exam_attempt(
    exam_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Exam).where(Exam.id == exam_id).with_for_update())
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    await _require_exam_student(exam, current_user, db)

    now = _now_utc()
    available_from = _as_utc(exam.available_from)
    available_until = _as_utc(exam.available_until)
    if available_from and now < available_from:
        raise HTTPException(status_code=409, detail="This exam is not open yet")
    if available_until and now >= available_until:
        raise HTTPException(status_code=409, detail="The exam availability window has closed")

    attempts_result = await db.execute(
        select(ExamResult)
        .where(ExamResult.exam_id == exam.id, ExamResult.student_id == current_user.id)
        .order_by(ExamResult.attempt_number)
        .with_for_update()
    )
    attempts = attempts_result.scalars().all()
    expired_attempt_changed = False
    for attempt in attempts:
        if attempt.status == "in_progress":
            expires_at = _as_utc(attempt.expires_at)
            if expires_at and now >= expires_at:
                attempt.status = "expired"
                expired_attempt_changed = True
            else:
                return _attempt_response(attempt)

    if len(attempts) >= exam.max_attempts:
        if expired_attempt_changed:
            await _commit_exam_change(db)
        raise HTTPException(status_code=409, detail="No attempts remaining")

    questions = await _get_exam_questions_for_update(exam.id, db)
    total_points = sum(question.points for question in questions)
    if not questions or total_points <= 0:
        if expired_attempt_changed:
            await _commit_exam_change(db)
        raise HTTPException(status_code=409, detail="This exam is not ready to be taken")

    expires_at = now + timedelta(minutes=exam.duration_min)
    if available_until and available_until < expires_at:
        expires_at = available_until
    attempt = ExamResult(
        exam_id=exam.id,
        student_id=current_user.id,
        attempt_number=len(attempts) + 1,
        started_at=now,
        expires_at=expires_at,
        submitted_at=None,
        status="in_progress",
        auto_score=None,
        score=None,
        answers={},
        manual_grades={},
        passed=False,
        taken_at=now.replace(tzinfo=None),
    )
    db.add(attempt)
    await _commit_exam_change(db)
    await db.refresh(attempt)
    return _attempt_response(attempt)


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
    if role_name != "student":
        raise HTTPException(status_code=403, detail="Staff should use the management endpoint")
    enrollment_result = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == exam.course_id,
            Enrollment.status.in_(ELIGIBLE_ENROLLMENT_STATUSES),
        )
    )
    if enrollment_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Not authorized")
    results_query = select(ExamResult).where(
        ExamResult.exam_id == exam_id,
        ExamResult.student_id == current_user.id,
    )

    results = await db.execute(results_query.order_by(ExamResult.taken_at.desc()))
    attempts = results.scalars().all()
    now = _now_utc()
    expired_attempts = False
    available_until = _as_utc(exam.available_until)
    for attempt in attempts:
        expires_at = _as_utc(attempt.expires_at)
        if (
            attempt.status == "in_progress"
            and ((expires_at and now >= expires_at) or (available_until and now >= available_until))
        ):
            attempt.status = "expired"
            expired_attempts = True
    if expired_attempts:
        await _commit_exam_change(db)
    return attempts


@router.post("/{exam_id}/results", response_model=ExamResultResponse, status_code=201)
async def submit_exam_result(
    exam_id: str,
    payload: ExamSubmissionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Exam).options(selectinload(Exam.questions)).where(Exam.id == exam_id)
    )
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    await _require_exam_student(exam, current_user, db)

    attempt_result = await db.execute(
        select(ExamResult)
        .where(
            ExamResult.id == payload.attempt_id,
            ExamResult.exam_id == exam.id,
            ExamResult.student_id == current_user.id,
        )
        .with_for_update()
    )
    attempt = attempt_result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="Exam attempt not found")

    normalized_answers, auto_score = _normalize_exam_answers(exam.questions, payload.answers)
    if attempt.status != "in_progress":
        if attempt.answers == normalized_answers and attempt.status in {"pending_review", "graded"}:
            return attempt
        raise HTTPException(status_code=409, detail="This exam attempt has already been submitted")

    now = _now_utc()
    expires_at = _as_utc(attempt.expires_at)
    available_until = _as_utc(exam.available_until)
    if (expires_at and now >= expires_at) or (available_until and now >= available_until):
        attempt.status = "expired"
        await _commit_exam_change(db)
        raise HTTPException(status_code=409, detail="The exam attempt has expired")

    total_points = sum(question.points for question in exam.questions)
    if total_points <= 0:
        raise HTTPException(status_code=409, detail="This exam is not ready to be submitted")

    requires_manual_review = any(question.type == "essay" for question in exam.questions)
    attempt.answers = normalized_answers
    attempt.auto_score = auto_score
    attempt.score = None if requires_manual_review else auto_score
    attempt.status = "pending_review" if requires_manual_review else "graded"
    attempt.passed = (
        False
        if requires_manual_review
        else auto_score / total_points * 100 >= float(exam.pass_score)
    )
    attempt.submitted_at = now
    attempt.taken_at = now.replace(tzinfo=None)
    attempt.manual_grades = {}
    await _commit_exam_change(db)
    await db.refresh(attempt)
    return attempt


@router.put("/{exam_id}/results/{result_id}/grade", response_model=ExamResultResponse)
async def grade_exam_attempt(
    exam_id: str,
    result_id: UUID,
    payload: ExamManualGradeSubmission,
    current_user=Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    exam = await _get_exam_for_management(exam_id, current_user, db, lock=True)
    result = await db.execute(
        select(ExamResult)
        .where(ExamResult.id == result_id, ExamResult.exam_id == exam.id)
        .with_for_update()
    )
    attempt = result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="Exam attempt not found")
    if attempt.status != "pending_review":
        raise HTTPException(status_code=409, detail="This attempt is not awaiting manual review")

    questions_result = await db.execute(
        select(ExamQuestion).where(ExamQuestion.exam_id == exam.id)
    )
    questions = questions_result.scalars().all()
    essay_questions = {str(question.id): question for question in questions if question.type == "essay"}
    if set(payload.grades) != set(essay_questions):
        raise HTTPException(status_code=422, detail="Provide a grade for every essay question and no other question")

    manual_score = 0.0
    normalized_grades: dict[str, float] = {}
    for question_id, grade in payload.grades.items():
        question = essay_questions[question_id]
        if not isfinite(grade) or grade < 0 or grade > question.points:
            raise HTTPException(
                status_code=422,
                detail=f"Grade for question {question_id} must be between 0 and {question.points}",
            )
        normalized_grades[question_id] = grade
        manual_score += grade

    total_points = sum(question.points for question in questions)
    if total_points <= 0:
        raise HTTPException(status_code=409, detail="This exam has no gradable points")

    final_score = float(attempt.auto_score or 0) + manual_score
    attempt.manual_grades = normalized_grades
    attempt.feedback = payload.feedback.strip() if payload.feedback else None
    attempt.score = final_score
    attempt.passed = final_score / total_points * 100 >= float(exam.pass_score)
    attempt.status = "graded"
    await _commit_exam_change(db)
    await db.refresh(attempt)
    return attempt


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
    result = await db.execute(select(Exam).where(Exam.id == exam_id).with_for_update())
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    role_name = current_user.role.name
    if role_name not in {"super_admin", "admin"}:
        course_result = await db.execute(select(Course).where(Course.id == exam.course_id))
        course = course_result.scalar_one_or_none()
        if role_name != "tutor" or not course or course.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    updated_values = payload.model_dump(exclude_unset=True)
    if {"duration_min", "pass_score", "max_attempts"}.intersection(updated_values):
        await _ensure_exam_has_no_attempts(exam.id, db)
    available_from = _as_utc(updated_values.get("available_from", exam.available_from))
    available_until = _as_utc(updated_values.get("available_until", exam.available_until))
    if available_from and available_until and available_from >= available_until:
        raise HTTPException(status_code=422, detail="available_until must be later than available_from")
    if "max_attempts" in updated_values:
        highest_attempt_result = await db.execute(
            select(func.max(ExamResult.attempt_number)).where(ExamResult.exam_id == exam.id)
        )
        highest_attempt = highest_attempt_result.scalar_one_or_none() or 0
        if updated_values["max_attempts"] < highest_attempt:
            raise HTTPException(status_code=409, detail="max_attempts cannot be lower than an existing attempt number")

    for field, value in updated_values.items():
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
    await _ensure_exam_has_no_attempts(exam.id, db)
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
    await _ensure_exam_has_no_attempts(exam.id, db)
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
    await _ensure_exam_has_no_attempts(exam.id, db)
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
    await _ensure_exam_has_no_attempts(exam.id, db)
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
