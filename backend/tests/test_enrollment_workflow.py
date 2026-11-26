import asyncio
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.v1 import enrollments
from app.schemas.lms import EnrollmentCreate


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeDB:
    def __init__(self, *results):
        self.results = list(results)
        self.added = []
        self.committed = False

    async def execute(self, statement):
        return self.results.pop(0)

    def add(self, instance):
        self.added.append(instance)

    async def commit(self):
        self.committed = True

    async def refresh(self, instance):
        return None


def test_only_students_can_enroll():
    db = FakeDB()

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            enrollments.create_enrollment(
                EnrollmentCreate(course_id=uuid4()),
                SimpleNamespace(id=uuid4(), role=SimpleNamespace(name="tutor")),
                db,
            )
        )

    assert error.value.status_code == 403
    assert not db.results


@pytest.mark.parametrize(
    ("course", "status_code", "message"),
    [
        (SimpleNamespace(id=uuid4(), is_published=False, price=0), 404, "Course not found"),
    ],
)
def test_enrollment_rejects_unpublished_courses(course, status_code, message):
    db = FakeDB(FakeResult(course))

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            enrollments.create_enrollment(
                EnrollmentCreate(course_id=course.id),
                SimpleNamespace(id=uuid4(), role=SimpleNamespace(name="student")),
                db,
            )
        )

    assert error.value.status_code == status_code
    assert error.value.detail == message
    assert not db.committed


def test_paid_course_application_waits_for_admin_review(monkeypatch):
    student_id = uuid4()
    course = SimpleNamespace(id=uuid4(), title="GIS Fundamentals", is_published=True, price=100)
    db = FakeDB(FakeResult(course), FakeResult(None))

    async def attach_context(enrollment, current_user, session):
        return enrollment

    async def notify_admins(*args, **kwargs):
        return []

    monkeypatch.setattr(enrollments, "_attach_course_context", attach_context)
    monkeypatch.setattr(enrollments.NotificationService, "notify_admins", notify_admins)
    result = asyncio.run(
        enrollments.create_enrollment(
            EnrollmentCreate(course_id=course.id, mode="online"),
            SimpleNamespace(id=student_id, first_name="Test", last_name="Student", role=SimpleNamespace(name="student")),
            db,
        )
    )

    assert result.status == "application_pending"
    assert result.student_id == student_id
    assert result.course_id == course.id
    assert db.committed


def test_free_course_application_waits_for_admin_review(monkeypatch):
    student_id = uuid4()
    course = SimpleNamespace(id=uuid4(), title="GIS Fundamentals", is_published=True, price=0)
    db = FakeDB(FakeResult(course), FakeResult(None))

    async def attach_context(enrollment, current_user, session):
        return enrollment

    async def notify_admins(*args, **kwargs):
        return []

    monkeypatch.setattr(enrollments, "_attach_course_context", attach_context)
    monkeypatch.setattr(enrollments.NotificationService, "notify_admins", notify_admins)

    result = asyncio.run(
        enrollments.create_enrollment(
            EnrollmentCreate(course_id=course.id, mode="online"),
            SimpleNamespace(id=student_id, first_name="Test", last_name="Student", role=SimpleNamespace(name="student")),
            db,
        )
    )

    assert result.status == "application_pending"
    assert result.student_id == student_id
    assert result.course_id == course.id
    assert db.committed


@pytest.mark.parametrize(
    ("price", "decision", "expected_status"),
    [
        (0, "approve", "active"),
        (75000, "approve", "pending"),
        (75000, "reject", "rejected"),
    ],
)
def test_admin_review_moves_application_to_correct_workflow(monkeypatch, price, decision, expected_status):
    enrollment = SimpleNamespace(
        id=uuid4(),
        student_id=uuid4(),
        course_id=uuid4(),
        status="application_pending",
        review_message=None,
        course=SimpleNamespace(title="GIS Fundamentals", price=price),
    )
    db = FakeDB(FakeResult(enrollment))

    async def attach_context(record, current_user, session):
        return record

    async def notify_student(*args, **kwargs):
        return None

    monkeypatch.setattr(enrollments, "_attach_course_context", attach_context)
    monkeypatch.setattr(enrollments.NotificationService, "create", notify_student)
    result = asyncio.run(
        enrollments.review_course_application(
            str(enrollment.id),
            enrollments.EnrollmentReviewRequest(decision=decision, message="Review note"),
            SimpleNamespace(role=SimpleNamespace(name="admin")),
            db,
        )
    )

    assert result.status == expected_status
    assert enrollment.status == expected_status
    assert enrollment.review_message == ("Review note" if decision == "reject" else None)
    assert db.committed


def test_admin_cannot_bypass_application_approval_with_enrollment_update():
    enrollment = SimpleNamespace(id=uuid4(), status="application_pending")
    db = FakeDB(FakeResult(enrollment))

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            enrollments.update_enrollment(
                str(enrollment.id),
                enrollments.EnrollmentUpdate(status="active"),
                SimpleNamespace(role=SimpleNamespace(name="admin")),
                db,
            )
        )

    assert error.value.status_code == 409
    assert enrollment.status == "application_pending"


def test_rejected_application_can_be_resubmitted(monkeypatch):
    student_id = uuid4()
    course = SimpleNamespace(id=uuid4(), title="GIS Fundamentals", is_published=True, price=75000)
    enrollment = SimpleNamespace(
        id=uuid4(),
        student_id=student_id,
        course_id=course.id,
        status="rejected",
        review_message="Please submit updated information.",
        enrolled_at=None,
    )
    db = FakeDB(FakeResult(course), FakeResult(enrollment))

    async def attach_context(record, current_user, session):
        return record

    async def notify_admins(*args, **kwargs):
        return []

    monkeypatch.setattr(enrollments, "_attach_course_context", attach_context)
    monkeypatch.setattr(enrollments.NotificationService, "notify_admins", notify_admins)
    result = asyncio.run(
        enrollments.create_enrollment(
            EnrollmentCreate(course_id=course.id, mode="online"),
            SimpleNamespace(id=student_id, first_name="Test", last_name="Student", role=SimpleNamespace(name="student")),
            db,
        )
    )

    assert result.status == "application_pending"
    assert result.review_message is None
    assert db.committed
