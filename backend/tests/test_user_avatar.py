import asyncio
from io import BytesIO
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from starlette.datastructures import Headers, UploadFile

from app.api.v1 import storage, users


class FakeDB:
    def __init__(self):
        self.added = []
        self.committed = False

    def add(self, instance):
        self.added.append(instance)

    async def commit(self):
        self.committed = True

    async def refresh(self, instance):
        return None


def make_upload(contents: bytes, content_type: str = "image/png", filename: str = "avatar.png") -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(contents),
        headers=Headers({"content-type": content_type}),
    )


def test_avatar_upload_rejects_non_students():
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            users.upload_my_avatar(
                make_upload(b"\x89PNG\r\n\x1a\nimage"),
                SimpleNamespace(id=uuid4(), role=SimpleNamespace(name="tutor")),
                FakeDB(),
            )
        )

    assert error.value.status_code == 403


def test_avatar_upload_rejects_invalid_image_content():
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            users.upload_my_avatar(
                make_upload(b"not a png"),
                SimpleNamespace(id=uuid4(), role=SimpleNamespace(name="student")),
                FakeDB(),
            )
        )

    assert error.value.status_code == 415


def test_avatar_upload_rejects_files_over_size_limit():
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            users.upload_my_avatar(
                make_upload(b"\x89PNG\r\n\x1a\n" + b"x" * users.MAX_AVATAR_SIZE),
                SimpleNamespace(id=uuid4(), role=SimpleNamespace(name="student")),
                FakeDB(),
            )
        )

    assert error.value.status_code == 413


def test_student_avatar_upload_persists_storage_url(monkeypatch):
    uploaded = {}

    class FakeStorage:
        def upload_file(self, key, contents, content_type):
            uploaded.update(key=key, contents=contents, content_type=content_type)

        def get_public_url(self, key):
            return f"https://cdn.example/{key}"

    monkeypatch.setattr(users, "StorageService", FakeStorage)
    student = SimpleNamespace(id=uuid4(), role=SimpleNamespace(name="student"), avatar_url=None)
    db = FakeDB()

    result = asyncio.run(
        users.upload_my_avatar(
            make_upload(b"\x89PNG\r\n\x1a\nimage"),
            student,
            db,
        )
    )

    assert result["avatar_url"].startswith("https://cdn.example/avatars/")
    assert student.avatar_url == result["avatar_url"]
    assert uploaded["content_type"] == "image/png"
    assert db.added == [student]
    assert db.committed


def test_course_thumbnail_upload_validates_image_and_uses_generated_key(monkeypatch):
    uploaded = {}

    class FakeStorage:
        def upload_file(self, key, contents, content_type):
            uploaded.update(key=key, contents=contents, content_type=content_type)

        def get_public_url(self, key):
            return f"https://cdn.example/{key}"

    monkeypatch.setattr(storage, "StorageService", FakeStorage)
    admin = SimpleNamespace(id=uuid4(), role=SimpleNamespace(name="admin"))
    content = b"\x89PNG\r\n\x1a\nimage"

    result = asyncio.run(
        storage.upload_course_thumbnail(
            make_upload(content, filename="../../unsafe.png"),
            admin,
        )
    )

    assert result["key"].startswith(f"course-thumbnails/{admin.id}/")
    assert result["key"].endswith(".png")
    assert "unsafe" not in result["key"]
    assert result["url"] == f"https://cdn.example/{result['key']}"
    assert uploaded == {
        "key": result["key"],
        "contents": content,
        "content_type": "image/png",
    }


@pytest.mark.parametrize(
    ("contents", "content_type", "expected_status"),
    [
        (b"not an image", "image/png", 415),
        (b"\x89PNG\r\n\x1a\n" + b"x" * storage.MAX_COURSE_THUMBNAIL_SIZE, "image/png", 413),
        (b"<svg></svg>", "image/svg+xml", 415),
    ],
    ids=["invalid-signature", "oversized-image", "svg-image"],
)
def test_course_thumbnail_upload_rejects_invalid_files(contents, content_type, expected_status):
    admin = SimpleNamespace(id=uuid4(), role=SimpleNamespace(name="admin"))

    with pytest.raises(HTTPException) as error:
        asyncio.run(storage.upload_course_thumbnail(make_upload(contents, content_type), admin))

    assert error.value.status_code == expected_status
