import uuid
from sqlalchemy import String, Boolean, ForeignKey, Integer, Text, DateTime, Numeric
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
from app.database import Base


class Exam(Base):
    __tablename__ = "exams"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    duration_min: Mapped[int] = mapped_column(Integer, default=60)
    pass_score: Mapped[float] = mapped_column(Numeric(5, 2), default=50.0)
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
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"))
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    answers: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    taken_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    exam: Mapped["Exam"] = relationship(back_populates="results")
