import asyncio
from datetime import datetime
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.api.v1.exams import (
    create_exam_question,
    delete_exam_question,
    grade_exam_attempt,
    get_exam,
    get_exam_management,
    list_exam_results,
    list_exams,
    reorder_exam_questions,
    start_exam_attempt,
    submit_exam_result,
    update_exam_question,
)
from app.database import get_db
from app.main import app
from app.schemas.lms import (
    ExamManagementResponse,
    ExamManualGradeSubmission,
    ExamSubmissionCreate,
    ExamQuestionCreate,
    ExamQuestionDefinition,
    ExamQuestionReorder,
    ExamQuestionUpdate,
    ExamResultResponse,
    ExamResponse,
)


EXAM_ID = UUID("77777777-7777-7777-7777-777777777777")
COURSE_ID = UUID("22222222-2222-2222-2222-222222222222")
STUDENT_ID = UUID("44444444-4444-4444-4444-444444444444")
OTHER_STUDENT_ID = UUID("55555555-5555-5555-5555-555555555555")
TUTOR_ID = UUID("11111111-1111-1111-1111-111111111111")
QUESTION_ID = UUID("66666666-6666-6666-6666-666666666666")


class FakeExecutionResult:
    def __init__(self, rows=None, scalar=None):
        self.rows = rows or []
        self.scalar = scalar
        self.unique_called = False

    def unique(self):
        self.unique_called = True
        return self

    def scalars(self):
        return self

    def all(self):
        return self.rows

    def scalar_one_or_none(self):
        return self.scalar


class FakeDB:
    def __init__(self, *results):
        self.results = list(results)
        self.statements = []
        self.added = []
        self.deleted = []
        self.commit_count = 0
        self.rollback_count = 0

    async def execute(self, statement):
        self.statements.append(statement)
        return self.results.pop(0)

    def add(self, instance):
        self.added.append(instance)

    async def delete(self, instance):
        self.deleted.append(instance)

    async def commit(self):
        self.commit_count += 1

    async def rollback(self):
        self.rollback_count += 1

    async def refresh(self, instance):
        if getattr(instance, "id", None) is None:
            instance.id = uuid4()
        return None


def make_user(role_name, user_id=STUDENT_ID):
    return SimpleNamespace(id=user_id, role=SimpleNamespace(name=role_name))


def make_question(question_id=QUESTION_ID, position=0):
    return SimpleNamespace(
        id=question_id,
        exam_id=EXAM_ID,
        question="What is 2 + 2?",
        type="short_answer",
        options=None,
        correct="4",
        points=1,
        position=position,
    )


def make_exam(*, results=None):
    return SimpleNamespace(
        id=EXAM_ID,
        course_id=COURSE_ID,
        title="Arithmetic",
        duration_min=30,
        pass_score=70.0,
        available_from=None,
        available_until=None,
        max_attempts=1,
        created_at=datetime(2026, 1, 1),
        questions=[make_question()],
        results=results or [],
    )


def make_exam_result(student_id):
    return SimpleNamespace(
        id=UUID("88888888-8888-8888-8888-888888888888"),
        exam_id=EXAM_ID,
        student_id=student_id,
        score=1.0,
        auto_score=1.0,
        manual_grades={},
        answers={str(QUESTION_ID): "4"},
        passed=True,
        taken_at=datetime(2026, 1, 2),
        status="graded",
        expires_at=None,
    )


def make_attempt(*, status="in_progress", expires_at=None, attempt_id=None):
    from datetime import timezone

    return SimpleNamespace(
        id=attempt_id or UUID("99999999-9999-9999-9999-999999999999"),
        exam_id=EXAM_ID,
        student_id=STUDENT_ID,
        attempt_number=1,
        started_at=datetime.now(timezone.utc),
        expires_at=expires_at or datetime.now(timezone.utc).replace(year=datetime.now(timezone.utc).year + 1),
        submitted_at=None,
        status=status,
        score=None,
        auto_score=None,
        manual_grades={},
        feedback=None,
        answers={},
        passed=False,
        taken_at=datetime.now(),
    )


def test_list_exams_uniques_joined_questions_and_redacts_staff_data():
    exam = make_exam(results=[make_exam_result(STUDENT_ID)])
    query_result = FakeExecutionResult(rows=[exam])
    db = FakeDB(query_result)

    exams = asyncio.run(list_exams(current_user=make_user("admin"), db=db))
    response = ExamResponse.model_validate(exams[0])

    assert query_result.unique_called
    assert response.questions[0].id == QUESTION_ID
    assert "correct" not in response.questions[0].model_dump()
    assert "results" not in response.model_dump()


