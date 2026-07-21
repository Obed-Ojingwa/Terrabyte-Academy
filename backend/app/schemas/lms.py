from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.course import CourseResponse


class UserSummary(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CourseSummary(BaseModel):
    id: UUID
    title: str
    slug: str
    thumbnail_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SubmissionResponse(BaseModel):
    id: UUID
    assignment_id: UUID
    student_id: UUID
    s3_key: Optional[str] = None
    text_response: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    status: str
    submitted_at: datetime
    graded_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SubmissionReview(BaseModel):
    score: Optional[float] = None
    feedback: Optional[str] = None
    status: str = "graded"


class SubmissionCreate(BaseModel):
    text_response: Optional[str] = None
    s3_key: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ExamSubmissionCreate(BaseModel):
    answers: dict[str, str] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class LessonProgressResponse(BaseModel):
    lesson_id: UUID
    is_completed: bool
    watch_time_sec: int = 0

    model_config = ConfigDict(from_attributes=True)


class AssignmentCreate(BaseModel):
    course_id: UUID
    tutor_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_score: int = 100


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_score: Optional[int] = None


class AssignmentResponse(BaseModel):
    id: UUID
    course_id: UUID
    tutor_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_score: int
    status: Optional[str] = None
    grade: Optional[float] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    course: Optional[CourseSummary] = None
    tutor: Optional[UserSummary] = None
    submissions: list[SubmissionResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ExamQuestionResponse(BaseModel):
    id: UUID
    exam_id: UUID
    question: str
    type: str
    options: Optional[dict] = None
    correct: Optional[str] = None
    points: int
    position: int

    model_config = ConfigDict(from_attributes=True)


class ExamResultResponse(BaseModel):
    id: UUID
    exam_id: UUID
    student_id: UUID
    score: Optional[float] = None
    answers: Optional[dict] = None
    passed: bool
    taken_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExamCreate(BaseModel):
    course_id: UUID
    title: str
    duration_min: int = 60
    pass_score: float = 70.0


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    duration_min: Optional[int] = None
    pass_score: Optional[float] = None


class ExamResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    duration_min: int
    pass_score: float
    created_at: datetime
    questions: list[ExamQuestionResponse] = Field(default_factory=list)
    results: list[ExamResultResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class EnrollmentCreate(BaseModel):
    course_id: UUID
    mode: str = "online"


class EnrollmentUpdate(BaseModel):
    status: Optional[str] = None
    completed_at: Optional[datetime] = None


class EnrollmentResponse(BaseModel):
    id: UUID
    student_id: UUID
    course_id: UUID
    mode: str
    status: str
    progress: Optional[int] = None
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    student: Optional[UserSummary] = None
    course: Optional[CourseResponse] = None

    model_config = ConfigDict(from_attributes=True)


class CertificateResponse(BaseModel):
    id: UUID
    student_id: UUID
    course_id: UUID
    certificate_number: str
    s3_key: Optional[str] = None
    status: str
    requested_at: datetime
    issued_at: Optional[datetime] = None
    student: Optional[UserSummary] = None
    course: Optional[CourseSummary] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    body: Optional[str] = None
    type: Optional[str] = None
    is_read: bool
    link: Optional[str] = None
    created_at: datetime
    user: Optional[UserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class FeedbackCreate(BaseModel):
    course_id: Optional[UUID] = None
    tutor_id: Optional[UUID] = None
    rating: Optional[int] = None
    comments: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FeedbackResponse(BaseModel):
    id: UUID
    student_id: UUID
    course_id: Optional[UUID] = None
    tutor_id: Optional[UUID] = None
    rating: Optional[int] = None
    comments: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentDashboardResponse(BaseModel):
    enrollments: list[EnrollmentResponse] = Field(default_factory=list)
    upcoming_events: list[EventResponse] = Field(default_factory=list)
    assignments_due: list[AssignmentResponse] = Field(default_factory=list)
    recent_exam_results: list[ExamResultResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class StudentProfileResponse(BaseModel):
    # Personal Information
    id: UUID
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Enrolled Courses
    enrolled_courses: list[EnrollmentResponse] = Field(default_factory=list)

    # Learning Progress (aggregated)
    total_courses_enrolled: int = 0
    total_courses_completed: int = 0
    overall_progress_percentage: int = 0

    # Assignment History
    assignment_submissions: list[SubmissionResponse] = Field(default_factory=list)
    total_assignments_submitted: int = 0
    total_assignments_graded: int = 0
    average_assignment_score: Optional[float] = None

    # Exam Results
    exam_results: list[ExamResultResponse] = Field(default_factory=list)
    total_exams_taken: int = 0
    total_exams_passed: int = 0
    average_exam_score: Optional[float] = None

    # Certificates Obtained
    certificates: list[CertificateResponse] = Field(default_factory=list)
    total_certificates_earned: int = 0

    model_config = ConfigDict(from_attributes=True)