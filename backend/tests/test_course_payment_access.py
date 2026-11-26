import asyncio
from types import SimpleNamespace
from datetime import datetime
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.v1.storage import serve_storage_file
from app.services.course_access_service import require_course_access
from app.services.course_service import _course_catalog_response


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeDB:
    def __init__(self, *results):
        self.results = list(results)

    async def execute(self, statement):
        return self.results.pop(0)


def test_pending_student_cannot_access_course_material():
    student = SimpleNamespace(id=uuid4(), role=SimpleNamespace(name="student"))
    db = FakeDB(FakeResult(None))

    with pytest.raises(HTTPException) as error:
        asyncio.run(require_course_access(db, student, uuid4()))

    assert error.value.status_code == 403
    assert "locked until payment is approved" in error.value.detail


def test_active_enrollment_grants_course_access():
    student = SimpleNamespace(id=uuid4(), role=SimpleNamespace(name="student"))
    db = FakeDB(FakeResult(uuid4()))

    asyncio.run(require_course_access(db, student, uuid4()))


def test_material_storage_url_requires_authentication():
    with pytest.raises(HTTPException) as error:
        asyncio.run(serve_storage_file("materials/course/lesson/file.pdf", None, FakeDB()))

    assert error.value.status_code == 401


def test_public_storage_assets_remain_available_without_login(monkeypatch):
    class FakeStorage:
        def download_file(self, key):
            assert key == "avatars/student/profile.png"
            return b"image"

    monkeypatch.setattr("app.api.v1.storage.StorageService", FakeStorage)
    response = asyncio.run(serve_storage_file("avatars/student/profile.png", None, FakeDB()))

    assert response.body == b"image"
    assert response.media_type == "image/png"


def test_public_course_catalog_never_returns_material_urls():
    material = SimpleNamespace(
        id=uuid4(),
        lesson_id=uuid4(),
        title="Lesson PDF",
        type="application/pdf",
        s3_key="materials/private/lesson.pdf",
        url="https://storage.example/private/lesson.pdf",
        is_downloadable=True,
        size_bytes=1024,
        created_at=datetime.utcnow(),
    )
    lesson = SimpleNamespace(
        id=uuid4(),
        title="Lesson",
        position=0,
        duration_min=30,
        is_preview=False,
        is_completed=False,
        materials=[material],
    )
    module = SimpleNamespace(id=uuid4(), title="Module", position=0, lessons=[lesson])
    course = SimpleNamespace(
        id=uuid4(),
        title="Course",
        slug="course",
        description="Course description",
        thumbnail_url=None,
        price=50000,
        mode="online",
        category="Technology",
        level="beginner",
        duration_weeks=4,
        start_date=None,
        end_date=None,
        requirements=["Basic computer skills"],
        learning_outcomes=["Create a GIS map"],
        topics=["Coordinate systems"],
        course_outline=[{"title": "Module 1", "topics": ["GIS concepts"]}],
        is_published=True,
        tutor=None,
        modules=[module],
        created_at=datetime.utcnow(),
    )

    response = _course_catalog_response(course)

    assert response.description == "Course description"
    assert response.requirements == ["Basic computer skills"]
    assert response.learning_outcomes == ["Create a GIS map"]
    assert response.course_outline[0].title == "Module 1"
    assert response.modules[0].lessons[0].materials == []