def test_get_exam_uniques_joined_questions_and_returns_student_safe_contract():
    exam_result = FakeExecutionResult(scalar=make_exam(results=[make_exam_result(OTHER_STUDENT_ID)]))
    enrollment_result = FakeExecutionResult(scalar=object())
    db = FakeDB(exam_result, enrollment_result)

    exam = asyncio.run(get_exam(str(EXAM_ID), current_user=make_user("student"), db=db))
    response = ExamResponse.model_validate(exam)

    assert exam_result.unique_called
    assert "correct" not in response.questions[0].model_dump()
    assert "results" not in response.model_dump()


def test_exam_list_and_detail_http_routes_return_student_safe_payloads():
    list_result = FakeExecutionResult(rows=[make_exam(results=[make_exam_result(STUDENT_ID)])])
    detail_result = FakeExecutionResult(scalar=make_exam(results=[make_exam_result(STUDENT_ID)]))
    db = FakeDB(list_result, detail_result)

    async def override_db():
        yield db

    original_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_current_user] = lambda: make_user("admin")
    app.dependency_overrides[get_db] = override_db
    try:
        with TestClient(app, base_url="http://localhost") as client:
            list_response = client.get("/api/v1/exams/")
            detail_response = client.get(f"/api/v1/exams/{EXAM_ID}")
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(original_overrides)

    assert list_response.status_code == 200
    assert detail_response.status_code == 200
    assert list_result.unique_called
    assert detail_result.unique_called
    assert "correct" not in list_response.json()[0]["questions"][0]
    assert "results" not in list_response.json()[0]
    assert "correct" not in detail_response.json()["questions"][0]
    assert "results" not in detail_response.json()


def test_management_read_includes_keys_and_results_only_for_course_tutor():
    exam = make_exam(results=[make_exam_result(STUDENT_ID)])
    db = FakeDB(
        FakeExecutionResult(scalar=exam),
        FakeExecutionResult(scalar=SimpleNamespace(tutor_id=TUTOR_ID)),
    )

    managed_exam = asyncio.run(
        get_exam_management(
            str(EXAM_ID), current_user=make_user("tutor", TUTOR_ID), db=db
        )
    )
    response = ExamManagementResponse.model_validate(managed_exam)

    assert response.questions[0].correct == "4"
    assert response.results[0].student_id == STUDENT_ID


def test_management_read_rejects_a_tutor_who_does_not_own_the_course():
    db = FakeDB(
        FakeExecutionResult(scalar=make_exam()),
        FakeExecutionResult(scalar=SimpleNamespace(tutor_id=OTHER_STUDENT_ID)),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            get_exam_management(
                str(EXAM_ID), current_user=make_user("tutor", TUTOR_ID), db=db
            )
        )

    assert error.value.status_code == 403


def test_student_results_query_is_limited_to_the_current_student():
    own_result = make_exam_result(STUDENT_ID)
    db = FakeDB(
        FakeExecutionResult(scalar=make_exam()),
        FakeExecutionResult(scalar=object()),
        FakeExecutionResult(rows=[own_result]),
    )

    results = asyncio.run(
        list_exam_results(
            str(EXAM_ID), current_user=make_user("student"), db=db
        )
    )

    assert results == [own_result]
    assert "exam_results.student_id" in str(db.statements[-1])

    response = ExamResultResponse.model_validate(own_result).model_dump()
    assert "auto_score" not in response
    assert "manual_grades" not in response


