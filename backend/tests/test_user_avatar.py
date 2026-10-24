import asyncio
from io import BytesIO
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from starlette.datastructures import Headers, UploadFile

from app.api.v1 import users


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


def make_upload(contents: bytes, content_type: str = "image/png") -> UploadFile:
    return UploadFile(
        filename="avatar.png",
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
