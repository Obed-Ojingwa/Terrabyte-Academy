from app.models.user import Permission, Role, User


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
