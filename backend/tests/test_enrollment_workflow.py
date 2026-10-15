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
        (
            SimpleNamespace(id=uuid4(), is_published=True, price=100),
            409,
            "Paid courses must be enrolled through the payment workflow",
        ),
    ],
)
def test_direct_enrollment_rejects_unpublished_and_paid_courses(course, status_code, message):
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


def test_free_published_course_enrollment_is_activated(monkeypatch):
    student_id = uuid4()
    course = SimpleNamespace(id=uuid4(), is_published=True, price=0)
    db = FakeDB(FakeResult(course), FakeResult(None))

    async def attach_context(enrollment, current_user, session):
        return enrollment

    monkeypatch.setattr(enrollments, "_attach_course_context", attach_context)

    result = asyncio.run(
        enrollments.create_enrollment(
            EnrollmentCreate(course_id=course.id, mode="online"),
            SimpleNamespace(id=student_id, role=SimpleNamespace(name="student")),
            db,
        )
    )

    assert result.status == "active"
    assert result.student_id == student_id
    assert result.course_id == course.id
    assert db.committed
