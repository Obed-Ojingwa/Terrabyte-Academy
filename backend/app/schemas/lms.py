from datetime import datetime
import json
from typing import Any, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.course import CourseResponse
from app.schemas.content import EventResponse


class UserSummary(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CertificateStudentSummary(UserSummary):
    certificate_name: Optional[str] = None


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
    attempt_id: UUID
    answers: dict[str, str] = Field(default_factory=dict)

    @field_validator("answers")
    @classmethod
    def validate_answer_lengths(cls, answers: dict[str, str]) -> dict[str, str]:
        if any(len(answer) > 10000 for answer in answers.values()):
            raise ValueError("Answers cannot exceed 10,000 characters")
        return answers

    model_config = ConfigDict(from_attributes=True)


class ExamAttemptStartResponse(BaseModel):
    attempt_id: UUID
    attempt_number: int
    started_at: datetime
    expires_at: datetime
    status: Literal["in_progress"]


class ExamManualGradeSubmission(BaseModel):
    grades: dict[str, float]
    feedback: str | None = Field(default=None, max_length=10000)

    model_config = ConfigDict(extra="forbid")


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


class ExamChoice(BaseModel):
    id: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    text: str = Field(min_length=1, max_length=500)

    model_config = ConfigDict(extra="forbid")

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Choice text cannot be blank")
        return value


class ExamQuestionDefinition(BaseModel):
    question: str = Field(min_length=1, max_length=10000)
    type: Literal["single_choice", "multiple_choice", "true_false", "short_answer", "essay"]
    options: dict[str, Any] | None = None
    correct: str | None = Field(default=None, max_length=10000)
    points: int = Field(default=1, ge=1, le=1000)

    model_config = ConfigDict(extra="forbid")

    @field_validator("question")
    @classmethod
    def strip_question(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Question text cannot be blank")
        return value

    @field_validator("correct", mode="before")
    @classmethod
    def encode_multiple_choice_answer(cls, value: Any) -> Any:
        if isinstance(value, list) and all(isinstance(item, str) for item in value):
            return json.dumps(value, separators=(",", ":"))
        return value

    @model_validator(mode="after")
    def validate_type_contract(self):
        if self.type in {"single_choice", "multiple_choice"}:
            if not isinstance(self.options, dict) or set(self.options) != {"choices"}:
                raise ValueError("Choice questions require options.choices")
            raw_choices = self.options["choices"]
            if not isinstance(raw_choices, list) or len(raw_choices) < 2:
                raise ValueError("Choice questions require at least two choices")
            choices = [ExamChoice.model_validate(choice) for choice in raw_choices]
            choice_ids = [choice.id for choice in choices]
            if len(choice_ids) != len(set(choice_ids)):
                raise ValueError("Choice IDs must be unique")
            self.options = {"choices": [choice.model_dump() for choice in choices]}

            if self.type == "single_choice":
                if self.correct not in choice_ids:
                    raise ValueError("Correct answer must be one of the choice IDs")
            else:
                try:
                    correct_ids = json.loads(self.correct or "")
                except json.JSONDecodeError as error:
                    raise ValueError("Multiple-choice correct answer must be a JSON array of choice IDs") from error
                if (
                    not isinstance(correct_ids, list)
                    or not correct_ids
                    or any(not isinstance(item, str) for item in correct_ids)
                    or len(correct_ids) != len(set(correct_ids))
                    or not set(correct_ids).issubset(choice_ids)
                ):
                    raise ValueError("Multiple-choice correct answer must contain unique valid choice IDs")
                self.correct = json.dumps(sorted(correct_ids), separators=(",", ":"))
        elif self.type == "true_false":
            if self.options is not None:
                raise ValueError("True/false questions do not accept options")
            if self.correct not in {"true", "false"}:
                raise ValueError("True/false correct answer must be 'true' or 'false'")
        elif self.type == "short_answer":
            if self.options is not None or not self.correct or not self.correct.strip():
                raise ValueError("Short-answer questions require a correct answer and no options")
            self.correct = self.correct.strip()
        elif self.type == "essay":
            if self.options is not None or self.correct is not None:
                raise ValueError("Essay questions do not accept options or an automatic correct answer")
        return self


class ExamQuestionCreate(ExamQuestionDefinition):
    position: int | None = Field(default=None, ge=0)


class ExamQuestionUpdate(BaseModel):
    question: str | None = Field(default=None, min_length=1, max_length=10000)
    type: Literal["single_choice", "multiple_choice", "true_false", "short_answer", "essay"] | None = None
    options: dict[str, Any] | None = None
    correct: str | list[str] | None = Field(default=None, max_length=10000)
    points: int | None = Field(default=None, ge=1, le=1000)

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def require_update_fields(self):
        if not self.model_fields_set:
            raise ValueError("At least one question field must be provided")
        return self


class ExamQuestionReorder(BaseModel):
    question_ids: list[UUID]

    model_config = ConfigDict(extra="forbid")


class ExamStudentQuestionResponse(BaseModel):
    id: UUID
    exam_id: UUID
    question: str
    type: str
    options: Optional[dict] = None
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
    attempt_number: int = 1
    started_at: datetime | None = None
    expires_at: datetime | None = None
    submitted_at: datetime | None = None
    status: Literal["in_progress", "expired", "pending_review", "graded"] = "graded"
    feedback: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ExamCreate(BaseModel):
    course_id: UUID
    title: str = Field(min_length=1, max_length=255)
    duration_min: int = Field(default=60, ge=1, le=1440)
    pass_score: float = Field(default=70.0, ge=0, le=100)
    available_from: datetime | None = None
    available_until: datetime | None = None
    max_attempts: int = Field(default=1, ge=1, le=10)

    @field_validator("available_from", "available_until")
    @classmethod
    def require_timezone(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.utcoffset() is None:
            raise ValueError("Availability timestamps must include a timezone")
        return value

    @model_validator(mode="after")
    def validate_availability_window(self):
        if self.available_from and self.available_until and self.available_from >= self.available_until:
            raise ValueError("available_until must be later than available_from")
        return self


class ExamUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    duration_min: Optional[int] = Field(default=None, ge=1, le=1440)
    pass_score: Optional[float] = Field(default=None, ge=0, le=100)
    available_from: datetime | None = None
    available_until: datetime | None = None
    max_attempts: int | None = Field(default=None, ge=1, le=10)

    @field_validator("available_from", "available_until")
    @classmethod
    def require_timezone(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.utcoffset() is None:
            raise ValueError("Availability timestamps must include a timezone")
        return value

    @model_validator(mode="after")
    def validate_availability_window(self):
        if self.available_from and self.available_until and self.available_from >= self.available_until:
            raise ValueError("available_until must be later than available_from")
        return self


class ExamResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    duration_min: int
    pass_score: float
    available_from: datetime | None = None
    available_until: datetime | None = None
    max_attempts: int = 1
    created_at: datetime
    questions: list[ExamStudentQuestionResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ExamManagementResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    duration_min: int
    pass_score: float
    available_from: datetime | None = None
    available_until: datetime | None = None
    max_attempts: int = 1
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
    student: Optional[CertificateStudentSummary] = None
    course: Optional[CourseResponse] = None

    model_config = ConfigDict(from_attributes=True)


class CertificateResponse(BaseModel):
    id: UUID
    student_id: UUID
    course_id: UUID
    certificate_number: str
    recipient_name: Optional[str] = None
    status: str
    pdf_available: bool = False
    requested_at: datetime
    issued_at: Optional[datetime] = None
    student: Optional[UserSummary] = None
    course: Optional[CourseSummary] = None

    model_config = ConfigDict(from_attributes=True)


class CertificateVerificationResponse(BaseModel):
    certificate_number: str
    recipient_name: str
    course_title: str
    issued_at: datetime
    status: Literal["issued"]
    issuer: str = "Terrabyte Academy"


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
    certificate_name: Optional[str] = None
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