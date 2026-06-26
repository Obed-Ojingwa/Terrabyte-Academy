from app.schemas.auth import TokenResponse, UserResponse
from app.schemas.course import CourseResponse, CourseTutorSummary, CourseModuleSummary, CourseLessonSummary
from app.schemas.lms import AssignmentCreate, AssignmentResponse, CertificateResponse, EnrollmentCreate, EnrollmentResponse, ExamCreate, ExamResponse, NotificationResponse, SubmissionResponse


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


class DummyEnrollment:
    def __init__(self):
        self.id = "33333333-3333-3333-3333-333333333333"
        self.student_id = "44444444-4444-4444-4444-444444444444"
        self.course_id = "22222222-2222-2222-2222-222222222222"
        self.mode = "online"
        self.status = "active"
        self.enrolled_at = "2024-01-02T00:00:00"
        self.completed_at = None
        self.student = DummyTutor()
        self.course = DummyCourse()


class DummyAssignment:
    def __init__(self):
        self.id = "55555555-5555-5555-5555-555555555555"
        self.course_id = "22222222-2222-2222-2222-222222222222"
        self.tutor_id = "11111111-1111-1111-1111-111111111111"
        self.title = "Build a script"
        self.description = "Write a Python script"
        self.due_date = "2024-02-01T00:00:00"
        self.max_score = 100
        self.created_at = "2024-01-03T00:00:00"
        self.course = DummyCourse()
        self.tutor = DummyTutor()
        self.submissions = []


class DummySubmission:
    def __init__(self):
        self.id = "66666666-6666-6666-6666-666666666666"
        self.assignment_id = "55555555-5555-5555-5555-555555555555"
        self.student_id = "44444444-4444-4444-4444-444444444444"
        self.s3_key = None
        self.text_response = "Done"
        self.score = 90.0
        self.feedback = "Great work"
        self.status = "graded"
        self.submitted_at = "2024-01-04T00:00:00"
        self.graded_at = "2024-01-05T00:00:00"
        self.assignment = DummyAssignment()
        self.student = DummyTutor()


class DummyExam:
    def __init__(self):
        self.id = "77777777-7777-7777-7777-777777777777"
        self.course_id = "22222222-2222-2222-2222-222222222222"
        self.title = "Python Basics Quiz"
        self.duration_min = 45
        self.pass_score = 70.0
        self.created_at = "2024-01-06T00:00:00"
        self.questions = []
        self.results = []


class DummyCertificate:
    def __init__(self):
        self.id = "88888888-8888-8888-8888-888888888888"
        self.student_id = "44444444-4444-4444-4444-444444444444"
        self.course_id = "22222222-2222-2222-2222-222222222222"
        self.certificate_number = "TBA-12345"
        self.s3_key = None
        self.status = "issued"
        self.requested_at = "2024-01-07T00:00:00"
        self.issued_at = "2024-01-08T00:00:00"
        self.student = DummyTutor()
        self.course = DummyCourse()


class DummyNotification:
    def __init__(self):
        self.id = "99999999-9999-9999-9999-999999999999"
        self.user_id = "44444444-4444-4444-4444-444444444444"
        self.title = "Assignment due"
        self.body = "Your assignment is due tomorrow"
        self.type = "assignment"
        self.is_read = False
        self.link = None
        self.created_at = "2024-01-09T00:00:00"
        self.user = DummyTutor()


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


def test_course_response_accepts_nested_module_progression():
    course = DummyCourse()
    course.modules = [
        type(
            "Module",
            (),
            {
                "id": "33333333-3333-3333-3333-333333333333",
                "title": "Setup",
                "position": 1,
                "lessons": [
                    type(
                        "Lesson",
                        (),
                        {
                            "id": "44444444-4444-4444-4444-444444444444",
                            "title": "Intro",
                            "position": 1,
                            "duration_min": 10,
                            "is_preview": False,
                            "is_completed": True,
                        },
                    )()
                ],
            },
        )()
    ]

    response = CourseResponse.model_validate(course)

    assert response.modules is not None
    assert response.modules[0].title == "Setup"
    assert response.modules[0].lessons[0].title == "Intro"
    assert isinstance(response.modules[0].lessons[0], CourseLessonSummary)


def test_lms_enrollment_and_assignment_contracts_validate():
    enrollment = EnrollmentResponse.model_validate(DummyEnrollment())
    assignment = AssignmentResponse.model_validate(DummyAssignment())
    submission = SubmissionResponse.model_validate(DummySubmission())

    assert enrollment.status == "active"
    assert enrollment.student is not None
    assert assignment.tutor is not None
    assert submission.score == 90.0


def test_lms_exam_certificate_and_notification_contracts_validate():
    exam = ExamResponse.model_validate(DummyExam())
    certificate = CertificateResponse.model_validate(DummyCertificate())
    notification = NotificationResponse.model_validate(DummyNotification())

    assert exam.title == "Python Basics Quiz"
    assert certificate.status == "issued"
    assert notification.type == "assignment"


def test_lms_create_payloads_accept_expected_fields():
    assignment = AssignmentCreate(course_id="22222222-2222-2222-2222-222222222222", title="Week 1 task", due_date="2024-02-01T00:00:00", max_score=100)
    exam = ExamCreate(course_id="22222222-2222-2222-2222-222222222222", title="Midterm", duration_min=60, pass_score=70.0)
    enrollment = EnrollmentCreate(course_id="22222222-2222-2222-2222-222222222222", mode="online")

    assert assignment.title == "Week 1 task"
    assert exam.pass_score == 70.0
    assert enrollment.mode == "online"