def test_pending_enrollment_is_not_eligible_to_view_an_exam():
    db = FakeDB(
        FakeExecutionResult(scalar=make_exam()),
        FakeExecutionResult(scalar=None),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(get_exam(str(EXAM_ID), current_user=make_user("student"), db=db))

    assert error.value.status_code == 403
    status_values = db.statements[1].compile().params.values()
    assert "pending" not in status_values


def test_student_exam_list_excludes_pending_enrollment_status():
    db = FakeDB(
        FakeExecutionResult(rows=[COURSE_ID]),
        FakeExecutionResult(rows=[make_exam()]),
    )

    exams = asyncio.run(list_exams(current_user=make_user("student"), db=db))

    assert len(exams) == 1
    assert "pending" not in db.statements[0].compile().params.values()


def test_tutor_can_create_question_through_http_route():
    first = make_question(position=0)
    db = FakeDB(
        FakeExecutionResult(scalar=make_exam()),
        FakeExecutionResult(scalar=SimpleNamespace(tutor_id=TUTOR_ID)),
        FakeExecutionResult(scalar=None),
        FakeExecutionResult(rows=[first]),
    )

    async def override_db():
        yield db

    original_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_current_user] = lambda: make_user("tutor", TUTOR_ID)
    app.dependency_overrides[get_db] = override_db
    try:
        with TestClient(app, base_url="http://localhost") as client:
            response = client.post(
                f"/api/v1/exams/{EXAM_ID}/questions",
                json={
                    "question": "Pick one",
                    "type": "single_choice",
                    "options": {"choices": [{"id": "a", "text": "A"}, {"id": "b", "text": "B"}]},
                    "correct": "b",
                    "points": 3,
                },
            )
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(original_overrides)

    assert response.status_code == 201
    assert response.json()["position"] == 1
    assert response.json()["correct"] == "b"
    assert db.commit_count == 1


@pytest.mark.parametrize(
    ("definition", "expected_correct"),
    [
        (
            {
                "question": "Pick one",
                "type": "single_choice",
                "options": {"choices": [{"id": "a", "text": " A "}, {"id": "b", "text": "B"}]},
                "correct": "a",
            },
            "a",
        ),
        (
            {
                "question": "Pick all",
                "type": "multiple_choice",
                "options": {"choices": [{"id": "a", "text": "A"}, {"id": "b", "text": "B"}]},
                "correct": ["b", "a"],
            },
            '["a","b"]',
        ),
        ({"question": "True?", "type": "true_false", "correct": "true"}, "true"),
        ({"question": "Short", "type": "short_answer", "correct": "  answer "}, "answer"),
        ({"question": "Essay", "type": "essay"}, None),
    ],
)
def test_question_definitions_validate_and_normalize_supported_types(definition, expected_correct):
    question = ExamQuestionDefinition.model_validate(definition)

    assert question.correct == expected_correct
    if question.options:
        assert question.options["choices"][0]["text"] == question.options["choices"][0]["text"].strip()


@pytest.mark.parametrize(
    "definition",
    [
        {"question": "Blank points", "type": "essay", "points": 0},
        {"question": "Bad type", "type": "matching"},
        {"question": "Missing answer", "type": "true_false"},
        {
            "question": "Duplicate choices",
            "type": "single_choice",
            "options": {"choices": [{"id": "a", "text": "A"}, {"id": "a", "text": "Again"}]},
            "correct": "a",
        },
        {
            "question": "Invalid multiple answer",
            "type": "multiple_choice",
            "options": {"choices": [{"id": "a", "text": "A"}, {"id": "b", "text": "B"}]},
            "correct": ["missing"],
        },
        {"question": "Essay key", "type": "essay", "correct": "answer"},
    ],
)
def test_question_definitions_reject_invalid_types_and_answers(definition):
    with pytest.raises(ValueError):
        ExamQuestionDefinition.model_validate(definition)


def test_create_question_inserts_at_requested_position_and_canonicalizes_answer():
    first = make_question(position=0)
    second = make_question(OTHER_STUDENT_ID, position=1)
    db = FakeDB(
        FakeExecutionResult(scalar=make_exam()),
        FakeExecutionResult(scalar=SimpleNamespace(tutor_id=TUTOR_ID)),
        FakeExecutionResult(scalar=None),
        FakeExecutionResult(rows=[first, second]),
    )
    payload = ExamQuestionCreate(
        question="Pick all correct answers",
        type="multiple_choice",
        options={"choices": [{"id": "a", "text": "A"}, {"id": "b", "text": "B"}]},
        correct=["b", "a"],
        points=2,
        position=1,
    )

    created = asyncio.run(
        create_exam_question(str(EXAM_ID), payload, make_user("tutor", TUTOR_ID), db)
    )

    assert created.position == 1
    assert created.correct == '["a","b"]'
    assert first.position == 0
    assert second.position == 2
    assert db.commit_count == 1
    assert db.statements[0]._for_update_arg is not None


