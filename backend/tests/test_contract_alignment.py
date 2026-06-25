from app.schemas.auth import TokenResponse, UserResponse
from app.schemas.course import CourseResponse, CourseTutorSummary


class DummyTutor:
    def __init__(self):
        self.id = "11111111-1111-1111-1111-111111111111"
        self.first_name = "Ada"
        self.last_name = "Lovelace"
        self.avatar_url = None


class DummyCourse:
    def __init__(self):
        self.id = "22222222-2222-2222-2222-222222222222"
        self.title = "Python Basics"
        self.slug = "python-basics"
        self.description = "Intro"
        self.thumbnail_url = None
        self.price = 49.99
        self.mode = "online"
        self.category = "Programming"
        self.level = "beginner"
        self.duration_weeks = 4
        self.is_published = True
        self.created_at = "2024-01-01T00:00:00"
        self.tutor = DummyTutor()


def test_token_response_uses_structured_user_contract():
    user = UserResponse(
        id="user-1",
        email="student@example.com",
        first_name="Jane",
        last_name="Doe",
        phone=None,
        avatar_url=None,
        role={"name": "student"},
        is_active=True,
        is_verified=True,
        created_at="2024-01-01T00:00:00",
    )
    response = TokenResponse(access_token="access", refresh_token="refresh", user=user)

    assert response.user.role.name == "student"
    assert response.user.first_name == "Jane"


def test_course_response_includes_tutor_summary():
    response = CourseResponse.model_validate(DummyCourse())

    assert response.tutor is not None
    assert response.tutor.first_name == "Ada"
    assert response.tutor.last_name == "Lovelace"
    assert isinstance(response.tutor, CourseTutorSummary)
