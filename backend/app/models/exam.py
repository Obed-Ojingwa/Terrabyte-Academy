import uuid
from sqlalchemy import String, Boolean, ForeignKey, Integer, Text, DateTime, Numeric, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime, timezone
from app.database import Base


class Exam(Base):
    __tablename__ = "exams"
    __table_args__ = (
        CheckConstraint("max_attempts BETWEEN 1 AND 10", name="ck_exams_max_attempts"),
        CheckConstraint(
            "available_from IS NULL OR available_until IS NULL OR available_from < available_until",
            name="ck_exams_availability_window",
        ),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    duration_min: Mapped[int] = mapped_column(Integer, default=60)
    pass_score: Mapped[float] = mapped_column(Numeric(5, 2), default=50.0)
    available_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    available_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    max_attempts: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    questions: Mapped[list["ExamQuestion"]] = relationship(back_populates="exam", order_by="ExamQuestion.position")
    results: Mapped[list["ExamResult"]] = relationship(back_populates="exam")


class ExamQuestion(Base):
    __tablename__ = "exam_questions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"))
    question: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(50))
    options: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    correct: Mapped[str | None] = mapped_column(Text, nullable=True)
    points: Mapped[int] = mapped_column(Integer, default=1)
    position: Mapped[int] = mapped_column(Integer, default=0)
    exam: Mapped["Exam"] = relationship(back_populates="questions")


class ExamResult(Base):
    __tablename__ = "exam_results"
    __table_args__ = (
        UniqueConstraint("exam_id", "student_id", "attempt_number", name="uq_exam_results_attempt"),
        CheckConstraint("attempt_number >= 1", name="ck_exam_results_attempt_number"),
        CheckConstraint(
            "status IN ('in_progress', 'expired', 'pending_review', 'graded')",
            name="ck_exam_results_status",
        ),
        Index("ix_exam_results_exam_student", "exam_id", "student_id"),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"))
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="graded", server_default="graded")
    auto_score: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    score: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    answers: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    manual_grades: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    taken_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    exam: Mapped["Exam"] = relationship(back_populates="results")