def test_reorder_requires_a_complete_permutation_and_commits_order_atomically():
    first = make_question(position=0)
    second = make_question(OTHER_STUDENT_ID, position=1)
    db = FakeDB(
        FakeExecutionResult(scalar=make_exam()),
        FakeExecutionResult(scalar=SimpleNamespace(tutor_id=TUTOR_ID)),
        FakeExecutionResult(scalar=None),
        FakeExecutionResult(rows=[first, second]),
    )

    ordered = asyncio.run(
        reorder_exam_questions(
            str(EXAM_ID),
            ExamQuestionReorder(question_ids=[OTHER_STUDENT_ID, QUESTION_ID]),
            make_user("tutor", TUTOR_ID),
            db,
        )
    )

    assert ordered == [second, first]
    assert second.position == 0
    assert first.position == 1
    assert db.commit_count == 1


def test_reorder_rejects_missing_question_ids_without_committing():
    db = FakeDB(
        FakeExecutionResult(scalar=make_exam()),
        FakeExecutionResult(scalar=SimpleNamespace(tutor_id=TUTOR_ID)),
        FakeExecutionResult(scalar=None),
        FakeExecutionResult(rows=[make_question()]),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            reorder_exam_questions(
                str(EXAM_ID),
                ExamQuestionReorder(question_ids=[]),
                make_user("tutor", TUTOR_ID),
                db,
            )
        )

    assert error.value.status_code == 422
    assert db.commit_count == 0


def test_update_question_revalidates_merged_contract_and_rolls_back_invalid_type_change():
    question = make_question()
    db = FakeDB(
        FakeExecutionResult(scalar=make_exam()),
        FakeExecutionResult(scalar=SimpleNamespace(tutor_id=TUTOR_ID)),
        FakeExecutionResult(scalar=None),
        FakeExecutionResult(scalar=question),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            update_exam_question(
                str(EXAM_ID),
                QUESTION_ID,
                ExamQuestionUpdate(type="essay"),
                make_user("tutor", TUTOR_ID),
                db,
            )
        )

    assert error.value.status_code == 422
    assert question.type == "short_answer"
    assert db.commit_count == 0


def test_delete_question_compacts_positions():
    first = make_question(position=0)
    second = make_question(OTHER_STUDENT_ID, position=1)
    third = make_question(TUTOR_ID, position=2)
    db = FakeDB(
        FakeExecutionResult(scalar=make_exam()),
        FakeExecutionResult(scalar=SimpleNamespace(tutor_id=TUTOR_ID)),
        FakeExecutionResult(scalar=None),
        FakeExecutionResult(rows=[first, second, third]),
    )

    asyncio.run(
        delete_exam_question(
            str(EXAM_ID),
            OTHER_STUDENT_ID,
            make_user("tutor", TUTOR_ID),
            db,
        )
    )

    assert db.deleted == [second]
    assert first.position == 0
    assert third.position == 1
    assert db.commit_count == 1


def test_start_attempt_creates_server_deadline_and_is_idempotent():
    from datetime import timezone

    exam = make_exam()
    active_attempt = make_attempt()
    create_db = FakeDB(
        FakeExecutionResult(scalar=exam),
        FakeExecutionResult(scalar=object()),
        FakeExecutionResult(rows=[]),
        FakeExecutionResult(rows=[make_question()]),
    )

    started = asyncio.run(start_exam_attempt(str(EXAM_ID), make_user("student"), create_db))

    assert started.status == "in_progress"
    assert started.attempt_number == 1
    assert (started.expires_at - started.started_at).total_seconds() == pytest.approx(1800, abs=1)
    assert create_db.commit_count == 1

    resume_db = FakeDB(
        FakeExecutionResult(scalar=exam),
        FakeExecutionResult(scalar=object()),
        FakeExecutionResult(rows=[active_attempt]),
    )
    resumed = asyncio.run(start_exam_attempt(str(EXAM_ID), make_user("student"), resume_db))

    assert resumed.attempt_id == active_attempt.id
    assert resume_db.commit_count == 0


def test_start_attempt_rejects_closed_window_and_exhausted_attempts():
    from datetime import timezone

    future_exam = make_exam()
    future_exam.available_from = datetime.now(timezone.utc).replace(year=datetime.now(timezone.utc).year + 1)
    future_db = FakeDB(FakeExecutionResult(scalar=future_exam), FakeExecutionResult(scalar=object()))
    with pytest.raises(HTTPException) as future_error:
        asyncio.run(start_exam_attempt(str(EXAM_ID), make_user("student"), future_db))
    assert future_error.value.status_code == 409

    completed_exam = make_exam()
    completed_db = FakeDB(
        FakeExecutionResult(scalar=completed_exam),
        FakeExecutionResult(scalar=object()),
        FakeExecutionResult(rows=[make_attempt(status="graded")]),
    )
    with pytest.raises(HTTPException) as exhausted_error:
        asyncio.run(start_exam_attempt(str(EXAM_ID), make_user("student"), completed_db))
    assert exhausted_error.value.status_code == 409
    assert completed_db.commit_count == 0


