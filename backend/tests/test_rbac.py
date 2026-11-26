import asyncio
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api import deps
from app.models.user import Permission, Role, User
from app.schemas.course import CourseCreate, CourseUpdate
from app.services.course_service import CourseService


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeDB:
    def __init__(self, result):
        self.result = result
        self.committed = False

    async def execute(self, query):
        return self.result

    async def commit(self):
        self.committed = True


def test_role_can_check_permission_from_relationship():
    role = Role(name="admin")
    permission = Permission(name="manage_courses", description="Manage courses")
    role.permissions = [permission]

    assert role.has_permission("manage_courses") is True
    assert role.has_permission("manage_users") is False


def test_user_can_delegate_permission_checks_to_role():
    role = Role(name="tutor")
    permission = Permission(name="manage_courses", description="Manage assigned courses")
    role.permissions = [permission]

    user = User(first_name="Ada", last_name="Lovelace", email="ada@example.com", password_hash="x", role=role)

    assert user.has_permission("manage_courses") is True
    assert user.has_permission("manage_users") is False


@pytest.mark.parametrize("role_name", ["admin", "super_admin"])
def test_admin_course_permission_includes_both_admin_roles(role_name):
    user = SimpleNamespace(role=SimpleNamespace(name=role_name))

    assert asyncio.run(deps.require_admin(current_user=user)) is user


def test_admin_course_permission_rejects_tutors():
    user = SimpleNamespace(role=SimpleNamespace(name="tutor"))

    with pytest.raises(HTTPException) as error:
        asyncio.run(deps.require_admin(current_user=user))

    assert error.value.status_code == 403


def test_course_create_rejects_assignee_without_tutor_role():
    service = CourseService(FakeDB(FakeResult(None)))
    admin = SimpleNamespace(id=uuid4(), role=SimpleNamespace(name="admin"))
    payload = CourseCreate(title="GIS Fundamentals", mode="online", tutor_id=uuid4())

    with pytest.raises(HTTPException) as error:
        asyncio.run(service.create_course(payload, admin))

    assert error.value.status_code == 404


def test_tutor_cannot_change_admin_managed_course_fields():
    tutor_id = uuid4()
    course = SimpleNamespace(id=uuid4(), tutor_id=tutor_id)
    service = CourseService(FakeDB(FakeResult(course)))
    tutor = SimpleNamespace(id=tutor_id, role=SimpleNamespace(name="tutor"))

    with pytest.raises(HTTPException) as error:
        asyncio.run(service.update_course(str(course.id), CourseUpdate(is_published=True), tutor))

    assert error.value.status_code == 403
    assert not service.db.committed
