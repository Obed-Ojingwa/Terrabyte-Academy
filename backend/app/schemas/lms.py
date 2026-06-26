from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


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
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    student: Optional[UserSummary] = None
    course: Optional[CourseSummary] = None

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