def test_submission_is_attempt_bound_type_graded_and_atomic():
    exam = make_exam()
    attempt = make_attempt()
    db = FakeDB(
        FakeExecutionResult(scalar=exam),
        FakeExecutionResult(scalar=object()),
        FakeExecutionResult(scalar=attempt),
    )

    result = asyncio.run(
        submit_exam_result(
            str(EXAM_ID),
            ExamSubmissionCreate(attempt_id=attempt.id, answers={str(QUESTION_ID): " 4 "}),
            make_user("student"),
            db,
        )
    )

    assert result.status == "graded"
    assert result.auto_score == 1.0
    assert result.score == 1.0
    assert result.passed is True
    assert result.answers == {str(QUESTION_ID): "4"}
    assert db.commit_count == 1


def test_submission_rejects_answer_ids_outside_the_exam_without_commit():
    exam = make_exam()
    attempt = make_attempt()
    db = FakeDB(
        FakeExecutionResult(scalar=exam),
        FakeExecutionResult(scalar=object()),
        FakeExecutionResult(scalar=attempt),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            submit_exam_result(
                str(EXAM_ID),
                ExamSubmissionCreate(attempt_id=attempt.id, answers={str(TUTOR_ID): "4"}),
                make_user("student"),
                db,
            )
        )

    assert error.value.status_code == 422
    assert db.commit_count == 0


def test_expired_submission_persists_expired_status():
    from datetime import timezone

    attempt = make_attempt(expires_at=datetime.now(timezone.utc).replace(year=datetime.now(timezone.utc).year - 1))
    db = FakeDB(
        FakeExecutionResult(scalar=make_exam()),
        FakeExecutionResult(scalar=object()),
        FakeExecutionResult(scalar=attempt),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            submit_exam_result(
                str(EXAM_ID),
                ExamSubmissionCreate(attempt_id=attempt.id, answers={str(QUESTION_ID): "4"}),
                make_user("student"),
                db,
            )
        )

    assert error.value.status_code == 409
    assert attempt.status == "expired"
    assert db.commit_count == 1


def test_manual_essay_grading_finalizes_result_and_checks_bounds():
    exam = make_exam()
    short_question = make_question(position=0)
    short_question.points = 3
    essay_question = make_question(TUTOR_ID, position=1)
    essay_question.type = "essay"
    essay_question.points = 2
    essay_question.correct = None
    exam.questions = [short_question, essay_question]
    attempt = make_attempt(status="pending_review")
    attempt.auto_score = 3.0
    attempt.answers = {str(essay_question.id): "Written response"}
    db = FakeDB(
        FakeExecutionResult(scalar=exam),
        FakeExecutionResult(scalar=SimpleNamespace(tutor_id=TUTOR_ID)),
        FakeExecutionResult(scalar=attempt),
        FakeExecutionResult(rows=exam.questions),
    )

    graded = asyncio.run(
        grade_exam_attempt(
            str(EXAM_ID),
            attempt.id,
            ExamManualGradeSubmission(grades={str(essay_question.id): 1.0}, feedback="Good reasoning"),
            make_user("tutor", TUTOR_ID),
            db,
        )
    )

    assert graded.status == "graded"
    assert graded.score == 4.0
    assert graded.passed is True
    assert graded.feedback == "Good reasoning"
    assert db.commit_count == 1

    invalid_db = FakeDB(
        FakeExecutionResult(scalar=exam),
        FakeExecutionResult(scalar=SimpleNamespace(tutor_id=TUTOR_ID)),
        FakeExecutionResult(scalar=make_attempt(status="pending_review")),
        FakeExecutionResult(rows=exam.questions),
    )
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            grade_exam_attempt(
                str(EXAM_ID),
                attempt.id,
                ExamManualGradeSubmission(grades={str(essay_question.id): 3.0}),
                make_user("tutor", TUTOR_ID),
                invalid_db,
            )
        )
    assert error.value.status_code == 422
    assert invalid_db.commit_count == 0